const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

// Database connection configuration
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "bloodsync",
  port: 5432,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20,
});

// Email transporter setup (configure SMTP via environment variables)
// For Gmail, set SMTP_USER to your Gmail address and SMTP_PASS to an App Password
// https://support.google.com/accounts/answer/185833
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

// Test connection on startup
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Database connection test successful');
    client.release();
    return true;
  } catch (err) {
    console.error('Database connection test failed:', err);
    return false;
  }
};

// Ensure user_doh table exists on startup
const ensureUserTable = async () => {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS user_doh (
        user_id SERIAL PRIMARY KEY,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('Admin','Doctor','Medical Technologist','Scheduler')),
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        is_active BOOLEAN DEFAULT FALSE,
        activation_token UUID,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    await pool.query(query);
    console.log('User table ensured successfully');
    return true;
  } catch (error) {
    console.error('Error ensuring user_doh table:', error);
    throw error;
  }
};

// Ensure password reset tokens table exists
const ensurePasswordResetTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES user_doh(user_id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        reset_token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Password reset table ensured successfully');
    return true;
  } catch (error) {
    console.error('Error ensuring password_reset_tokens table:', error);
    throw error;
  }
};

// Email sending functions
const sendSuperAdminApprovalEmail = async (fullName, email, activationLink) => {
  try {
    console.log('Preparing to send approval email...');
    console.log('SMTP_USER:', process.env.SMTP_USER);
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***hidden***' : 'NOT SET');
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('SMTP credentials (SMTP_USER/SMTP_PASS) not set. Skipping email sending.');
      return;
    }

    const to = 'bloodsync.doh@gmail.com';
    const subject = 'New User Email Activation';
    const text = `New User Email Activation

A new user "${fullName}", with an email address "${email}", click this link to activate this user.
${activationLink}

If this is not a verified user, please ignore this message.`;

    console.log('Sending email to:', to);
    console.log('Email subject:', subject);
    
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      text,
    });
    
    console.log('Email sent successfully.');
  } catch (error) {
    console.error('Error sending Super Admin approval email:', error);
  }
};

const sendPasswordResetEmail = async (email, resetToken, userName) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('SMTP not configured. Reset code:', resetToken);
      console.log(`[EMAIL NOT CONFIGURED] Would send to ${email}: Your reset code is ${resetToken}`);
      return Promise.resolve(); // Explicitly return resolved promise
    }

    const subject = 'BloodSync - Password Reset Code';
    const text = `Hello ${userName},

Your password reset code is: ${resetToken}

This code expires in 15 minutes.

If you did not request this password reset, please ignore this email.`;

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject,
      text
    });

    console.log('Reset email sent to:', email);
  } catch (error) {
    console.error('Email sending error:', error);
  }
};

// Database service object
const dbService = {
  // Initialize database tables
  async initializeTables() {
    try {
      await ensureUserTable();
      await ensurePasswordResetTable();
      console.log('All database tables initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing database tables:', error);
      throw error;
    }
  },

  // User management methods
  async ensureUserTable() {
    return await ensureUserTable();
  },

  async registerUser(user) {
    try {
      const full_name = (user.full_name || user.name || '').trim();
      const role = (user.role || '').trim();
      const email = (user.email || '').trim();
      const password = user.password || '';

      const allowedRoles = ['Admin', 'Doctor', 'Medical Technologist', 'Scheduler'];

      if (!full_name || !email || !password) {
        throw new Error('Missing required fields');
      }
      if (!allowedRoles.includes(role)) {
        throw new Error('Invalid role');
      }

      // Check if email already exists
      const exists = await pool.query('SELECT 1 FROM user_doh WHERE email = $1', [email]);
      if (exists.rowCount > 0) {
        throw new Error('Email is already registered');
      }

      const password_hash = await bcrypt.hash(password, 10);
      const activation_token = crypto.randomUUID();

      const insert = await pool.query(
        `INSERT INTO user_doh (full_name, role, email, password_hash, is_active, activation_token, created_at)
         VALUES ($1, $2, $3, $4, FALSE, $5, NOW()) RETURNING user_id`,
        [full_name, role, email, password_hash, activation_token]
      );

      // For Electron app, just send the token - user will need to paste it or we can use a custom protocol
      const activationLink = `Activation Token: ${activation_token}\n\nTo activate this user, paste this token in the BloodSync application activation page, or click: http://localhost:5173/activate?token=${activation_token}`;
      await sendSuperAdminApprovalEmail(full_name, email, activationLink);

      return { userId: insert.rows[0].user_id, activationToken: activation_token };
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  },

  async loginUser(email, password) {
    try {
      const result = await pool.query(
        `SELECT user_id, email, password_hash, role, is_active, full_name FROM user_doh WHERE email = $1`,
        [email]
      );

      if (result.rowCount === 0) {
        throw new Error('Invalid credentials');
      }

      const user = result.rows[0];

      if (!user.is_active) {
        throw new Error('Account not activated');
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);

      if (!isMatch) {
        throw new Error('Invalid credentials');
      }

      return { userId: user.user_id, email: user.email, role: user.role, fullName: user.full_name };
    } catch (error) {
      console.error('Error logging in user:', error);
      throw error;
    }
  },

  async activateUserByToken(token) {
    try {
      // First, check if user exists and get current status
      const checkUser = await pool.query(
        `SELECT user_id, is_active FROM user_doh WHERE activation_token = $1`,
        [token]
      );

      console.log('[DB] User check result:', checkUser.rows[0]);

      if (checkUser.rowCount === 0) {
        console.log('[DB] No user found with token:', token);
        return false;
      }

      if (checkUser.rows[0].is_active) {
        console.log('[DB] User already active');
        return true;
      }

      // Proceed with activation
      const result = await pool.query(
        `UPDATE user_doh SET is_active = TRUE WHERE activation_token = $1 AND is_active = FALSE RETURNING user_id, is_active`,
        [token]
      );

      console.log('[DB] Activation update result:', result.rows[0]);

      // Verify the update
      if (result.rowCount > 0) {
        const verify = await pool.query(
          `SELECT is_active FROM user_doh WHERE activation_token = $1`,
          [token]
        );
        console.log('[DB] Verification result:', verify.rows[0]);
        return verify.rows[0].is_active === true;
      }

      return false;
    } catch (error) {
      console.error('[DB] Error activating user:', error);
      throw error;
    }
  },

  async declineUserByToken(token) {
    try {
      const result = await pool.query(
        `DELETE FROM user_doh WHERE activation_token = $1 RETURNING user_id`,
        [token]
      );
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error declining user:', error);
      throw error;
    }
  },

  // Password reset methods
  async generatePasswordResetToken(email) {
    try {
      // Check if user exists
      const userCheck = await pool.query(
        'SELECT user_id, full_name, is_active FROM user_doh WHERE email = $1',
        [email]
      );

      if (userCheck.rowCount === 0) {
        throw new Error('Email not found');
      }

      if (!userCheck.rows[0].is_active) {
        throw new Error('Account not activated');
      }

      // Generate 6-digit code
      const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
      const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Delete old tokens for this email
      await pool.query('DELETE FROM password_reset_tokens WHERE email = $1', [email]);

      // Save new token
      await pool.query(
        `INSERT INTO password_reset_tokens (user_id, email, reset_token, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [userCheck.rows[0].user_id, email, resetToken, tokenExpiry]
      );

      // Send reset email
      await sendPasswordResetEmail(email, resetToken, userCheck.rows[0].full_name);

      return {
        success: true,
        resetToken,
        userName: userCheck.rows[0].full_name
      };
    } catch (error) {
      console.error('Error generating password reset token:', error);
      throw error;
    }
  },

  async resetPassword(email, resetToken, newPassword) {
    try {
      // Check if code is valid
      const tokenCheck = await pool.query(
        `SELECT prt.id, prt.user_id, prt.used, prt.expires_at
         FROM password_reset_tokens prt
         WHERE prt.email = $1 AND prt.reset_token = $2`,
        [email, resetToken]
      );

      if (tokenCheck.rowCount === 0) {
        throw new Error('Invalid reset code');
      }

      const token = tokenCheck.rows[0];

      if (token.used) {
        throw new Error('Reset code has already been used');
      }

      if (new Date() > new Date(token.expires_at)) {
        throw new Error('Reset code has expired');
      }

      // Hash new password
      const password_hash = await bcrypt.hash(newPassword, 10);

      // Update password
      await pool.query(
        'UPDATE user_doh SET password_hash = $1 WHERE user_id = $2',
        [password_hash, token.user_id]
      );

      // Mark token as used
      await pool.query(
        'UPDATE password_reset_tokens SET used = TRUE WHERE id = $1',
        [token.id]
      );

      return { success: true };
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  },

  async cleanupExpiredTokens() {
    try {
      const result = await pool.query(
        'DELETE FROM password_reset_tokens WHERE expires_at < NOW() OR used = TRUE'
      );
      console.log(`Cleaned up ${result.rowCount} expired/used tokens`);
      return result.rowCount;
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
      throw error;
    }
  },

  // ========== RED BLOOD CELL METHODS ==========

  // Get all red blood cell stock records (only Stored status)
  async getAllBloodStock() {
    try {
      const query = `
        SELECT 
          bs_id as id,
          bs_serial_id as serial_id,
          bs_blood_type as type,
          bs_rh_factor as "rhFactor",
          bs_volume as volume,
          TO_CHAR(bs_timestamp, 'MM/DD/YYYY') as collection,
          TO_CHAR(bs_expiration_date, 'MM/DD/YYYY') as expiration,
          bs_status as status,
          TO_CHAR(bs_created_at, 'MM/DD/YYYY-HH24:MI:SS') as created,
          CASE 
            WHEN bs_modified_at IS NOT NULL 
            THEN TO_CHAR(bs_modified_at, 'MM/DD/YYYY-HH24:MI:SS')
            ELSE '-'
          END as modified,
          bs_category as category
        FROM blood_stock 
        WHERE bs_category = 'Red Blood Cell' AND bs_status = 'Stored'
        ORDER BY bs_created_at DESC
      `;
      
      const result = await pool.query(query);
      return result.rows.map(row => ({
        ...row,
        selected: false // Add selection state for UI
      }));
    } catch (error) {
      console.error('Error fetching red blood cell stock:', error);
      throw error;
    }
  },

  // Get blood stock by serial ID for release with search functionality
  async getBloodStockBySerialId(serialId) {
    try {
      // First try exact match
      let query = `
        SELECT
          bs_id as id,
          bs_serial_id as serial_id,
          bs_blood_type as type,
          bs_rh_factor as "rhFactor",
          bs_volume as volume,
          TO_CHAR(bs_timestamp, 'YYYY-MM-DD') as collection,
          TO_CHAR(bs_expiration_date, 'YYYY-MM-DD') as expiration,
          bs_status as status,
          TO_CHAR(bs_created_at, 'MM/DD/YYYY-HH24:MI:SS') as created,
          CASE
            WHEN bs_modified_at IS NOT NULL
            THEN TO_CHAR(bs_modified_at, 'MM/DD/YYYY-HH24:MI:SS')
            ELSE '-'
          END as modified,
          bs_category as category
        FROM blood_stock
        WHERE bs_serial_id = $1 AND bs_category = 'Red Blood Cell' AND bs_status = 'Stored'
      `;

      let result = await pool.query(query, [serialId]);

      // If exact match found, return the first record
      if (result.rows.length > 0) {
        return result.rows[0];
      }

      // If exact match not found, try partial match
      if (serialId.length > 0) {
        query = `
          SELECT
            bs_id as id,
            bs_serial_id as serial_id,
            bs_blood_type as type,
            bs_rh_factor as "rhFactor",
            bs_volume as volume,
            TO_CHAR(bs_timestamp, 'YYYY-MM-DD') as collection,
            TO_CHAR(bs_expiration_date, 'YYYY-MM-DD') as expiration,
            bs_status as status,
            TO_CHAR(bs_created_at, 'MM/DD/YYYY-HH24:MI:SS') as created,
            CASE
              WHEN bs_modified_at IS NOT NULL
              THEN TO_CHAR(bs_modified_at, 'MM/DD/YYYY-HH24:MI:SS')
              ELSE '-'
            END as modified,
            bs_category as category
          FROM blood_stock
          WHERE bs_serial_id ILIKE $1 AND bs_category = 'Red Blood Cell' AND bs_status = 'Stored'
          ORDER BY bs_serial_id
          LIMIT 5
        `;

        result = await pool.query(query, [`%${serialId}%`]);
        return result.rows;
      }

      return null;
    } catch (error) {
      console.error('Error fetching blood stock by serial ID:', error);
      throw error;
    }
  },

  // Add new red blood cell stock record
  async addBloodStock(bloodData) {
    try {
      const query = `
        INSERT INTO blood_stock (
          bs_serial_id, bs_blood_type, bs_rh_factor, bs_volume,
          bs_timestamp, bs_expiration_date, bs_status, bs_created_at, bs_category
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)
        RETURNING bs_id
      `;
      
      const values = [
        bloodData.serial_id,
        bloodData.type,
        bloodData.rhFactor,
        parseInt(bloodData.volume),
        new Date(bloodData.collection),
        new Date(bloodData.expiration),
        bloodData.status || 'Stored',
        'Red Blood Cell'
      ];
      
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error adding red blood cell stock:', error);
      throw error;
    }
  },

  // Update red blood cell stock record
  async updateBloodStock(id, bloodData) {
    try {
      const query = `
        UPDATE blood_stock SET
          bs_serial_id = $2,
          bs_blood_type = $3,
          bs_rh_factor = $4,
          bs_volume = $5,
          bs_timestamp = $6,
          bs_expiration_date = $7,
          bs_status = $8,
          bs_modified_at = NOW(),
          bs_category = $9
        WHERE bs_id = $1
      `;
      
      const values = [
        id,
        bloodData.serial_id,
        bloodData.type,
        bloodData.rhFactor,
        parseInt(bloodData.volume),
        new Date(bloodData.collection),
        new Date(bloodData.expiration),
        bloodData.status || 'Stored',
        'Red Blood Cell'
      ];
      
      await pool.query(query, values);
      return true;
    } catch (error) {
      console.error('Error updating red blood cell stock:', error);
      throw error;
    }
  },


  // Delete red blood cell stock records

  async deleteBloodStock(ids) {
    try {
      const query = 'DELETE FROM blood_stock WHERE bs_id = ANY($1) AND bs_category = \'Red Blood Cell\'';
      await pool.query(query, [ids]);
      return true;
    } catch (error) {
      console.error('Error deleting red blood cell stock:', error);
      throw error;
    }
  },

  // Search red blood cell stock (only Stored status)
  async searchBloodStock(searchTerm) {
    try {
      const query = `
        SELECT 
          bs_id as id,
          bs_serial_id as serial_id,
          bs_blood_type as type,
          bs_rh_factor as "rhFactor",
          bs_volume as volume,
          TO_CHAR(bs_timestamp, 'MM/DD/YYYY') as collection,
          TO_CHAR(bs_expiration_date, 'MM/DD/YYYY') as expiration,
          bs_status as status,
          TO_CHAR(bs_created_at, 'MM/DD/YYYY-HH24:MI:SS') as created,
          CASE 
            WHEN bs_modified_at IS NOT NULL 
            THEN TO_CHAR(bs_modified_at, 'MM/DD/YYYY-HH24:MI:SS')
            ELSE '-'
          END as modified,
          bs_category as category
        FROM blood_stock 
        WHERE 
          bs_category = 'Red Blood Cell' AND bs_status = 'Stored' AND (
            bs_serial_id ILIKE $1 OR 
            bs_blood_type ILIKE $1 OR 
            bs_status ILIKE $1 OR
            bs_rh_factor ILIKE $1
          )
        ORDER BY bs_created_at DESC
      `;
      
      const result = await pool.query(query, [`%${searchTerm}%`]);
      return result.rows.map(row => ({
        ...row,
        selected: false
      }));
    } catch (error) {
      console.error('Error searching red blood cell stock:', error);
      throw error;
    }
  },


  // ========== RELEASE STOCK METHODS ==========

  // Release red blood cell stock - moves records from blood_stock to released_blood
  async releaseBloodStock(releaseData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get the blood stock records to be released
      const getStockQuery = `
        SELECT * FROM blood_stock
        WHERE bs_serial_id = ANY($1) AND bs_category = 'Red Blood Cell' AND bs_status = 'Stored'
      `;
      const stockResult = await client.query(getStockQuery, [releaseData.serialIds]);

      if (stockResult.rows.length === 0) {
        throw new Error('No valid blood stock records found for release');
      }

      // Insert records into released_blood table with status 'Released'
      for (const stockRecord of stockResult.rows) {
        const insertQuery = `
          INSERT INTO released_blood (
            rb_serial_id, rb_blood_type, rb_rh_factor, rb_volume,
            rb_timestamp, rb_expiration_date, rb_status, rb_created_at,
            rb_released_at, rb_category, rb_original_id,
            rb_receiving_facility, rb_address, rb_contact_number,
            rb_classification, rb_authorized_recipient, rb_recipient_designation,
            rb_date_of_release, rb_condition_upon_release, rb_request_reference,
            rb_released_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        `;

        const values = [
          stockRecord.bs_serial_id,
          stockRecord.bs_blood_type,
          stockRecord.bs_rh_factor,
          stockRecord.bs_volume,
          stockRecord.bs_timestamp,
          stockRecord.bs_expiration_date,
          'Released', // Status in released_blood table
          stockRecord.bs_created_at,
          'Red Blood Cell',
          stockRecord.bs_id,
          releaseData.receivingFacility || '',
          releaseData.address || '',
          releaseData.contactNumber || '',
          releaseData.classification || '',
          releaseData.authorizedRecipient || '',
          releaseData.recipientDesignation || '',
          releaseData.dateOfRelease ? new Date(releaseData.dateOfRelease) : new Date(),
          releaseData.conditionUponRelease || '',
          releaseData.requestReference || '',
          releaseData.releasedBy || ''
        ];

        await client.query(insertQuery, values);
      }

      // DELETE records from blood_stock table (don't update status, just remove completely)
      const deleteQuery = `
        DELETE FROM blood_stock
        WHERE bs_serial_id = ANY($1) AND bs_category = 'Red Blood Cell' AND bs_status = 'Stored'
      `;
      await client.query(deleteQuery, [releaseData.serialIds]);

      await client.query('COMMIT');
      return { success: true, releasedCount: stockResult.rows.length };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error releasing blood stock:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Get all released blood records
  async getReleasedBloodStock() {
    try {
      const query = `
        SELECT
          rb_id as id,
          rb_serial_id as serial_id,
          rb_blood_type as type,
          rb_rh_factor as "rhFactor",
          rb_volume as volume,
          TO_CHAR(rb_timestamp, 'MM/DD/YYYY') as collection,
          TO_CHAR(rb_expiration_date, 'MM/DD/YYYY') as expiration,
          rb_status as status,
          TO_CHAR(rb_created_at, 'MM/DD/YYYY-HH24:MI:SS') as created,
          CASE
            WHEN rb_modified_at IS NOT NULL
            THEN TO_CHAR(rb_modified_at, 'MM/DD/YYYY-HH24:MI:SS')
            ELSE '-'
          END as modified,
          TO_CHAR(rb_released_at, 'MM/DD/YYYY-HH24:MI:SS') as releasedAt,
          rb_category as category,
          rb_receiving_facility as receivingFacility,
          rb_address as address,
          rb_contact_number as contactNumber,
          rb_classification as classification,
          rb_authorized_recipient as authorizedRecipient,
          rb_recipient_designation as recipientDesignation,
          TO_CHAR(rb_date_of_release, 'MM/DD/YYYY') as dateOfRelease,
          rb_condition_upon_release as conditionUponRelease,
          rb_request_reference as requestReference,
          rb_released_by as releasedBy
        FROM released_blood
        WHERE rb_category = 'Red Blood Cell'
        ORDER BY rb_released_at DESC
      `;

      const result = await pool.query(query);
      return result.rows.map(row => ({
        ...row,
        selected: false // Add selection state for UI
      }));
    } catch (error) {
      console.error('Error fetching released blood stock:', error);
      throw error;
    }
  },

  // ========== PLATELET METHODS ==========

  // Get all platelet stock records
  async getPlateletStock() {
    try {
      const query = `
        SELECT
          bs_id as id,
          bs_serial_id as serial_id,
          bs_blood_type as type,
          bs_rh_factor as "rhFactor",
          bs_volume as volume,
          TO_CHAR(bs_timestamp, 'MM/DD/YYYY') as collection,
          TO_CHAR(bs_expiration_date, 'MM/DD/YYYY') as expiration,
          bs_status as status,
          TO_CHAR(bs_created_at, 'MM/DD/YYYY-HH24:MI:SS') as created,
          CASE
            WHEN bs_modified_at IS NOT NULL
            THEN TO_CHAR(bs_modified_at, 'MM/DD/YYYY-HH24:MI:SS')
            ELSE '-'
          END as modified,
          bs_category as category
        FROM blood_stock
        WHERE bs_category = 'Platelet'
        ORDER BY bs_created_at DESC
      `;

      const result = await pool.query(query);
      return result.rows.map(row => ({
        ...row,
        selected: false // Add selection state for UI
      }));
    } catch (error) {
      console.error('Error fetching platelet stock:', error);
      throw error;
    }
  },

  // Add new platelet stock record
  async addPlateletStock(plateletData) {
    try {
      const query = `
        INSERT INTO blood_stock (
          bs_serial_id, bs_blood_type, bs_rh_factor, bs_volume,
          bs_timestamp, bs_expiration_date, bs_status, bs_created_at, bs_category
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)
        RETURNING bs_id
      `;

      const values = [
        plateletData.serial_id,
        plateletData.type,
        plateletData.rhFactor,
        parseInt(plateletData.volume),
        new Date(plateletData.collection),
        new Date(plateletData.expiration),
        plateletData.status || 'Stored',
        'Platelet'
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error adding platelet stock:', error);
      throw error;
    }
  },

  // Update platelet stock record
  async updatePlateletStock(id, plateletData) {
    try {
      const query = `
        UPDATE blood_stock SET
          bs_serial_id = $2,
          bs_blood_type = $3,
          bs_rh_factor = $4,
          bs_volume = $5,
          bs_timestamp = $6,
          bs_expiration_date = $7,
          bs_status = $8,
          bs_modified_at = NOW(),
          bs_category = $9
        WHERE bs_id = $1
      `;

      const values = [
        id,
        plateletData.serial_id,
        plateletData.type,
        plateletData.rhFactor,
        parseInt(plateletData.volume),
        new Date(plateletData.collection),
        new Date(plateletData.expiration),
        plateletData.status || 'Stored',
        'Platelet'
      ];

      await pool.query(query, values);
      return true;
    } catch (error) {
      console.error('Error updating platelet stock:', error);
      throw error;
    }
  },

  // Delete platelet stock records
  async deletePlateletStock(ids) {
    try {
      const query = 'DELETE FROM blood_stock WHERE bs_id = ANY($1) AND bs_category = \'Platelet\'';
      await pool.query(query, [ids]);
      return true;
    } catch (error) {
      console.error('Error deleting platelet stock:', error);
      throw error;
    }
  },

  // Search platelet stock
  async searchPlateletStock(searchTerm) {
    try {
      const query = `
        SELECT
          bs_id as id,
          bs_serial_id as serial_id,
          bs_blood_type as type,
          bs_rh_factor as "rhFactor",
          bs_volume as volume,
          TO_CHAR(bs_timestamp, 'MM/DD/YYYY') as collection,
          TO_CHAR(bs_expiration_date, 'MM/DD/YYYY') as expiration,
          bs_status as status,
          TO_CHAR(bs_created_at, 'MM/DD/YYYY-HH24:MI:SS') as created,
          CASE
            WHEN bs_modified_at IS NOT NULL
            THEN TO_CHAR(bs_modified_at, 'MM/DD/YYYY-HH24:MI:SS')
            ELSE '-'
          END as modified,
          bs_category as category
        FROM blood_stock
        WHERE
          bs_category = 'Platelet' AND (
            bs_serial_id ILIKE $1 OR
            bs_blood_type ILIKE $1 OR
            bs_status ILIKE $1 OR
            bs_rh_factor ILIKE $1
          )
        ORDER BY bs_created_at DESC
      `;

      const result = await pool.query(query, [`%${searchTerm}%`]);
      return result.rows.map(row => ({
        ...row,
        selected: false
      }));
    } catch (error) {
      console.error('Error searching platelet stock:', error);
      throw error;
    }
  },

  // ========== PLATELET RELEASE METHODS ==========

  // Get platelet stock by serial ID for release with search functionality
  async getPlateletStockBySerialId(serialId) {
    try {
      // First try exact match
      let query = `
        SELECT
          bs_id as id,
          bs_serial_id as serial_id,
          bs_blood_type as type,
          bs_rh_factor as "rhFactor",
          bs_volume as volume,
          TO_CHAR(bs_timestamp, 'YYYY-MM-DD') as collection,
          TO_CHAR(bs_expiration_date, 'YYYY-MM-DD') as expiration,
          bs_status as status,
          TO_CHAR(bs_created_at, 'MM/DD/YYYY-HH24:MI:SS') as created,
          CASE
            WHEN bs_modified_at IS NOT NULL
            THEN TO_CHAR(bs_modified_at, 'MM/DD/YYYY-HH24:MI:SS')
            ELSE '-'
          END as modified,
          bs_category as category
        FROM blood_stock
        WHERE bs_serial_id = $1 AND bs_category = 'Platelet' AND bs_status = 'Stored'
      `;

      let result = await pool.query(query, [serialId]);

      // If exact match found, return the first record
      if (result.rows.length > 0) {
        return result.rows[0];
      }

      // If exact match not found, try partial match
      if (serialId.length > 0) {
        query = `
          SELECT
            bs_id as id,
            bs_serial_id as serial_id,
            bs_blood_type as type,
            bs_rh_factor as "rhFactor",
            bs_volume as volume,
            TO_CHAR(bs_timestamp, 'YYYY-MM-DD') as collection,
            TO_CHAR(bs_expiration_date, 'YYYY-MM-DD') as expiration,
            bs_status as status,
            TO_CHAR(bs_created_at, 'MM/DD/YYYY-HH24:MI:SS') as created,
            CASE
              WHEN bs_modified_at IS NOT NULL
              THEN TO_CHAR(bs_modified_at, 'MM/DD/YYYY-HH24:MI:SS')
              ELSE '-'
            END as modified,
            bs_category as category
          FROM blood_stock
          WHERE bs_serial_id ILIKE $1 AND bs_category = 'Platelet' AND bs_status = 'Stored'
          ORDER BY bs_serial_id
          LIMIT 5
        `;

        result = await pool.query(query, [`%${serialId}%`]);
        return result.rows;
      }

      return null;
    } catch (error) {
      console.error('Error fetching platelet stock by serial ID:', error);
      throw error;
    }
  },

  // Release platelet stock - moves records from blood_stock to released_blood
  async releasePlateletStock(releaseData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get the platelet stock records to be released
      const getStockQuery = `
        SELECT * FROM blood_stock
        WHERE bs_serial_id = ANY($1) AND bs_category = 'Platelet' AND bs_status = 'Stored'
      `;
      const stockResult = await client.query(getStockQuery, [releaseData.serialIds]);

      if (stockResult.rows.length === 0) {
        throw new Error('No valid platelet stock records found for release');
      }

      // Insert records into released_blood table with status 'Released'
      for (const stockRecord of stockResult.rows) {
        const insertQuery = `
          INSERT INTO released_blood (
            rb_serial_id, rb_blood_type, rb_rh_factor, rb_volume,
            rb_timestamp, rb_expiration_date, rb_status, rb_created_at,
            rb_released_at, rb_category, rb_original_id,
            rb_receiving_facility, rb_address, rb_contact_number,
            rb_classification, rb_authorized_recipient, rb_recipient_designation,
            rb_date_of_release, rb_condition_upon_release, rb_request_reference,
            rb_released_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        `;

        const values = [
          stockRecord.bs_serial_id,
          stockRecord.bs_blood_type,
          stockRecord.bs_rh_factor,
          stockRecord.bs_volume,
          stockRecord.bs_timestamp,
          stockRecord.bs_expiration_date,
          'Released', // Status in released_blood table
          stockRecord.bs_created_at,
          'Platelet',
          stockRecord.bs_id,
          releaseData.receivingFacility || '',
          releaseData.address || '',
          releaseData.contactNumber || '',
          releaseData.classification || '',
          releaseData.authorizedRecipient || '',
          releaseData.recipientDesignation || '',
          releaseData.dateOfRelease ? new Date(releaseData.dateOfRelease) : new Date(),
          releaseData.conditionUponRelease || '',
          releaseData.requestReference || '',
          releaseData.releasedBy || ''
        ];

        await client.query(insertQuery, values);
      }

      // DELETE records from blood_stock table (don't update status, just remove completely)
      const deleteQuery = `
        DELETE FROM blood_stock
        WHERE bs_serial_id = ANY($1) AND bs_category = 'Platelet' AND bs_status = 'Stored'
      `;
      await client.query(deleteQuery, [releaseData.serialIds]);

      await client.query('COMMIT');
      return { success: true, releasedCount: stockResult.rows.length };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error releasing platelet stock:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Get all released platelet records
  async getReleasedPlateletStock() {
    try {
      const query = `
        SELECT
          rb_id as id,
          rb_serial_id as serial_id,
          rb_blood_type as type,
          rb_rh_factor as "rhFactor",
          rb_volume as volume,
          TO_CHAR(rb_timestamp, 'MM/DD/YYYY') as collection,
          TO_CHAR(rb_expiration_date, 'MM/DD/YYYY') as expiration,
          rb_status as status,
          TO_CHAR(rb_created_at, 'MM/DD/YYYY-HH24:MI:SS') as created,
          CASE
            WHEN rb_modified_at IS NOT NULL
            THEN TO_CHAR(rb_modified_at, 'MM/DD/YYYY-HH24:MI:SS')
            ELSE '-'
          END as modified,
          TO_CHAR(rb_released_at, 'MM/DD/YYYY-HH24:MI:SS') as releasedAt,
          rb_category as category,
          rb_receiving_facility as receivingFacility,
          rb_address as address,
          rb_contact_number as contactNumber,
          rb_classification as classification,
          rb_authorized_recipient as authorizedRecipient,
          rb_recipient_designation as recipientDesignation,
          TO_CHAR(rb_date_of_release, 'MM/DD/YYYY') as dateOfRelease,
          rb_condition_upon_release as conditionUponRelease,
          rb_request_reference as requestReference,
          rb_released_by as releasedBy
        FROM released_blood
        WHERE rb_category = 'Platelet'
        ORDER BY rb_released_at DESC
      `;

      const result = await pool.query(query);
      return result.rows.map(row => ({
        ...row,
        selected: false // Add selection state for UI
      }));
    } catch (error) {
      console.error('Error fetching released platelet stock:', error);
      throw error;
    }
  },

  // ========== PLASMA METHODS ==========

  // Get all plasma stock records (only Stored status)
  async getPlasmaStock() {
    try {
      const query = `
        SELECT
          bs_id as id,
          bs_serial_id as serial_id,
          bs_blood_type as type,
          bs_rh_factor as "rhFactor",
          bs_volume as volume,
          TO_CHAR(bs_timestamp, 'MM/DD/YYYY') as collection,
          TO_CHAR(bs_expiration_date, 'MM/DD/YYYY') as expiration,
          bs_status as status,
          TO_CHAR(bs_created_at, 'MM/DD/YYYY-HH24:MI:SS') as created,
          CASE
            WHEN bs_modified_at IS NOT NULL
            THEN TO_CHAR(bs_modified_at, 'MM/DD/YYYY-HH24:MI:SS')
            ELSE '-'
          END as modified,
          bs_category as category
        FROM blood_stock
        WHERE bs_category = 'Plasma' AND bs_status = 'Stored'
        ORDER BY bs_created_at DESC
      `;

      const result = await pool.query(query);
      return result.rows.map(row => ({
        ...row,
        selected: false // Add selection state for UI
      }));
    } catch (error) {
      console.error('Error fetching plasma stock:', error);
      throw error;
    }
  },

  // Get plasma stock by serial ID for release with search functionality
  async getPlasmaStockBySerialId(serialId) {
    try {
      // First try exact match
      let query = `
        SELECT
          bs_id as id,
          bs_serial_id as serial_id,
          bs_blood_type as type,
          bs_rh_factor as "rhFactor",
          bs_volume as volume,
          TO_CHAR(bs_timestamp, 'YYYY-MM-DD') as collection,
          TO_CHAR(bs_expiration_date, 'YYYY-MM-DD') as expiration,
          bs_status as status,
          TO_CHAR(bs_created_at, 'MM/DD/YYYY-HH24:MI:SS') as created,
          CASE
            WHEN bs_modified_at IS NOT NULL
            THEN TO_CHAR(bs_modified_at, 'MM/DD/YYYY-HH24:MI:SS')
            ELSE '-'
          END as modified,
          bs_category as category
        FROM blood_stock
        WHERE bs_serial_id = $1 AND bs_category = 'Plasma' AND bs_status = 'Stored'
      `;

      let result = await pool.query(query, [serialId]);

      // If exact match found, return the first record
      if (result.rows.length > 0) {
        return result.rows[0];
      }

      // If exact match not found, try partial match
      if (serialId.length > 0) {
        query = `
          SELECT
            bs_id as id,
            bs_serial_id as serial_id,
            bs_blood_type as type,
            bs_rh_factor as "rhFactor",
            bs_volume as volume,
            TO_CHAR(bs_timestamp, 'YYYY-MM-DD') as collection,
            TO_CHAR(bs_expiration_date, 'YYYY-MM-DD') as expiration,
            bs_status as status,
            TO_CHAR(bs_created_at, 'MM/DD/YYYY-HH24:MI:SS') as created,
            CASE
              WHEN bs_modified_at IS NOT NULL
              THEN TO_CHAR(bs_modified_at, 'MM/DD/YYYY-HH24:MI:SS')
              ELSE '-'
            END as modified,
            bs_category as category
          FROM blood_stock
          WHERE bs_serial_id ILIKE $1 AND bs_category = 'Plasma' AND bs_status = 'Stored'
          ORDER BY bs_serial_id
          LIMIT 5
        `;

        result = await pool.query(query, [`%${serialId}%`]);
        return result.rows;
      }

      return null;
    } catch (error) {
      console.error('Error fetching plasma stock by serial ID:', error);
      throw error;
    }
  },

  // Add new plasma stock record
  async addPlasmaStock(plasmaData) {
    try {
      const query = `
        INSERT INTO blood_stock (
          bs_serial_id, bs_blood_type, bs_rh_factor, bs_volume,
          bs_timestamp, bs_expiration_date, bs_status, bs_created_at, bs_category
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)
        RETURNING bs_id
      `;

      const values = [
        plasmaData.serial_id,
        plasmaData.type,
        plasmaData.rhFactor,
        parseInt(plasmaData.volume),
        new Date(plasmaData.collection),
        new Date(plasmaData.expiration),
        plasmaData.status || 'Stored',
        'Plasma'
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error adding plasma stock:', error);
      throw error;
    }
  },

  // Update plasma stock record
  async updatePlasmaStock(id, plasmaData) {
    try {
      const query = `
        UPDATE blood_stock SET
          bs_serial_id = $2,
          bs_blood_type = $3,
          bs_rh_factor = $4,
          bs_volume = $5,
          bs_timestamp = $6,
          bs_expiration_date = $7,
          bs_status = $8,
          bs_modified_at = NOW(),
          bs_category = $9
        WHERE bs_id = $1
      `;

      const values = [
        id,
        plasmaData.serial_id,
        plasmaData.type,
        plasmaData.rhFactor,
        parseInt(plasmaData.volume),
        new Date(plasmaData.collection),
        new Date(plasmaData.expiration),
        plasmaData.status || 'Stored',
        'Plasma'
      ];

      await pool.query(query, values);
      return true;
    } catch (error) {
      console.error('Error updating plasma stock:', error);
      throw error;
    }
  },

  // Delete plasma stock records
  async deletePlasmaStock(ids) {
    try {
      const query = 'DELETE FROM blood_stock WHERE bs_id = ANY($1) AND bs_category = \'Plasma\'';
      await pool.query(query, [ids]);
      return true;
    } catch (error) {
      console.error('Error deleting plasma stock:', error);
      throw error;
    }
  },

  // Search plasma stock (only Stored status)
  async searchPlasmaStock(searchTerm) {
    try {
      const query = `
        SELECT
          bs_id as id,
          bs_serial_id as serial_id,
          bs_blood_type as type,
          bs_rh_factor as "rhFactor",
          bs_volume as volume,
          TO_CHAR(bs_timestamp, 'MM/DD/YYYY') as collection,
          TO_CHAR(bs_expiration_date, 'MM/DD/YYYY') as expiration,
          bs_status as status,
          TO_CHAR(bs_created_at, 'MM/DD/YYYY-HH24:MI:SS') as created,
          CASE
            WHEN bs_modified_at IS NOT NULL
            THEN TO_CHAR(bs_modified_at, 'MM/DD/YYYY-HH24:MI:SS')
            ELSE '-'
          END as modified,
          bs_category as category
        FROM blood_stock
        WHERE
          bs_category = 'Plasma' AND bs_status = 'Stored' AND (
            bs_serial_id ILIKE $1 OR
            bs_blood_type ILIKE $1 OR
            bs_status ILIKE $1 OR
            bs_rh_factor ILIKE $1
          )
        ORDER BY bs_created_at DESC
      `;

      const result = await pool.query(query, [`%${searchTerm}%`]);
      return result.rows.map(row => ({
        ...row,
        selected: false
      }));
    } catch (error) {
      console.error('Error searching plasma stock:', error);
      throw error;
    }
  },

  // ========== RELEASE PLASMA STOCK METHODS ==========

  // Release plasma stock - moves records from blood_stock to released_blood
  async releasePlasmaStock(releaseData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get the plasma stock records to be released
      const getStockQuery = `
        SELECT * FROM blood_stock
        WHERE bs_serial_id = ANY($1) AND bs_category = 'Plasma' AND bs_status = 'Stored'
      `;
      const stockResult = await client.query(getStockQuery, [releaseData.serialIds]);

      if (stockResult.rows.length === 0) {
        throw new Error('No valid plasma stock records found for release');
      }

      // Insert records into released_blood table with status 'Released'
      for (const stockRecord of stockResult.rows) {
        const insertQuery = `
          INSERT INTO released_blood (
            rb_serial_id, rb_blood_type, rb_rh_factor, rb_volume,
            rb_timestamp, rb_expiration_date, rb_status, rb_created_at,
            rb_released_at, rb_category, rb_original_id,
            rb_receiving_facility, rb_address, rb_contact_number,
            rb_classification, rb_authorized_recipient, rb_recipient_designation,
            rb_date_of_release, rb_condition_upon_release, rb_request_reference,
            rb_released_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        `;

        const values = [
          stockRecord.bs_serial_id,
          stockRecord.bs_blood_type,
          stockRecord.bs_rh_factor,
          stockRecord.bs_volume,
          stockRecord.bs_timestamp,
          stockRecord.bs_expiration_date,
          'Released', // Status in released_blood table
          stockRecord.bs_created_at,
          'Plasma',
          stockRecord.bs_id,
          releaseData.receivingFacility || '',
          releaseData.address || '',
          releaseData.contactNumber || '',
          releaseData.classification || '',
          releaseData.authorizedRecipient || '',
          releaseData.recipientDesignation || '',
          releaseData.dateOfRelease ? new Date(releaseData.dateOfRelease) : new Date(),
          releaseData.conditionUponRelease || '',
          releaseData.requestReference || '',
          releaseData.releasedBy || ''
        ];

        await client.query(insertQuery, values);
      }

      // DELETE records from blood_stock table (don't update status, just remove completely)
      const deleteQuery = `
        DELETE FROM blood_stock
        WHERE bs_serial_id = ANY($1) AND bs_category = 'Plasma' AND bs_status = 'Stored'
      `;
      await client.query(deleteQuery, [releaseData.serialIds]);

      await client.query('COMMIT');
      return { success: true, releasedCount: stockResult.rows.length };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error releasing plasma stock:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Get all released plasma records
  async getReleasedPlasmaStock() {
    try {
      const query = `
        SELECT
          rb_id as id,
          rb_serial_id as serial_id,
          rb_blood_type as type,
          rb_rh_factor as "rhFactor",
          rb_volume as volume,
          TO_CHAR(rb_timestamp, 'MM/DD/YYYY') as collection,
          TO_CHAR(rb_expiration_date, 'MM/DD/YYYY') as expiration,
          rb_status as status,
          TO_CHAR(rb_created_at, 'MM/DD/YYYY-HH24:MI:SS') as created,
          CASE
            WHEN rb_modified_at IS NOT NULL
            THEN TO_CHAR(rb_modified_at, 'MM/DD/YYYY-HH24:MI:SS')
            ELSE '-'
          END as modified,
          TO_CHAR(rb_released_at, 'MM/DD/YYYY-HH24:MI:SS') as releasedAt,
          rb_category as category,
          rb_receiving_facility as receivingFacility,
          rb_address as address,
          rb_contact_number as contactNumber,
          rb_classification as classification,
          rb_authorized_recipient as authorizedRecipient,
          rb_recipient_designation as recipientDesignation,
          TO_CHAR(rb_date_of_release, 'MM/DD/YYYY') as dateOfRelease,
          rb_condition_upon_release as conditionUponRelease,
          rb_request_reference as requestReference,
          rb_released_by as releasedBy
        FROM released_blood
        WHERE rb_category = 'Plasma'
        ORDER BY rb_released_at DESC
      `;

      const result = await pool.query(query);
      return result.rows.map(row => ({
        ...row,
        selected: false // Add selection state for UI
      }));
    } catch (error) {
      console.error('Error fetching released plasma stock:', error);
      throw error;
    }
  },

  // Utility methods
  async testConnection() {
    return await testConnection();
  },

  async closePool() {
    try {
      await pool.end();
      console.log('Database pool closed');
    } catch (error) {
      console.error('Error closing database pool:', error);
      throw error;
    }
  }
};

// Initialize database tables on startup
(async () => {
  try {
    await testConnection();
    await dbService.initializeTables();
    console.log('Database service initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database service:', error);
  }
})();

// Clean up expired tokens periodically (every hour)
setInterval(async () => {
  try {
    await dbService.cleanupExpiredTokens();
  } catch (error) {
    console.error('Error during periodic token cleanup:', error);
  }
}, 60 * 60 * 1000); // 1 hour

module.exports = {
  ...dbService,
  sendPasswordResetEmail
};