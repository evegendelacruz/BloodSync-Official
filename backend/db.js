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

// Ensure released_blood table exists
const ensureReleasedBloodTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS released_blood (
        rb_id SERIAL PRIMARY KEY,
        rb_serial_id VARCHAR(50) NOT NULL,
        rb_blood_type VARCHAR(5) NOT NULL,
        rb_rh_factor VARCHAR(10) NOT NULL,
        rb_volume INTEGER NOT NULL,
        rb_timestamp TIMESTAMP NOT NULL,
        rb_expiration_date TIMESTAMP NOT NULL,
        rb_status VARCHAR(20) NOT NULL DEFAULT 'Released',
        rb_created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        rb_modified_at TIMESTAMP,
        rb_released_at TIMESTAMP NOT NULL DEFAULT NOW(),
        rb_category VARCHAR(50) NOT NULL,
        rb_original_id INTEGER,
        rb_receiving_facility VARCHAR(255),
        rb_address TEXT,
        rb_contact_number VARCHAR(50),
        rb_classification VARCHAR(100),
        rb_authorized_recipient VARCHAR(255),
        rb_recipient_designation VARCHAR(100),
        rb_date_of_release TIMESTAMP,
        rb_condition_upon_release VARCHAR(100),
        rb_request_reference VARCHAR(100),
        rb_released_by VARCHAR(255)
      )
    `);

    // Create indexes for better query performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_released_blood_serial_id ON released_blood(rb_serial_id);
      CREATE INDEX IF NOT EXISTS idx_released_blood_category ON released_blood(rb_category);
      CREATE INDEX IF NOT EXISTS idx_released_blood_status ON released_blood(rb_status);
      CREATE INDEX IF NOT EXISTS idx_released_blood_released_at ON released_blood(rb_released_at);
    `);

    console.log('Released blood table ensured successfully');
    return true;
  } catch (error) {
    console.error('Error ensuring released_blood table:', error);
    throw error;
  }
};

// Ensure combined blood type column exists and stays updated
const ensureBloodStockResultColumn = async () => {
  try {
    // Add column if not exists
    await pool.query(`
      ALTER TABLE blood_stock
      ADD COLUMN IF NOT EXISTS bs_result_bloodtype VARCHAR(3)
    `);

    // Create or replace trigger function to keep bs_result_bloodtype in sync
    await pool.query(`
      CREATE OR REPLACE FUNCTION set_bs_result_bloodtype()
      RETURNS TRIGGER AS $func$
      BEGIN
        IF NEW.bs_blood_type IS NOT NULL AND NEW.bs_rh_factor IS NOT NULL THEN
          NEW.bs_result_bloodtype := NEW.bs_blood_type ||
            CASE
              WHEN LOWER(NEW.bs_rh_factor) IN ('positive', 'pos', '+', 'plus') THEN '+'
              WHEN LOWER(NEW.bs_rh_factor) IN ('negative', 'neg', '-', 'minus') THEN '-'
              ELSE
                CASE
                  WHEN NEW.bs_rh_factor LIKE '%+%' THEN '+'
                  WHEN NEW.bs_rh_factor LIKE '%-%' THEN '-'
                  ELSE NULL
                END
            END;
        END IF;
        RETURN NEW;
      END;
      $func$ LANGUAGE plpgsql;
    `);

    // Create trigger if it does not exist yet
    const trigCheck = await pool.query(`SELECT 1 FROM pg_trigger WHERE tgname = 'trg_set_bs_result_bloodtype'`);
    if (trigCheck.rowCount === 0) {
      await pool.query(`
        CREATE TRIGGER trg_set_bs_result_bloodtype
        BEFORE INSERT OR UPDATE OF bs_blood_type, bs_rh_factor ON blood_stock
        FOR EACH ROW
        EXECUTE FUNCTION set_bs_result_bloodtype();
      `);
    }

    // Backfill existing rows where possible
    await pool.query(`
      UPDATE blood_stock
      SET bs_result_bloodtype = bs_blood_type ||
        CASE
          WHEN LOWER(bs_rh_factor) IN ('positive', 'pos', '+', 'plus') THEN '+'
          WHEN LOWER(bs_rh_factor) IN ('negative', 'neg', '-', 'minus') THEN '-'
          ELSE
            CASE
              WHEN bs_rh_factor LIKE '%+%' THEN '+'
              WHEN bs_rh_factor LIKE '%-%' THEN '-'
              ELSE NULL
            END
        END
      WHERE (bs_result_bloodtype IS NULL OR bs_result_bloodtype = '')
        AND bs_blood_type IS NOT NULL AND bs_rh_factor IS NOT NULL;
    `);

    console.log('✓ bs_result_bloodtype ensured and populated in blood_stock');
    return true;
  } catch (error) {
    console.error('Error ensuring bs_result_bloodtype column:', error);
    throw error;
  }
};

// Email sending functions
const sendSuperAdminApprovalEmail = async (fullName, role, email, activationLink) => {
  try {
    console.log('Preparing to send approval email...');
    console.log('SMTP_USER:', process.env.SMTP_USER);
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***hidden***' : 'NOT SET');

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('SMTP credentials (SMTP_USER/SMTP_PASS) not set. Skipping email sending.');
      return;
    }

    const to = 'bloodsync.doh@gmail.com';
    const subject = 'New Regional Blood Center User Account Registration';

    // Extract token from activationLink
    const token = activationLink.split('token=')[1]?.split('\n')[0] || '';
    const activationUrl = `http://localhost:5173/activate?token=${token}`;

    const text = `New Regional Blood Center User Account Registration

A new Regional Blood Center user has registered and requires activation approval:

Full Name: ${fullName}
Role: ${role}
Email: ${email}

To activate this user, click the link below or paste the activation token in the BloodSync application:
${activationUrl}

Activation Token: ${token}

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
      await ensureReleasedBloodTable();
      await ensureBloodStockResultColumn();
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
      await sendSuperAdminApprovalEmail(full_name, role, email, activationLink);

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
  async generatePasswordResetToken(emailOrDohId) {
    try {
      // Check if input is DOH ID (format: DOH-XXXXXXXXX) or email
      const isDohId = /^DOH-\d+$/i.test(emailOrDohId.trim());

      let userCheck;
      if (isDohId) {
        // Query by DOH ID
        userCheck = await pool.query(
          'SELECT user_id, email, full_name, is_active FROM user_doh WHERE doh_id = $1',
          [emailOrDohId.trim()]
        );
      } else {
        // Query by email
        userCheck = await pool.query(
          'SELECT user_id, email, full_name, is_active FROM user_doh WHERE email = $1',
          [emailOrDohId.trim()]
        );
      }

      if (userCheck.rowCount === 0) {
        throw new Error(isDohId ? 'DOH ID not found' : 'Email not found');
      }

      const user = userCheck.rows[0];
      const email = user.email; // Use the email from database

      if (!user.is_active) {
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
        [user.user_id, email, resetToken, tokenExpiry]
      );

      // Send reset email
      await sendPasswordResetEmail(email, resetToken, user.full_name);

      return {
        success: true,
        resetToken,
        userName: user.full_name
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

  // ========== DONOR RECORD METHODS ==========

// Get all donor records
async getAllDonorRecords() {
  try {
    const query = `
      SELECT 
        dr_id as id,
        dr_donor_id as "donorId",
        dr_first_name as "firstName",
        dr_middle_name as "middleName",
        dr_last_name as "lastName",
        dr_gender as gender,
        TO_CHAR(dr_birthdate, 'MM/DD/YYYY') as birthdate,
        dr_age as age,
        dr_blood_type as "bloodType",
        dr_rh_factor as "rhFactor",
        dr_contact_number as "contactNumber",
        dr_address as address,
        TO_CHAR(dr_created_at, 'MM/DD/YYYY-HH24:MI:SS') as created,
        CASE 
          WHEN dr_modified_at IS NOT NULL 
          THEN TO_CHAR(dr_modified_at, 'MM/DD/YYYY-HH24:MI:SS')
          ELSE '-'
        END as modified
      FROM donor_records 
      ORDER BY dr_created_at DESC
    `;
    
    const result = await pool.query(query);
    return result.rows.map(row => ({
      ...row,
      selected: false
    }));
  } catch (error) {
    console.error('Error fetching donor records:', error);
    throw error;
  }
},

// Add new donor record
async addDonorRecord(donorData) {
  try {
    const query = `
      INSERT INTO donor_records (
        dr_donor_id, dr_first_name, dr_middle_name, dr_last_name,
        dr_gender, dr_birthdate, dr_age, dr_blood_type, dr_rh_factor,
        dr_contact_number, dr_address, dr_created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING dr_id
    `;
    
    const values = [
      donorData.donorId,
      donorData.firstName,
      donorData.middleName || null,
      donorData.lastName,
      donorData.gender,
      new Date(donorData.birthdate),
      parseInt(donorData.age),
      donorData.bloodType,
      donorData.rhFactor,
      donorData.contactNumber,
      donorData.address
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error adding donor record:', error);
    throw error;
  }
},

// Update donor record
async updateDonorRecord(id, donorData) {
  try {
    const query = `
      UPDATE donor_records SET
        dr_donor_id = $2,
        dr_first_name = $3,
        dr_middle_name = $4,
        dr_last_name = $5,
        dr_gender = $6,
        dr_birthdate = $7,
        dr_age = $8,
        dr_blood_type = $9,
        dr_rh_factor = $10,
        dr_contact_number = $11,
        dr_address = $12,
        dr_modified_at = NOW()
      WHERE dr_id = $1
    `;
    
    const values = [
      id,
      donorData.donorId,
      donorData.firstName,
      donorData.middleName || null,
      donorData.lastName,
      donorData.gender,
      new Date(donorData.birthdate),
      parseInt(donorData.age),
      donorData.bloodType,
      donorData.rhFactor,
      donorData.contactNumber,
      donorData.address
    ];
    
    await pool.query(query, values);
    return true;
  } catch (error) {
    console.error('Error updating donor record:', error);
    throw error;
  }
},

// Delete donor records
async deleteDonorRecords(ids) {
  try {
    const query = 'DELETE FROM donor_records WHERE dr_id = ANY($1)';
    await pool.query(query, [ids]);
    return true;
  } catch (error) {
    console.error('Error deleting donor records:', error);
    throw error;
  }
},

// Search donor records
async searchDonorRecords(searchTerm) {
  try {
    const query = `
      SELECT 
        dr_id as id,
        dr_donor_id as "donorId",
        dr_first_name as "firstName",
        dr_middle_name as "middleName",
        dr_last_name as "lastName",
        dr_gender as gender,
        TO_CHAR(dr_birthdate, 'MM/DD/YYYY') as birthdate,
        dr_age as age,
        dr_blood_type as "bloodType",
        dr_rh_factor as "rhFactor",
        dr_contact_number as "contactNumber",
        dr_address as address,
        TO_CHAR(dr_created_at, 'MM/DD/YYYY-HH24:MI:SS') as created,
        CASE 
          WHEN dr_modified_at IS NOT NULL 
          THEN TO_CHAR(dr_modified_at, 'MM/DD/YYYY-HH24:MI:SS')
          ELSE '-'
        END as modified
      FROM donor_records 
      WHERE 
        dr_donor_id ILIKE $1 OR 
        dr_first_name ILIKE $1 OR 
        dr_middle_name ILIKE $1 OR
        dr_last_name ILIKE $1 OR
        dr_gender ILIKE $1 OR
        dr_blood_type ILIKE $1 OR
        dr_contact_number ILIKE $1 OR
        dr_address ILIKE $1
      ORDER BY dr_created_at DESC
    `;
    
    const result = await pool.query(query, [`%${searchTerm}%`]);
    return result.rows.map(row => ({
      ...row,
      selected: false
    }));
  } catch (error) {
    console.error('Error searching donor records:', error);
    throw error;
  }
},

// Generate next donor ID (format: DNR-XXXX-ON)
async generateNextDonorId() {
  try {
    const query = `
      SELECT dr_donor_id 
      FROM donor_records 
      WHERE dr_donor_id LIKE 'DNR-%'
      ORDER BY dr_donor_id DESC 
      LIMIT 1
    `;
    
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      return 'DNR-0001-ON';
    }
    
    const lastId = result.rows[0].dr_donor_id;
    const numberPart = parseInt(lastId.split('-')[1]);
    const nextNumber = (numberPart + 1).toString().padStart(4, '0');
    
    return `DNR-${nextNumber}-ON`;
  } catch (error) {
    console.error('Error generating donor ID:', error);
    throw error;
  }
},

// ========== UPDATE/DELETE RELEASED BLOOD METHODS ==========

// Update released RBC record
async updateReleasedBloodStock(id, bloodData) {
  try {
    const query = `
      UPDATE released_blood SET
        rb_serial_id = $2,
        rb_blood_type = $3,
        rb_rh_factor = $4,
        rb_volume = $5,
        rb_timestamp = $6,
        rb_expiration_date = $7,
        rb_status = $8,
        rb_modified_at = NOW()
      WHERE rb_id = $1 AND rb_category = 'Red Blood Cell'
    `;
    
    const values = [
      id,
      bloodData.serial_id,
      bloodData.type,
      bloodData.rhFactor,
      parseInt(bloodData.volume),
      new Date(bloodData.collection),
      new Date(bloodData.expiration),
      bloodData.status || 'Released'
    ];
    
    await pool.query(query, values);
    return true;
  } catch (error) {
    console.error('Error updating released blood stock:', error);
    throw error;
  }
},

// Delete released RBC records
async deleteReleasedBloodStock(ids) {
  try {
    const query = 'DELETE FROM released_blood WHERE rb_id = ANY($1) AND rb_category = \'Red Blood Cell\'';
    await pool.query(query, [ids]);
    return true;
  } catch (error) {
    console.error('Error deleting released blood stock:', error);
    throw error;
  }
},

// Update released Plasma record
async updateReleasedPlasmaStock(id, plasmaData) {
  try {
    const query = `
      UPDATE released_blood SET
        rb_serial_id = $2,
        rb_blood_type = $3,
        rb_rh_factor = $4,
        rb_volume = $5,
        rb_timestamp = $6,
        rb_expiration_date = $7,
        rb_status = $8,
        rb_modified_at = NOW()
      WHERE rb_id = $1 AND rb_category = 'Plasma'
    `;
    
    const values = [
      id,
      plasmaData.serial_id,
      plasmaData.type,
      plasmaData.rhFactor,
      parseInt(plasmaData.volume),
      new Date(plasmaData.collection),
      new Date(plasmaData.expiration),
      plasmaData.status || 'Released'
    ];
    
    await pool.query(query, values);
    return true;
  } catch (error) {
    console.error('Error updating released plasma stock:', error);
    throw error;
  }
},

// Delete released Plasma records
async deleteReleasedPlasmaStock(ids) {
  try {
    const query = 'DELETE FROM released_blood WHERE rb_id = ANY($1) AND rb_category = \'Plasma\'';
    await pool.query(query, [ids]);
    return true;
  } catch (error) {
    console.error('Error deleting released plasma stock:', error);
    throw error;
  }
},

// Update released Platelet record
async updateReleasedPlateletStock(id, plateletData) {
  try {
    const query = `
      UPDATE released_blood SET
        rb_serial_id = $2,
        rb_blood_type = $3,
        rb_rh_factor = $4,
        rb_volume = $5,
        rb_timestamp = $6,
        rb_expiration_date = $7,
        rb_status = $8,
        rb_modified_at = NOW()
      WHERE rb_id = $1 AND rb_category = 'Platelet'
    `;
    
    const values = [
      id,
      plateletData.serial_id,
      plateletData.type,
      plateletData.rhFactor,
      parseInt(plateletData.volume),
      new Date(plateletData.collection),
      new Date(plateletData.expiration),
      plateletData.status || 'Released'
    ];
    
    await pool.query(query, values);
    return true;
  } catch (error) {
    console.error('Error updating released platelet stock:', error);
    throw error;
  }
},

// Delete released Platelet records
async deleteReleasedPlateletStock(ids) {
  try {
    const query = 'DELETE FROM released_blood WHERE rb_id = ANY($1) AND rb_category = \'Platelet\'';
    await pool.query(query, [ids]);
    return true;
  } catch (error) {
    console.error('Error deleting released platelet stock:', error);
    throw error;
  }
},

// ========== RESTORE BLOOD STOCK METHODS ==========

// Restore RBC from released_blood back to blood_stock
async restoreBloodStock(serialIds) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get the released blood records
    const getReleasedQuery = `
      SELECT * FROM released_blood 
      WHERE rb_serial_id = ANY($1) AND rb_category = 'Red Blood Cell'
    `;
    const releasedResult = await client.query(getReleasedQuery, [serialIds]);
    
    if (releasedResult.rows.length === 0) {
      throw new Error('No released blood records found to restore');
    }

    let restoredCount = 0;
    const serialIdsToDelete = [];

    // Insert back into blood_stock with status 'Stored'
    for (const record of releasedResult.rows) {
      // Check if serial ID already exists in blood_stock
      const checkExistingQuery = `
        SELECT bs_id FROM blood_stock WHERE bs_serial_id = $1
      `;
      const existingResult = await client.query(checkExistingQuery, [record.rb_serial_id]);
      
      if (existingResult.rows.length > 0) {
        console.warn(`Serial ID ${record.rb_serial_id} already exists in blood_stock, will only remove from released_blood`);
        serialIdsToDelete.push(record.rb_serial_id);
        continue;
      }

      const insertQuery = `
        INSERT INTO blood_stock (
          bs_serial_id, bs_blood_type, bs_rh_factor, bs_volume,
          bs_timestamp, bs_expiration_date, bs_status, bs_created_at, bs_category
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;
      
      const values = [
        record.rb_serial_id,
        record.rb_blood_type,
        record.rb_rh_factor,
        record.rb_volume,
        record.rb_timestamp,
        record.rb_expiration_date,
        'Stored',
        record.rb_created_at,
        'Red Blood Cell'
      ];
      
      await client.query(insertQuery, values);
      restoredCount++;
      serialIdsToDelete.push(record.rb_serial_id);
    }

    // Delete from released_blood
    if (serialIdsToDelete.length > 0) {
      const deleteQuery = `
        DELETE FROM released_blood 
        WHERE rb_serial_id = ANY($1) AND rb_category = 'Red Blood Cell'
      `;
      await client.query(deleteQuery, [serialIdsToDelete]);
    }

    await client.query('COMMIT');
    return { success: true, restoredCount: restoredCount };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error restoring blood stock:', error);
    throw error;
  } finally {
    client.release();
  }
},

// Restore Plasma from released_blood back to blood_stock
async restorePlasmaStock(serialIds) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const getReleasedQuery = `
      SELECT * FROM released_blood 
      WHERE rb_serial_id = ANY($1) AND rb_category = 'Plasma'
    `;
    const releasedResult = await client.query(getReleasedQuery, [serialIds]);
    
    if (releasedResult.rows.length === 0) {
      throw new Error('No released plasma records found to restore');
    }

    let restoredCount = 0;
    const serialIdsToDelete = [];

    for (const record of releasedResult.rows) {
      // Check if serial ID already exists in blood_stock
      const checkExistingQuery = `
        SELECT bs_id FROM blood_stock WHERE bs_serial_id = $1
      `;
      const existingResult = await client.query(checkExistingQuery, [record.rb_serial_id]);
      
      if (existingResult.rows.length > 0) {
        console.warn(`Serial ID ${record.rb_serial_id} already exists in blood_stock, will only remove from released_blood`);
        serialIdsToDelete.push(record.rb_serial_id);
        continue;
      }

      const insertQuery = `
        INSERT INTO blood_stock (
          bs_serial_id, bs_blood_type, bs_rh_factor, bs_volume,
          bs_timestamp, bs_expiration_date, bs_status, bs_created_at, bs_category
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;
      
      const values = [
        record.rb_serial_id,
        record.rb_blood_type,
        record.rb_rh_factor,
        record.rb_volume,
        record.rb_timestamp,
        record.rb_expiration_date,
        'Stored',
        record.rb_created_at,
        'Plasma'
      ];
      
      await client.query(insertQuery, values);
      restoredCount++;
      serialIdsToDelete.push(record.rb_serial_id);
    }

    if (serialIdsToDelete.length > 0) {
      const deleteQuery = `
        DELETE FROM released_blood 
        WHERE rb_serial_id = ANY($1) AND rb_category = 'Plasma'
      `;
      await client.query(deleteQuery, [serialIdsToDelete]);
    }

    await client.query('COMMIT');
    return { success: true, restoredCount: restoredCount };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error restoring plasma stock:', error);
    throw error;
  } finally {
    client.release();
  }
},

// Restore Platelet from released_blood back to blood_stock
async restorePlateletStock(serialIds) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const getReleasedQuery = `
      SELECT * FROM released_blood 
      WHERE rb_serial_id = ANY($1) AND rb_category = 'Platelet'
    `;
    const releasedResult = await client.query(getReleasedQuery, [serialIds]);
    
    if (releasedResult.rows.length === 0) {
      throw new Error('No released platelet records found to restore');
    }

    let restoredCount = 0;
    const serialIdsToDelete = [];

    for (const record of releasedResult.rows) {
      // Check if serial ID already exists in blood_stock
      const checkExistingQuery = `
        SELECT bs_id FROM blood_stock WHERE bs_serial_id = $1
      `;
      const existingResult = await client.query(checkExistingQuery, [record.rb_serial_id]);
      
      if (existingResult.rows.length > 0) {
        console.warn(`Serial ID ${record.rb_serial_id} already exists in blood_stock, will only remove from released_blood`);
        serialIdsToDelete.push(record.rb_serial_id);
        continue;
      }

      const insertQuery = `
        INSERT INTO blood_stock (
          bs_serial_id, bs_blood_type, bs_rh_factor, bs_volume,
          bs_timestamp, bs_expiration_date, bs_status, bs_created_at, bs_category
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;
      
      const values = [
        record.rb_serial_id,
        record.rb_blood_type,
        record.rb_rh_factor,
        record.rb_volume,
        record.rb_timestamp,
        record.rb_expiration_date,
        'Stored',
        record.rb_created_at,
        'Platelet'
      ];
      
      await client.query(insertQuery, values);
      restoredCount++;
      serialIdsToDelete.push(record.rb_serial_id);
    }

    if (serialIdsToDelete.length > 0) {
      const deleteQuery = `
        DELETE FROM released_blood 
        WHERE rb_serial_id = ANY($1) AND rb_category = 'Platelet'
      `;
      await client.query(deleteQuery, [serialIdsToDelete]);
    }

    await client.query('COMMIT');
    return { success: true, restoredCount: restoredCount };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error restoring platelet stock:', error);
    throw error;
  } finally {
    client.release();
  }
  },

  // ========== NON-CONFORMING METHODS ==========

    // Get all non-conforming records (RED BLOOD CELL ONLY)
    async getAllNonConforming() {
      try {
        const query = `
          SELECT 
            nc_id as id,
            nc_serial_id as serial_id,
            nc_blood_type as type,
            nc_rh_factor as "rhFactor",
            nc_volume as volume,
            TO_CHAR(nc_timestamp, 'MM/DD/YYYY') as collection,
            TO_CHAR(nc_expiration_date, 'MM/DD/YYYY') as expiration,
            nc_status as status,
            TO_CHAR(nc_created_at, 'MM/DD/YYYY-HH24:MI:SS') as created,
            CASE 
              WHEN nc_modified_at IS NOT NULL 
              THEN TO_CHAR(nc_modified_at, 'MM/DD/YYYY-HH24:MI:SS')
              ELSE '-'
            END as modified,
            nc_category as category
          FROM non_conforming 
          WHERE nc_category = 'Red Blood Cell'
          ORDER BY nc_created_at DESC
        `;
        
        const result = await pool.query(query);
        return result.rows.map(row => ({
          ...row,
          selected: false
        }));
      } catch (error) {
        console.error('Error fetching non-conforming records:', error);
        throw error;
      }
    },

    // Get blood stock by serial ID for non-conforming (RED BLOOD CELL ONLY from blood_stock with Stored status)
    async getBloodStockBySerialIdForNC(serialId) {
      try {
        // First try exact match in blood_stock with Stored status (RED BLOOD CELL ONLY)
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
          WHERE bs_serial_id = $1 
            AND bs_status = 'Stored'
            AND bs_category = 'Red Blood Cell'
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
            WHERE bs_serial_id ILIKE $1 
              AND bs_status = 'Stored'
              AND bs_category = 'Red Blood Cell'
            ORDER BY bs_serial_id
            LIMIT 5
          `;
          
          result = await pool.query(query, [`%${serialId}%`]);
          return result.rows;
        }
        
        return null;
      } catch (error) {
        console.error('Error fetching blood stock by serial ID for NC:', error);
        throw error;
      }
    },

    // Transfer blood stock to non-conforming (RED BLOOD CELL ONLY)
    async transferToNonConforming(serialIds) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Get the blood stock records to be transferred (RED BLOOD CELL ONLY)
        const getStockQuery = `
          SELECT * FROM blood_stock 
          WHERE bs_serial_id = ANY($1) 
            AND bs_status = 'Stored'
            AND bs_category = 'Red Blood Cell'
        `;
        const stockResult = await client.query(getStockQuery, [serialIds]);
        
        if (stockResult.rows.length === 0) {
          throw new Error('No valid Red Blood Cell stock records found for transfer to non-conforming');
        }

        let transferredCount = 0;
        const serialIdsToDelete = [];

        // Insert records into non_conforming table with status 'Non-Conforming'
        for (const stockRecord of stockResult.rows) {
          // Check if serial ID already exists in non_conforming
          const checkExistingQuery = `
            SELECT nc_id FROM non_conforming WHERE nc_serial_id = $1
          `;
          const existingResult = await client.query(checkExistingQuery, [stockRecord.bs_serial_id]);
          
          if (existingResult.rows.length > 0) {
            console.warn(`Serial ID ${stockRecord.bs_serial_id} already exists in non_conforming, skipping`);
            continue;
          }

          const insertQuery = `
            INSERT INTO non_conforming (
              nc_serial_id, nc_blood_type, nc_rh_factor, nc_volume,
              nc_timestamp, nc_expiration_date, nc_status, nc_created_at, nc_category
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `;
          
          const values = [
            stockRecord.bs_serial_id,
            stockRecord.bs_blood_type,
            stockRecord.bs_rh_factor,
            stockRecord.bs_volume,
            stockRecord.bs_timestamp,
            stockRecord.bs_expiration_date,
            'Non-Conforming',
            stockRecord.bs_created_at,
            'Red Blood Cell' // Always Red Blood Cell category
          ];
          
          await client.query(insertQuery, values);
          transferredCount++;
          serialIdsToDelete.push(stockRecord.bs_serial_id);
        }

        // DELETE records from blood_stock table
        if (serialIdsToDelete.length > 0) {
          const deleteQuery = `
            DELETE FROM blood_stock 
            WHERE bs_serial_id = ANY($1) 
              AND bs_status = 'Stored'
              AND bs_category = 'Red Blood Cell'
          `;
          await client.query(deleteQuery, [serialIdsToDelete]);
        }

        await client.query('COMMIT');
        return { success: true, transferredCount: transferredCount };
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error transferring to non-conforming:', error);
        throw error;
      } finally {
        client.release();
      }
    },

    // Update non-conforming record (RED BLOOD CELL ONLY)
    async updateNonConforming(id, ncData) {
      try {
        const query = `
          UPDATE non_conforming SET
            nc_serial_id = $2,
            nc_blood_type = $3,
            nc_rh_factor = $4,
            nc_volume = $5,
            nc_timestamp = $6,
            nc_expiration_date = $7,
            nc_status = $8,
            nc_modified_at = NOW(),
            nc_category = $9
          WHERE nc_id = $1 AND nc_category = 'Red Blood Cell'
        `;
        
        const values = [
          id,
          ncData.serial_id,
          ncData.type,
          ncData.rhFactor,
          parseInt(ncData.volume),
          new Date(ncData.collection),
          new Date(ncData.expiration),
          'Non-Conforming',
          'Red Blood Cell' // Always Red Blood Cell category
        ];
        
        await pool.query(query, values);
        return true;
      } catch (error) {
        console.error('Error updating non-conforming record:', error);
        throw error;
      }
    },

    // Delete non-conforming records (RED BLOOD CELL ONLY)
    async deleteNonConforming(ids) {
      try {
        const query = 'DELETE FROM non_conforming WHERE nc_id = ANY($1) AND nc_category = \'Red Blood Cell\'';
        await pool.query(query, [ids]);
        return true;
      } catch (error) {
        console.error('Error deleting non-conforming records:', error);
        throw error;
      }
    },

    // Search non-conforming records (RED BLOOD CELL ONLY)
    async searchNonConforming(searchTerm) {
      try {
        const query = `
          SELECT 
            nc_id as id,
            nc_serial_id as serial_id,
            nc_blood_type as type,
            nc_rh_factor as "rhFactor",
            nc_volume as volume,
            TO_CHAR(nc_timestamp, 'MM/DD/YYYY') as collection,
            TO_CHAR(nc_expiration_date, 'MM/DD/YYYY') as expiration,
            nc_status as status,
            TO_CHAR(nc_created_at, 'MM/DD/YYYY-HH24:MI:SS') as created,
            CASE 
              WHEN nc_modified_at IS NOT NULL 
              THEN TO_CHAR(nc_modified_at, 'MM/DD/YYYY-HH24:MI:SS')
              ELSE '-'
            END as modified,
            nc_category as category
          FROM non_conforming 
          WHERE nc_category = 'Red Blood Cell'
            AND (
              nc_serial_id ILIKE $1 OR 
              nc_blood_type ILIKE $1 OR 
              nc_status ILIKE $1 OR
              nc_rh_factor ILIKE $1
            )
          ORDER BY nc_created_at DESC
        `;
        
        const result = await pool.query(query, [`%${searchTerm}%`]);
        return result.rows.map(row => ({
          ...row,
          selected: false
        }));
      } catch (error) {
        console.error('Error searching non-conforming records:', error);
        throw error;
      }
    },

    // Discard non-conforming stock (RED BLOOD CELL ONLY)
  async discardNonConformingStock(discardData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get the non-conforming records to be discarded
      const getNonConformingQuery = `
        SELECT * FROM non_conforming 
        WHERE nc_serial_id = ANY($1) AND nc_category = 'Red Blood Cell'
      `;
      const ncResult = await client.query(getNonConformingQuery, [discardData.serialIds]);
      
      if (ncResult.rows.length === 0) {
        throw new Error('No valid non-conforming Red Blood Cell records found for discard');
      }

      let discardedCount = 0;
      const serialIdsToDelete = [];

      // Insert records into discarded_blood table
      for (const ncRecord of ncResult.rows) {
        // Check if serial ID already exists in discarded_blood
        const checkExistingQuery = `
          SELECT db_id FROM discarded_blood WHERE db_serial_id = $1
        `;
        const existingResult = await client.query(checkExistingQuery, [ncRecord.nc_serial_id]);
        
        if (existingResult.rows.length > 0) {
          console.warn(`Serial ID ${ncRecord.nc_serial_id} already exists in discarded_blood, skipping`);
          continue;
        }

        const insertQuery = `
          INSERT INTO discarded_blood (
            db_serial_id, db_blood_type, db_rh_factor, db_volume,
            db_timestamp, db_expiration_date, db_status, db_created_at, 
            db_discarded_at, db_category, db_original_id,
            db_responsible_personnel, db_reason_for_discarding, db_authorized_by,
            db_date_of_discard, db_time_of_discard, db_method_of_disposal, db_remarks
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10, $11, $12, $13, $14, $15, $16, $17)
        `;
        
        const values = [
          ncRecord.nc_serial_id,
          ncRecord.nc_blood_type,
          ncRecord.nc_rh_factor,
          ncRecord.nc_volume,
          ncRecord.nc_timestamp,
          ncRecord.nc_expiration_date,
          'Discarded',
          ncRecord.nc_created_at,
          'Red Blood Cell',
          ncRecord.nc_id,
          discardData.responsiblePersonnel,
          discardData.reasonForDiscarding,
          discardData.authorizedBy,
          new Date(discardData.dateOfDiscard),
          discardData.timeOfDiscard,
          discardData.methodOfDisposal,
          discardData.remarks || ''
        ];
        
        await client.query(insertQuery, values);
        discardedCount++;
        serialIdsToDelete.push(ncRecord.nc_serial_id);
      }

      // DELETE records from non_conforming table
      if (serialIdsToDelete.length > 0) {
        const deleteQuery = `
          DELETE FROM non_conforming 
          WHERE nc_serial_id = ANY($1) AND nc_category = 'Red Blood Cell'
        `;
        await client.query(deleteQuery, [serialIdsToDelete]);
      }

      await client.query('COMMIT');
      return { success: true, discardedCount: discardedCount };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error discarding non-conforming stock:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Get non-conforming stock by serial ID for discard (RED BLOOD CELL ONLY)
  async getNonConformingBySerialIdForDiscard(serialId) {
    try {
      // First try exact match
      let query = `
      SELECT 
        nc_id as id,
        nc_serial_id as serial_id,
        nc_blood_type as type,
        nc_rh_factor as "rhFactor",
        nc_volume as volume,
        TO_CHAR(nc_timestamp, 'YYYY-MM-DD') as collection,
        TO_CHAR(nc_expiration_date, 'YYYY-MM-DD') as expiration,
        nc_status as status,
        TO_CHAR(nc_created_at, 'MM/DD/YYYY-HH24:MI:SS') as created,
        CASE 
          WHEN nc_modified_at IS NOT NULL 
          THEN TO_CHAR(nc_modified_at, 'MM/DD/YYYY-HH24:MI:SS')
          ELSE '-'
        END as modified,
        nc_category as category
      FROM non_conforming 
      WHERE nc_serial_id = $1 AND nc_category = 'Red Blood Cell'
    `;
    
    let result = await pool.query(query, [serialId.trim()]);
    
    // If exact match found, return the first record
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    
    // If exact match not found, try partial match
    if (serialId.length > 0) {
      query = `
        SELECT 
          nc_id as id,
          nc_serial_id as serial_id,
          nc_blood_type as type,
          nc_rh_factor as "rhFactor",
          nc_volume as volume,
          TO_CHAR(nc_timestamp, 'YYYY-MM-DD') as collection,
          TO_CHAR(nc_expiration_date, 'YYYY-MM-DD') as expiration,
          nc_status as status,
          TO_CHAR(nc_created_at, 'MM/DD/YYYY-HH24:MI:SS') as created,
          CASE 
            WHEN nc_modified_at IS NOT NULL 
            THEN TO_CHAR(nc_modified_at, 'MM/DD/YYYY-HH24:MI:SS')
            ELSE '-'
          END as modified,
          nc_category as category
        FROM non_conforming 
        WHERE nc_serial_id ILIKE $1 AND nc_category = 'Red Blood Cell'
        ORDER BY nc_serial_id
        LIMIT 5
      `;
      
      result = await pool.query(query, [`%${serialId.trim()}%`]);
      
      if (result.rows.length > 0) {
        return result.rows;
      }
    }

    return null;
  } catch (error) {
    throw error;
  }
},

    // Search non-conforming records for discard modal (RED BLOOD CELL ONLY)
  async searchNonConformingForDiscard(searchTerm) {
    try {
      const query = `
        SELECT 
          nc_id as id,
          nc_serial_id as serial_id,
          nc_blood_type as type,
          nc_rh_factor as "rhFactor",
          nc_volume as volume,
          TO_CHAR(nc_timestamp, 'MM/DD/YYYY') as collection,
          TO_CHAR(nc_expiration_date, 'MM/DD/YYYY') as expiration,
          nc_status as status,
          TO_CHAR(nc_created_at, 'MM/DD/YYYY-HH24:MI:SS') as created,
          CASE 
            WHEN nc_modified_at IS NOT NULL 
            THEN TO_CHAR(nc_modified_at, 'MM/DD/YYYY-HH24:MI:SS')
            ELSE '-'
          END as modified,
          nc_category as category
        FROM non_conforming 
        WHERE nc_category = 'Red Blood Cell'
          AND (
            nc_serial_id ILIKE $1 OR 
            nc_blood_type ILIKE $1 OR 
            nc_status ILIKE $1 OR
            nc_rh_factor ILIKE $1
          )
        ORDER BY nc_created_at DESC
      `;
      
      const result = await pool.query(query, [`%${searchTerm}%`]);
      return result.rows.map(row => ({
        ...row,
        selected: false
      }));
    } catch (error) {
      console.error('Error searching non-conforming records for discard:', error);
      throw error;
    }
  },

  // ========== PLATELET NON-CONFORMING METHODS ==========

  // Get all platelet non-conforming records
  async getAllPlateletNonConforming() {
    try {
      const query = `
        SELECT 
          nc_id as id,
          nc_serial_id as serial_id,
          nc_blood_type as type,
          nc_rh_factor as "rhFactor",
          nc_volume as volume,
          TO_CHAR(nc_timestamp, 'MM/DD/YYYY') as collection,
          TO_CHAR(nc_expiration_date, 'MM/DD/YYYY') as expiration,
          nc_status as status,
          TO_CHAR(nc_created_at, 'MM/DD/YYYY-HH24:MI:SS') as created,
          CASE 
            WHEN nc_modified_at IS NOT NULL 
            THEN TO_CHAR(nc_modified_at, 'MM/DD/YYYY-HH24:MI:SS')
            ELSE '-'
          END as modified,
          nc_category as category
        FROM non_conforming 
        WHERE nc_category = 'Platelet'
        ORDER BY nc_created_at DESC
      `;
      
      const result = await pool.query(query);
      return result.rows.map(row => ({
        ...row,
        selected: false
      }));
    } catch (error) {
      console.error('Error fetching platelet non-conforming records:', error);
      throw error;
    }
  },

  // Get platelet stock by serial ID for non-conforming (from blood_stock with Stored status)
  async getPlateletStockBySerialIdForNC(serialId) {
    try {
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
        WHERE bs_serial_id = $1 
          AND bs_status = 'Stored'
          AND bs_category = 'Platelet'
      `;
      
      let result = await pool.query(query, [serialId]);
      
      if (result.rows.length > 0) {
        return result.rows[0];
      }
      
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
          WHERE bs_serial_id ILIKE $1 
            AND bs_status = 'Stored'
            AND bs_category = 'Platelet'
          ORDER BY bs_serial_id
          LIMIT 5
        `;
        
        result = await pool.query(query, [`%${serialId}%`]);
        return result.rows;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching platelet stock by serial ID for NC:', error);
      throw error;
    }
  },

  // Transfer platelet stock to non-conforming
  async transferPlateletToNonConforming(serialIds) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const getStockQuery = `
        SELECT * FROM blood_stock 
        WHERE bs_serial_id = ANY($1) 
          AND bs_status = 'Stored'
          AND bs_category = 'Platelet'
      `;
      const stockResult = await client.query(getStockQuery, [serialIds]);
      
      if (stockResult.rows.length === 0) {
        throw new Error('No valid Platelet stock records found for transfer to non-conforming');
      }

      let transferredCount = 0;
      const serialIdsToDelete = [];

      for (const stockRecord of stockResult.rows) {
        const checkExistingQuery = `
          SELECT nc_id FROM non_conforming WHERE nc_serial_id = $1
        `;
        const existingResult = await client.query(checkExistingQuery, [stockRecord.bs_serial_id]);
        
        if (existingResult.rows.length > 0) {
          console.warn(`Serial ID ${stockRecord.bs_serial_id} already exists in non_conforming, skipping`);
          continue;
        }

        const insertQuery = `
          INSERT INTO non_conforming (
            nc_serial_id, nc_blood_type, nc_rh_factor, nc_volume,
            nc_timestamp, nc_expiration_date, nc_status, nc_created_at, nc_category
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;
        
        const values = [
          stockRecord.bs_serial_id,
          stockRecord.bs_blood_type,
          stockRecord.bs_rh_factor,
          stockRecord.bs_volume,
          stockRecord.bs_timestamp,
          stockRecord.bs_expiration_date,
          'Non-Conforming',
          stockRecord.bs_created_at,
          'Platelet'
        ];
        
        await client.query(insertQuery, values);
        transferredCount++;
        serialIdsToDelete.push(stockRecord.bs_serial_id);
      }

      if (serialIdsToDelete.length > 0) {
        const deleteQuery = `
          DELETE FROM blood_stock 
          WHERE bs_serial_id = ANY($1) 
            AND bs_status = 'Stored'
            AND bs_category = 'Platelet'
        `;
        await client.query(deleteQuery, [serialIdsToDelete]);
      }

      await client.query('COMMIT');
      return { success: true, transferredCount: transferredCount };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error transferring platelet to non-conforming:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Update platelet non-conforming record
  async updatePlateletNonConforming(id, ncData) {
    try {
      const query = `
        UPDATE non_conforming SET
          nc_serial_id = $2,
          nc_blood_type = $3,
          nc_rh_factor = $4,
          nc_volume = $5,
          nc_timestamp = $6,
          nc_expiration_date = $7,
          nc_status = $8,
          nc_modified_at = NOW(),
          nc_category = $9
        WHERE nc_id = $1 AND nc_category = 'Platelet'
      `;
      
      const values = [
        id,
        ncData.serial_id,
        ncData.type,
        ncData.rhFactor,
        parseInt(ncData.volume),
        new Date(ncData.collection),
        new Date(ncData.expiration),
        'Non-Conforming',
        'Platelet'
      ];
      
      await pool.query(query, values);
      return true;
    } catch (error) {
      console.error('Error updating platelet non-conforming record:', error);
      throw error;
    }
  },

  // Delete platelet non-conforming records
  async deletePlateletNonConforming(ids) {
    try {
      const query = 'DELETE FROM non_conforming WHERE nc_id = ANY($1) AND nc_category = \'Platelet\'';
      await pool.query(query, [ids]);
      return true;
    } catch (error) {
      console.error('Error deleting platelet non-conforming records:', error);
      throw error;
    }
  },

  // Search platelet non-conforming records
  async searchPlateletNonConforming(searchTerm) {
    try {
      const query = `
        SELECT 
          nc_id as id,
          nc_serial_id as serial_id,
          nc_blood_type as type,
          nc_rh_factor as "rhFactor",
          nc_volume as volume,
          TO_CHAR(nc_timestamp, 'MM/DD/YYYY') as collection,
          TO_CHAR(nc_expiration_date, 'MM/DD/YYYY') as expiration,
          nc_status as status,
          TO_CHAR(nc_created_at, 'MM/DD/YYYY-HH24:MI:SS') as created,
          CASE 
            WHEN nc_modified_at IS NOT NULL 
            THEN TO_CHAR(nc_modified_at, 'MM/DD/YYYY-HH24:MI:SS')
            ELSE '-'
          END as modified,
          nc_category as category
        FROM non_conforming 
        WHERE nc_category = 'Platelet'
          AND (
            nc_serial_id ILIKE $1 OR 
            nc_blood_type ILIKE $1 OR 
            nc_status ILIKE $1 OR
            nc_rh_factor ILIKE $1
          )
        ORDER BY nc_created_at DESC
      `;
      
      const result = await pool.query(query, [`%${searchTerm}%`]);
      return result.rows.map(row => ({
        ...row,
        selected: false
      }));
    } catch (error) {
      console.error('Error searching platelet non-conforming records:', error);
      throw error;
    }
  },

  // Discard platelet non-conforming stock
  async discardPlateletNonConformingStock(discardData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const getNonConformingQuery = `
        SELECT * FROM non_conforming 
        WHERE nc_serial_id = ANY($1) AND nc_category = 'Platelet'
      `;
      const ncResult = await client.query(getNonConformingQuery, [discardData.serialIds]);
      
      if (ncResult.rows.length === 0) {
        throw new Error('No valid platelet non-conforming records found for discard');
      }

      let discardedCount = 0;
      const serialIdsToDelete = [];

      for (const ncRecord of ncResult.rows) {
        const checkExistingQuery = `
          SELECT db_id FROM discarded_blood WHERE db_serial_id = $1
        `;
        const existingResult = await client.query(checkExistingQuery, [ncRecord.nc_serial_id]);
        
        if (existingResult.rows.length > 0) {
          console.warn(`Serial ID ${ncRecord.nc_serial_id} already exists in discarded_blood, skipping`);
          continue;
        }

        const insertQuery = `
          INSERT INTO discarded_blood (
            db_serial_id, db_blood_type, db_rh_factor, db_volume,
            db_timestamp, db_expiration_date, db_status, db_created_at, 
            db_discarded_at, db_category, db_original_id,
            db_responsible_personnel, db_reason_for_discarding, db_authorized_by,
            db_date_of_discard, db_time_of_discard, db_method_of_disposal, db_remarks
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10, $11, $12, $13, $14, $15, $16, $17)
        `;
        
        const values = [
          ncRecord.nc_serial_id,
          ncRecord.nc_blood_type,
          ncRecord.nc_rh_factor,
          ncRecord.nc_volume,
          ncRecord.nc_timestamp,
          ncRecord.nc_expiration_date,
          'Discarded',
          ncRecord.nc_created_at,
          'Platelet',
          ncRecord.nc_id,
          discardData.responsiblePersonnel,
          discardData.reasonForDiscarding,
          discardData.authorizedBy,
          new Date(discardData.dateOfDiscard),
          discardData.timeOfDiscard,
          discardData.methodOfDisposal,
          discardData.remarks || ''
        ];
        
        await client.query(insertQuery, values);
        discardedCount++;
        serialIdsToDelete.push(ncRecord.nc_serial_id);
      }

      if (serialIdsToDelete.length > 0) {
        const deleteQuery = `
          DELETE FROM non_conforming 
          WHERE nc_serial_id = ANY($1) AND nc_category = 'Platelet'
        `;
        await client.query(deleteQuery, [serialIdsToDelete]);
      }

      await client.query('COMMIT');
      return { success: true, discardedCount: discardedCount };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error discarding platelet non-conforming stock:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Get platelet non-conforming by serial ID for discard
  async getPlateletNonConformingBySerialIdForDiscard(serialId) {
    try {
      let query = `
        SELECT 
          nc_id as id,
          nc_serial_id as serial_id,
          nc_blood_type as type,
          nc_rh_factor as "rhFactor",
          nc_volume as volume,
          TO_CHAR(nc_timestamp, 'YYYY-MM-DD') as collection,
          TO_CHAR(nc_expiration_date, 'YYYY-MM-DD') as expiration,
          nc_status as status,
          TO_CHAR(nc_created_at, 'MM/DD/YYYY-HH24:MI:SS') as created,
          CASE 
            WHEN nc_modified_at IS NOT NULL 
            THEN TO_CHAR(nc_modified_at, 'MM/DD/YYYY-HH24:MI:SS')
            ELSE '-'
          END as modified,
          nc_category as category
        FROM non_conforming 
        WHERE nc_serial_id = $1 AND nc_category = 'Platelet'
      `;
      
      let result = await pool.query(query, [serialId.trim()]);
      
      if (result.rows.length > 0) {
        return result.rows[0];
      }
      
      if (serialId.length > 0) {
        query = `
          SELECT 
            nc_id as id,
            nc_serial_id as serial_id,
            nc_blood_type as type,
            nc_rh_factor as "rhFactor",
            nc_volume as volume,
            TO_CHAR(nc_timestamp, 'YYYY-MM-DD') as collection,
            TO_CHAR(nc_expiration_date, 'YYYY-MM-DD') as expiration,
            nc_status as status,
            TO_CHAR(nc_created_at, 'MM/DD/YYYY-HH24:MI:SS') as created,
            CASE 
              WHEN nc_modified_at IS NOT NULL 
              THEN TO_CHAR(nc_modified_at, 'MM/DD/YYYY-HH24:MI:SS')
              ELSE '-'
            END as modified,
            nc_category as category
          FROM non_conforming 
          WHERE nc_serial_id ILIKE $1 AND nc_category = 'Platelet'
          ORDER BY nc_serial_id
          LIMIT 5
        `;
        
        result = await pool.query(query, [`%${serialId.trim()}%`]);
        
        if (result.rows.length > 0) {
          return result.rows;
        }
      }

      return null;
    } catch (error) {
      throw error;
    }
  },


  // ========== PLASMA NON-CONFORMING METHODS ==========

  // Get all plasma non-conforming records
  async getAllPlasmaNonConforming() {
    try {
      const query = `
        SELECT 
          nc_id as id,
          nc_serial_id as serial_id,
          nc_blood_type as type,
          nc_rh_factor as "rhFactor",
          nc_volume as volume,
          TO_CHAR(nc_timestamp, 'MM/DD/YYYY') as collection,
          TO_CHAR(nc_expiration_date, 'MM/DD/YYYY') as expiration,
          nc_status as status,
          TO_CHAR(nc_created_at, 'MM/DD/YYYY-HH24:MI:SS') as created,
          CASE 
            WHEN nc_modified_at IS NOT NULL 
            THEN TO_CHAR(nc_modified_at, 'MM/DD/YYYY-HH24:MI:SS')
            ELSE '-'
          END as modified,
          nc_category as category
        FROM non_conforming 
        WHERE nc_category = 'Plasma'
        ORDER BY nc_created_at DESC
      `;
      
      const result = await pool.query(query);
      return result.rows.map(row => ({
        ...row,
        selected: false
      }));
    } catch (error) {
      console.error('Error fetching plasma non-conforming records:', error);
      throw error;
    }
  },

  // Get plasma stock by serial ID for non-conforming (from blood_stock with Stored status)
  async getPlasmaStockBySerialIdForNC(serialId) {
    try {
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
        WHERE bs_serial_id = $1 
          AND bs_status = 'Stored'
          AND bs_category = 'Plasma'
      `;
      
      let result = await pool.query(query, [serialId]);
      
      if (result.rows.length > 0) {
        return result.rows[0];
      }
      
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
          WHERE bs_serial_id ILIKE $1 
            AND bs_status = 'Stored'
            AND bs_category = 'Plasma'
          ORDER BY bs_serial_id
          LIMIT 5
        `;
        
        result = await pool.query(query, [`%${serialId}%`]);
        return result.rows;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching plasma stock by serial ID for NC:', error);
      throw error;
    }
  },

  // Transfer plasma stock to non-conforming
  async transferPlasmaToNonConforming(serialIds) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const getStockQuery = `
        SELECT * FROM blood_stock 
        WHERE bs_serial_id = ANY($1) 
          AND bs_status = 'Stored'
          AND bs_category = 'Plasma'
      `;
      const stockResult = await client.query(getStockQuery, [serialIds]);
      
      if (stockResult.rows.length === 0) {
        throw new Error('No valid Plasma stock records found for transfer to non-conforming');
      }

      let transferredCount = 0;
      const serialIdsToDelete = [];

      for (const stockRecord of stockResult.rows) {
        const checkExistingQuery = `
          SELECT nc_id FROM non_conforming WHERE nc_serial_id = $1
        `;
        const existingResult = await client.query(checkExistingQuery, [stockRecord.bs_serial_id]);
        
        if (existingResult.rows.length > 0) {
          console.warn(`Serial ID ${stockRecord.bs_serial_id} already exists in non_conforming, skipping`);
          continue;
        }

        const insertQuery = `
          INSERT INTO non_conforming (
            nc_serial_id, nc_blood_type, nc_rh_factor, nc_volume,
            nc_timestamp, nc_expiration_date, nc_status, nc_created_at, nc_category
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;
        
        const values = [
          stockRecord.bs_serial_id,
          stockRecord.bs_blood_type,
          stockRecord.bs_rh_factor,
          stockRecord.bs_volume,
          stockRecord.bs_timestamp,
          stockRecord.bs_expiration_date,
          'Non-Conforming',
          stockRecord.bs_created_at,
          'Plasma'
        ];
        
        await client.query(insertQuery, values);
        transferredCount++;
        serialIdsToDelete.push(stockRecord.bs_serial_id);
      }

      if (serialIdsToDelete.length > 0) {
        const deleteQuery = `
          DELETE FROM blood_stock 
          WHERE bs_serial_id = ANY($1) 
            AND bs_status = 'Stored'
            AND bs_category = 'Plasma'
        `;
        await client.query(deleteQuery, [serialIdsToDelete]);
      }

      await client.query('COMMIT');
      return { success: true, transferredCount: transferredCount };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error transferring plasma to non-conforming:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Update plasma non-conforming record
  async updatePlasmaNonConforming(id, ncData) {
    try {
      const query = `
        UPDATE non_conforming SET
          nc_serial_id = $2,
          nc_blood_type = $3,
          nc_rh_factor = $4,
          nc_volume = $5,
          nc_timestamp = $6,
          nc_expiration_date = $7,
          nc_status = $8,
          nc_modified_at = NOW(),
          nc_category = $9
        WHERE nc_id = $1 AND nc_category = 'Plasma'
      `;
      
      const values = [
        id,
        ncData.serial_id,
        ncData.type,
        ncData.rhFactor,
        parseInt(ncData.volume),
        new Date(ncData.collection),
        new Date(ncData.expiration),
        'Non-Conforming',
        'Plasma'
      ];
      
      await pool.query(query, values);
      return true;
    } catch (error) {
      console.error('Error updating plasma non-conforming record:', error);
      throw error;
    }
  },

  // Delete plasma non-conforming records
  async deletePlasmaNonConforming(ids) {
    try {
      const query = 'DELETE FROM non_conforming WHERE nc_id = ANY($1) AND nc_category = \'Plasma\'';
      await pool.query(query, [ids]);
      return true;
    } catch (error) {
      console.error('Error deleting plasma non-conforming records:', error);
      throw error;
    }
  },

  // Search plasma non-conforming records
  async searchPlasmaNonConforming(searchTerm) {
    try {
      const query = `
        SELECT 
          nc_id as id,
          nc_serial_id as serial_id,
          nc_blood_type as type,
          nc_rh_factor as "rhFactor",
          nc_volume as volume,
          TO_CHAR(nc_timestamp, 'MM/DD/YYYY') as collection,
          TO_CHAR(nc_expiration_date, 'MM/DD/YYYY') as expiration,
          nc_status as status,
          TO_CHAR(nc_created_at, 'MM/DD/YYYY-HH24:MI:SS') as created,
          CASE 
            WHEN nc_modified_at IS NOT NULL 
            THEN TO_CHAR(nc_modified_at, 'MM/DD/YYYY-HH24:MI:SS')
            ELSE '-'
          END as modified,
          nc_category as category
        FROM non_conforming 
        WHERE nc_category = 'Plasma'
          AND (
            nc_serial_id ILIKE $1 OR 
            nc_blood_type ILIKE $1 OR 
            nc_status ILIKE $1 OR
            nc_rh_factor ILIKE $1
          )
        ORDER BY nc_created_at DESC
      `;
      
      const result = await pool.query(query, [`%${searchTerm}%`]);
      return result.rows.map(row => ({
        ...row,
        selected: false
      }));
    } catch (error) {
      console.error('Error searching plasma non-conforming records:', error);
      throw error;
    }
  },

  // Discard plasma non-conforming stock
  async discardPlasmaNonConformingStock(discardData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const getNonConformingQuery = `
        SELECT * FROM non_conforming 
        WHERE nc_serial_id = ANY($1) AND nc_category = 'Plasma'
      `;
      const ncResult = await client.query(getNonConformingQuery, [discardData.serialIds]);
      
      if (ncResult.rows.length === 0) {
        throw new Error('No valid plasma non-conforming records found for discard');
      }

      let discardedCount = 0;
      const serialIdsToDelete = [];

      for (const ncRecord of ncResult.rows) {
        const checkExistingQuery = `
          SELECT db_id FROM discarded_blood WHERE db_serial_id = $1
        `;
        const existingResult = await client.query(checkExistingQuery, [ncRecord.nc_serial_id]);
        
        if (existingResult.rows.length > 0) {
          console.warn(`Serial ID ${ncRecord.nc_serial_id} already exists in discarded_blood, skipping`);
          continue;
        }

        const insertQuery = `
          INSERT INTO discarded_blood (
            db_serial_id, db_blood_type, db_rh_factor, db_volume,
            db_timestamp, db_expiration_date, db_status, db_created_at, 
            db_discarded_at, db_category, db_original_id,
            db_responsible_personnel, db_reason_for_discarding, db_authorized_by,
            db_date_of_discard, db_time_of_discard, db_method_of_disposal, db_remarks
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10, $11, $12, $13, $14, $15, $16, $17)
        `;
        
        const values = [
          ncRecord.nc_serial_id,
          ncRecord.nc_blood_type,
          ncRecord.nc_rh_factor,
          ncRecord.nc_volume,
          ncRecord.nc_timestamp,
          ncRecord.nc_expiration_date,
          'Discarded',
          ncRecord.nc_created_at,
          'Plasma',
          ncRecord.nc_id,
          discardData.responsiblePersonnel,
          discardData.reasonForDiscarding,
          discardData.authorizedBy,
          new Date(discardData.dateOfDiscard),
          discardData.timeOfDiscard,
          discardData.methodOfDisposal,
          discardData.remarks || ''
        ];
        
        await client.query(insertQuery, values);
        discardedCount++;
        serialIdsToDelete.push(ncRecord.nc_serial_id);
      }

      if (serialIdsToDelete.length > 0) {
        const deleteQuery = `
          DELETE FROM non_conforming 
          WHERE nc_serial_id = ANY($1) AND nc_category = 'Plasma'
        `;
        await client.query(deleteQuery, [serialIdsToDelete]);
      }

      await client.query('COMMIT');
      return { success: true, discardedCount: discardedCount };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error discarding plasma non-conforming stock:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Get plasma non-conforming by serial ID for discard
  async getPlasmaNonConformingBySerialIdForDiscard(serialId) {
    try {
      let query = `
        SELECT 
          nc_id as id,
          nc_serial_id as serial_id,
          nc_blood_type as type,
          nc_rh_factor as "rhFactor",
          nc_volume as volume,
          TO_CHAR(nc_timestamp, 'YYYY-MM-DD') as collection,
          TO_CHAR(nc_expiration_date, 'YYYY-MM-DD') as expiration,
          nc_status as status,
          TO_CHAR(nc_created_at, 'MM/DD/YYYY-HH24:MI:SS') as created,
          CASE 
            WHEN nc_modified_at IS NOT NULL 
            THEN TO_CHAR(nc_modified_at, 'MM/DD/YYYY-HH24:MI:SS')
            ELSE '-'
          END as modified,
          nc_category as category
        FROM non_conforming 
        WHERE nc_serial_id = $1 AND nc_category = 'Plasma'
      `;
      
      let result = await pool.query(query, [serialId.trim()]);
      
      if (result.rows.length > 0) {
        return result.rows[0];
      }
      
      if (serialId.length > 0) {
        query = `
          SELECT 
            nc_id as id,
            nc_serial_id as serial_id,
            nc_blood_type as type,
            nc_rh_factor as "rhFactor",
            nc_volume as volume,
            TO_CHAR(nc_timestamp, 'YYYY-MM-DD') as collection,
            TO_CHAR(nc_expiration_date, 'YYYY-MM-DD') as expiration,
            nc_status as status,
            TO_CHAR(nc_created_at, 'MM/DD/YYYY-HH24:MI:SS') as created,
            CASE 
              WHEN nc_modified_at IS NOT NULL 
              THEN TO_CHAR(nc_modified_at, 'MM/DD/YYYY-HH24:MI:SS')
              ELSE '-'
            END as modified,
            nc_category as category
          FROM non_conforming 
          WHERE nc_serial_id ILIKE $1 AND nc_category = 'Plasma'
          ORDER BY nc_serial_id
          LIMIT 5
        `;
        
        result = await pool.query(query, [`%${serialId.trim()}%`]);
        
        if (result.rows.length > 0) {
          return result.rows;
        }
      }

      return null;
    } catch (error) {
      throw error;
    }
  },


  // Get blood stock counts by category
  async getBloodStockCounts() {
    try {
      const query = `
        SELECT
          bs_category as category,
          COUNT(*) as count
        FROM blood_stock
        WHERE bs_status = 'Stored'
        GROUP BY bs_category
      `;

      const result = await pool.query(query);

      // Transform to object format
      const counts = {
        redBloodCell: 0,
        platelet: 0,
        plasma: 0
      };

      result.rows.forEach(row => {
        if (row.category === 'Red Blood Cell') {
          counts.redBloodCell = parseInt(row.count);
        } else if (row.category === 'Platelet') {
          counts.platelet = parseInt(row.count);
        } else if (row.category === 'Plasma') {
          counts.plasma = parseInt(row.count);
        }
      });

      return counts;
    } catch (error) {
      console.error('Error getting blood stock counts:', error);
      throw error;
    }
  },

  // Get blood stock counts by result blood type (combining all categories)
  async getBloodStockCountsByType() {
    try {
      const query = `
        SELECT
          bs_result_bloodtype as result_bloodtype,
          COUNT(*) as count
        FROM blood_stock
        WHERE bs_status = 'Stored' AND bs_result_bloodtype IS NOT NULL
        GROUP BY bs_result_bloodtype
      `;

      const result = await pool.query(query);

      // Transform to object format with blood types
      const counts = {
        'AB+': 0,
        'AB-': 0,
        'A+': 0,
        'A-': 0,
        'B+': 0,
        'B-': 0,
        'O+': 0,
        'O-': 0
      };

      result.rows.forEach(row => {
        const fullType = row.result_bloodtype;
        if (fullType && counts.hasOwnProperty(fullType)) {
          counts[fullType] += parseInt(row.count);
        }
      });

      return counts;
    } catch (error) {
      console.error('Error getting blood stock counts by type:', error);
      throw error;
    }
  },

  // ========== RBC USER PROFILE MANAGEMENT ==========

  // Get RBC user profile
  async getUserProfileRBC(userId) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // First, ensure the doh_id and updated_at columns exist
      await client.query(`
        ALTER TABLE user_doh
        ADD COLUMN IF NOT EXISTS doh_id VARCHAR(50) UNIQUE
      `);

      await client.query(`
        ALTER TABLE user_doh
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP
      `);

      await client.query(`
        ALTER TABLE user_doh
        ADD COLUMN IF NOT EXISTS barangay TEXT
      `);

      console.log('✓ DOH ID column verified/created in user_doh table');

      // Ensure rbc_user_profiles table exists BEFORE querying it
      await client.query(`
        CREATE TABLE IF NOT EXISTS rbc_user_profiles (
          id SERIAL PRIMARY KEY,
          user_id INTEGER UNIQUE REFERENCES user_doh(user_id) ON DELETE CASCADE,
          profile_photo TEXT,
          gender VARCHAR(50) CHECK (gender IN ('Male', 'Female', 'Non-Binary', 'Prefer Not to Say')),
          date_of_birth DATE,
          nationality VARCHAR(100) DEFAULT 'Filipino',
          civil_status VARCHAR(50) CHECK (civil_status IN ('Single', 'Married', 'Widowed', 'Divorced', 'Separated')),
          blood_type VARCHAR(3) CHECK (blood_type IN ('AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('✓ RBC user profiles table verified/created');

      const result = await client.query(`
        SELECT
          u.user_id,
          u.doh_id,
          u.full_name,
          u.role,
          u.barangay,
          u.email,
          p.profile_photo,
          p.gender,
          TO_CHAR(p.date_of_birth, 'YYYY-MM-DD') as date_of_birth,
          p.nationality,
          p.civil_status,
          p.blood_type
        FROM user_doh u
        LEFT JOIN rbc_user_profiles p ON u.user_id = p.user_id
        WHERE u.user_id = $1
      `, [userId]);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      let profile = result.rows[0];

      // If DOH ID doesn't exist, generate and save it
      if (!profile.doh_id) {
        console.log(`[DB] Generating new DOH ID for user ${userId}...`);
        const newDohId = await this.generateDohIdRBC(client);

        await client.query(`
          UPDATE user_doh
          SET doh_id = $1, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $2
        `, [newDohId, userId]);

        profile.doh_id = newDohId;
        console.log(`[DB] ✓ New DOH ID generated: ${newDohId} for user ${userId}`);
      }

      await client.query('COMMIT');
      return profile;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[DB] Error getting RBC user profile:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Generate DOH ID for RBC users
  async generateDohIdRBC(client = null) {
    const shouldReleaseClient = !client;
    if (!client) {
      client = await pool.connect();
    }

    try {
      let isUnique = false;
      let dohId;

      while (!isUnique) {
        const randomNumber = Math.floor(100000000 + Math.random() * 900000000);
        dohId = `DOH-${randomNumber}`;

        const checkResult = await client.query(
          'SELECT doh_id FROM user_doh WHERE doh_id = $1',
          [dohId]
        );

        if (checkResult.rows.length === 0) {
          isUnique = true;
        }
      }

      return dohId;
    } finally {
      if (shouldReleaseClient) {
        client.release();
      }
    }
  },

  // Update RBC user profile
  async updateUserProfileRBC(userId, profileData, userName = 'System User') {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Update barangay, role, and full_name in user_doh table if provided
      const userUpdates = [];
      const userValues = [];
      let userParamCounter = 1;

      if (profileData.barangay !== undefined) {
        userUpdates.push(`barangay = $${userParamCounter++}`);
        userValues.push(profileData.barangay);
      }

      if (profileData.role !== undefined) {
        userUpdates.push(`role = $${userParamCounter++}`);
        userValues.push(profileData.role);
      }

      if (profileData.dohId !== undefined) {
        userUpdates.push(`doh_id = $${userParamCounter++}`);
        userValues.push(profileData.dohId);
      }

      if (userUpdates.length > 0) {
        userUpdates.push('updated_at = CURRENT_TIMESTAMP');
        userValues.push(userId);

        await client.query(
          `UPDATE user_doh SET ${userUpdates.join(', ')} WHERE user_id = $${userParamCounter}`,
          userValues
        );
      }

      // Update full_name separately if provided
      if (userName && userName !== 'System User') {
        await client.query(
          'UPDATE user_doh SET full_name = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
          [userName, userId]
        );
      }

      // Ensure activity_logs table exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS activity_logs (
          id SERIAL PRIMARY KEY,
          user_name VARCHAR(255) NOT NULL,
          action_type VARCHAR(50) NOT NULL,
          entity_type VARCHAR(50) NOT NULL,
          entity_id VARCHAR(100),
          action_description TEXT NOT NULL,
          details JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes for better performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_name);
        CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
      `);

      // Ensure rbc_user_profiles table exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS rbc_user_profiles (
          id SERIAL PRIMARY KEY,
          user_id INTEGER UNIQUE REFERENCES user_doh(user_id) ON DELETE CASCADE,
          profile_photo TEXT,
          gender VARCHAR(50) CHECK (gender IN ('Male', 'Female', 'Non-Binary', 'Prefer Not to Say')),
          date_of_birth DATE,
          nationality VARCHAR(100) DEFAULT 'Filipino',
          civil_status VARCHAR(50) CHECK (civil_status IN ('Single', 'Married', 'Widowed', 'Divorced', 'Separated')),
          blood_type VARCHAR(3) CHECK (blood_type IN ('AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Check if profile exists
      const existingProfile = await client.query(
        'SELECT id FROM rbc_user_profiles WHERE user_id = $1',
        [userId]
      );

      let result;
      if (existingProfile.rows.length > 0) {
        // Update existing profile
        const updateQuery = `
          UPDATE rbc_user_profiles SET
            profile_photo = $2,
            gender = $3,
            date_of_birth = $4,
            nationality = $5,
            civil_status = $6,
            blood_type = $7,
            updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $1
          RETURNING *
        `;

        result = await client.query(updateQuery, [
          userId,
          profileData.profilePhoto || null,
          profileData.gender || null,
          profileData.dateOfBirth || null,
          profileData.nationality || null,
          profileData.civilStatus || null,
          profileData.bloodType || null
        ]);
        console.log(`[DB] ✓ RBC user profile updated for user ${userId}`);
      } else {
        // Insert new profile
        const insertQuery = `
          INSERT INTO rbc_user_profiles (
            user_id, profile_photo, gender, date_of_birth,
            nationality, civil_status, blood_type
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;

        result = await client.query(insertQuery, [
          userId,
          profileData.profilePhoto || null,
          profileData.gender || null,
          profileData.dateOfBirth || null,
          profileData.nationality || null,
          profileData.civilStatus || null,
          profileData.bloodType || null
        ]);
        console.log(`[DB] ✓ New RBC user profile created for user ${userId}`);
      }

      // Log activity
      await client.query(
        `INSERT INTO activity_logs (user_name, action_type, action_description, entity_type, entity_id, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userName || 'Unknown User',
          'update',
          `${userName || 'User'} updated their profile`,
          'user_profile',
          userId.toString(),
          JSON.stringify({
            updated_fields: Object.keys(profileData).filter(key => profileData[key] !== undefined)
          })
        ]
      );

      await client.query('COMMIT');
      console.log(`[DB] ✓ Profile changes saved successfully for user ${userId}`);
      return { success: true, profile: result.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[DB] Error updating RBC user profile:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Get RBC user activities
  async getUserActivitiesRBC(userId, limit = 100, offset = 0) {
    try {
      // First get the user's full name
      const userResult = await pool.query(
        'SELECT full_name FROM user_doh WHERE user_id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return [];
      }

      const userName = userResult.rows[0].full_name;

      // Get activities for this user
      const result = await pool.query(
        `SELECT
          id,
          user_name,
          action_type,
          action_description,
          entity_type,
          entity_id,
          details,
          created_at
         FROM activity_logs
         WHERE user_name = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userName, limit, offset]
      );

      return result.rows.map(row => ({
        ...row,
        details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details
      }));
    } catch (error) {
      console.error('[DB] Error getting RBC user activities:', error);
      throw error;
    }
  },

  // ========== ACTIVITY LOGGING FUNCTIONS ==========

  // Log a single activity
  async logActivity(activityData) {
    try {
      const insertQuery = `
        INSERT INTO activity_logs (
          user_name, action_type, entity_type, entity_id,
          action_description, details
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const values = [
        activityData.userName,
        activityData.actionType,
        activityData.entityType,
        activityData.entityId,
        activityData.actionDescription,
        JSON.stringify(activityData.details || {})
      ];

      const result = await pool.query(insertQuery, values);
      return result.rows[0];
    } catch (error) {
      console.error('[DB] Error logging activity:', error);
      // Don't throw error to prevent activity logging from breaking main operations
    }
  },

  // Get all activities with pagination
  async getAllActivitiesRBC(limit = 100, offset = 0) {
    try {
      const result = await pool.query(`
        SELECT
          id,
          user_name,
          action_type,
          entity_type,
          entity_id,
          action_description,
          details,
          created_at
        FROM activity_logs
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);

      return result.rows.map(row => ({
        ...row,
        details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details
      }));
    } catch (error) {
      console.error('[DB] Error getting all activities:', error);
      throw error;
    }
  },

  // Search activities
  async searchActivitiesRBC(searchTerm, limit = 100) {
    try {
      const result = await pool.query(`
        SELECT
          id,
          user_name,
          action_type,
          entity_type,
          entity_id,
          action_description,
          details,
          created_at
        FROM activity_logs
        WHERE
          user_name ILIKE $1 OR
          action_description ILIKE $1 OR
          entity_type ILIKE $1 OR
          entity_id ILIKE $1
        ORDER BY created_at DESC
        LIMIT $2
      `, [`%${searchTerm}%`, limit]);

      return result.rows.map(row => ({
        ...row,
        details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details
      }));
    } catch (error) {
      console.error('[DB] Error searching activities:', error);
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