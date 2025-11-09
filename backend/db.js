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

// Ensure donor_records table exists (Main System - Regional Blood Center)
const ensureDonorRecordsTable = async () => {
  try {
    // Add new columns to existing donor_records table if they don't exist
    // Note: The donor_records table already exists with dr_ prefixed columns

    await pool.query(`
      ALTER TABLE donor_records
      ADD COLUMN IF NOT EXISTS dr_times_donated INTEGER DEFAULT 1
    `);

    await pool.query(`
      ALTER TABLE donor_records
      ADD COLUMN IF NOT EXISTS dr_donation_dates JSONB DEFAULT '[]'::jsonb
    `);

    await pool.query(`
      ALTER TABLE donor_records
      ADD COLUMN IF NOT EXISTS dr_last_donation_date TIMESTAMP
    `);

    await pool.query(`
      ALTER TABLE donor_records
      ADD COLUMN IF NOT EXISTS dr_source_organization VARCHAR(255)
    `);

    // Create indexes for new columns
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_donor_records_times_donated ON donor_records(dr_times_donated)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_donor_records_last_donation_date ON donor_records(dr_last_donation_date)`);

    // Create update trigger for dr_modified_at (if your table uses this column)
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_donor_records_modified_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.dr_modified_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    const trigCheck = await pool.query(`SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_donor_records_modified_at'`);
    if (trigCheck.rowCount === 0) {
      await pool.query(`
        CREATE TRIGGER trigger_update_donor_records_modified_at
        BEFORE UPDATE ON donor_records
        FOR EACH ROW
        EXECUTE FUNCTION update_donor_records_modified_at();
      `);
    }

    console.log('Donor records table columns ensured successfully');
    return true;
  } catch (error) {
    console.error('Error ensuring donor_records table:', error);
    throw error;
  }
};

// Ensure temp_donor_records table exists (for sync requests)
const ensureTempDonorRecordsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS temp_donor_records (
        tdr_id SERIAL PRIMARY KEY,
        tdr_donor_id VARCHAR(50) NOT NULL,
        tdr_first_name VARCHAR(100) NOT NULL,
        tdr_middle_name VARCHAR(100),
        tdr_last_name VARCHAR(100) NOT NULL,
        tdr_gender VARCHAR(10) NOT NULL CHECK (tdr_gender IN ('Male', 'Female')),
        tdr_birthdate DATE NOT NULL,
        tdr_age INTEGER NOT NULL,
        tdr_blood_type VARCHAR(3) NOT NULL CHECK (tdr_blood_type IN ('A', 'B', 'AB', 'O')),
        tdr_rh_factor VARCHAR(1) NOT NULL CHECK (tdr_rh_factor IN ('+', '-')),
        tdr_contact_number VARCHAR(20) NOT NULL,
        tdr_address TEXT NOT NULL,
        tdr_source_organization VARCHAR(255) NOT NULL,
        tdr_source_user_id INTEGER NOT NULL,
        tdr_source_user_name VARCHAR(255) NOT NULL,
        tdr_sync_status VARCHAR(20) DEFAULT 'pending' CHECK (tdr_sync_status IN ('pending', 'approved', 'rejected')),
        tdr_sync_requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        tdr_sync_approved_at TIMESTAMP,
        tdr_sync_approved_by VARCHAR(255),
        tdr_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        tdr_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes one by one to avoid issues
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_temp_donor_records_donor_id ON temp_donor_records(tdr_donor_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_temp_donor_records_sync_status ON temp_donor_records(tdr_sync_status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_temp_donor_records_source_org ON temp_donor_records(tdr_source_organization)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_temp_donor_records_requested_at ON temp_donor_records(tdr_sync_requested_at)`);

    // Create update trigger
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_temp_donor_records_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.tdr_updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    const trigCheck = await pool.query(`SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_temp_donor_records_updated_at'`);
    if (trigCheck.rowCount === 0) {
      await pool.query(`
        CREATE TRIGGER trigger_update_temp_donor_records_updated_at
        BEFORE UPDATE ON temp_donor_records
        FOR EACH ROW
        EXECUTE FUNCTION update_temp_donor_records_updated_at();
      `);
    }

    console.log('Temp donor records table ensured successfully');
    return true;
  } catch (error) {
    console.error('Error ensuring temp_donor_records table:', error);
    throw error;
  }
};

// Ensure notifications table exists
const ensureNotificationsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        user_name VARCHAR(255),
        notification_type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        related_entity_type VARCHAR(50),
        related_entity_id VARCHAR(255),
        link_to VARCHAR(255),
        is_read BOOLEAN DEFAULT FALSE,
        status VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
        priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP,
        archived_at TIMESTAMP
      )
    `);

    // Migrate related_entity_id from INTEGER to VARCHAR if needed
    try {
      await pool.query(`
        ALTER TABLE notifications
        ALTER COLUMN related_entity_id TYPE VARCHAR(255) USING related_entity_id::VARCHAR
      `);
      console.log('✓ related_entity_id migrated to VARCHAR');
    } catch (alterError) {
      // Column might already be VARCHAR, which is fine
      if (!alterError.message.includes('already')) {
        console.log('related_entity_id column type check:', alterError.message);
      }
    }

    // Create indexes one by one to avoid issues
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_related_entity ON notifications(related_entity_type, related_entity_id)`);

    console.log('Notifications table ensured successfully');
    return true;
  } catch (error) {
    console.error('Error ensuring notifications table:', error);
    throw error;
  }
};

// Ensure partnership_requests table exists
const ensurePartnershipRequestsTable = async () => {
  try {
    // 1. MODIFIED: Added 'confirmed', 'scheduled' and a name 'partnership_requests_status_check'
    await pool.query(`
      CREATE TABLE IF NOT EXISTS partnership_requests (
        id SERIAL PRIMARY KEY,
        appointment_id BIGINT NOT NULL,
        organization_name VARCHAR(255) NOT NULL,
        organization_barangay VARCHAR(255) NOT NULL,
        contact_name VARCHAR(255) NOT NULL,
        contact_email VARCHAR(255) NOT NULL,
        contact_phone VARCHAR(50) NOT NULL,
        event_date DATE NOT NULL,
        event_time TIME NOT NULL,
        event_address TEXT,
        status VARCHAR(50) DEFAULT 'pending' 
          CONSTRAINT partnership_requests_status_check 
          CHECK (status IN ('pending', 'approved', 'declined', 'confirmed', 'scheduled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_by VARCHAR(255),
        approved_at TIMESTAMP
      )
    `);

    // 2. ADDED: This block fixes existing tables
    try {
      // Find all old 'c' (check) constraints on the 'status' column
      const checkQuery = `
        SELECT con.conname
        FROM pg_catalog.pg_constraint con
        JOIN pg_catalog.pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
        WHERE con.conrelid = 'partnership_requests'::regclass
          AND con.contype = 'c'
          AND att.attname = 'status'
          AND con.conname != 'partnership_requests_status_check';
      `;
      
      const checkRes = await pool.query(checkQuery);

      // Drop all old, unnamed check constraints found
      for (const row of checkRes.rows) {
        console.log(`Dropping old status constraint: ${row.conname}`);
        await pool.query(`ALTER TABLE partnership_requests DROP CONSTRAINT "${row.conname}";`);
      }

      // Drop the named constraint *if it exists* (for idempotency)
      await pool.query(`
        ALTER TABLE partnership_requests
        DROP CONSTRAINT IF EXISTS partnership_requests_status_check;
      `);
      
      // Add the new, correct constraint
      await pool.query(`
        ALTER TABLE partnership_requests
        ADD CONSTRAINT partnership_requests_status_check
        CHECK (status IN ('pending', 'approved', 'declined', 'confirmed', 'scheduled'));
      `);
      
      console.log('✓ Partnership requests status constraint updated.');

    } catch (alterError) {
      console.error('Error updating partnership_requests constraints:', alterError.message);
    }
    // --- END OF ADDED BLOCK ---


    // Create indexes one by one to avoid issues
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_partnership_requests_status ON partnership_requests(status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_partnership_requests_created_at ON partnership_requests(created_at DESC)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_partnership_requests_org ON partnership_requests(organization_name)`);

    console.log('Partnership requests table ensured successfully');
    return true;
  } catch (error) {
    console.error('Error ensuring partnership_requests table:', error);
    throw error;
  }
};

// Ensure blood_reports table exists
const ensureBloodReportsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blood_reports (
        br_id SERIAL PRIMARY KEY,
        br_report_id VARCHAR(50) NOT NULL UNIQUE,
        br_quarter VARCHAR(20) NOT NULL,
        br_year INTEGER NOT NULL,
        br_month_start INTEGER NOT NULL,
        br_month_end INTEGER NOT NULL,
        br_month_labels TEXT[] NOT NULL,
        br_o_positive INTEGER DEFAULT 0,
        br_o_negative INTEGER DEFAULT 0,
        br_a_positive INTEGER DEFAULT 0,
        br_a_negative INTEGER DEFAULT 0,
        br_b_positive INTEGER DEFAULT 0,
        br_b_negative INTEGER DEFAULT 0,
        br_ab_positive INTEGER DEFAULT 0,
        br_ab_negative INTEGER DEFAULT 0,
        br_others INTEGER DEFAULT 0,
        br_o_positive_pct DECIMAL(5, 2) DEFAULT 0.00,
        br_o_negative_pct DECIMAL(5, 2) DEFAULT 0.00,
        br_a_positive_pct DECIMAL(5, 2) DEFAULT 0.00,
        br_a_negative_pct DECIMAL(5, 2) DEFAULT 0.00,
        br_b_positive_pct DECIMAL(5, 2) DEFAULT 0.00,
        br_b_negative_pct DECIMAL(5, 2) DEFAULT 0.00,
        br_ab_positive_pct DECIMAL(5, 2) DEFAULT 0.00,
        br_ab_negative_pct DECIMAL(5, 2) DEFAULT 0.00,
        br_others_pct DECIMAL(5, 2) DEFAULT 0.00,
        br_total_count INTEGER DEFAULT 0,
        br_month1_data JSONB,
        br_month2_data JSONB,
        br_month3_data JSONB,
        br_created_by VARCHAR(100),
        br_created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        br_modified_at TIMESTAMP WITH TIME ZONE,
        UNIQUE (br_quarter, br_year)
      )
    `);
    console.log('Blood reports table ensured successfully');
    return true;
  } catch (error) {
    console.error('Error ensuring blood_reports table:', error);
    throw error;
  }
};

const ensureActivityLogsTable = async () => {
  try {
    await pool.query(`
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
    console.log('Activity logs table ensured successfully');
    return true;
  } catch (error) {
    console.error('Error ensuring activity_logs table:', error);
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
      await ensureDonorRecordsTable();
      await ensureTempDonorRecordsTable();
      await ensureNotificationsTable();
      await ensurePartnershipRequestsTable();
      await ensureBloodReportsTable();
      await ensureActivityLogsTable();
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

  async loginUser(emailOrDohId, password) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Ensure last_login column exists
      await client.query(`
        ALTER TABLE user_doh
        ADD COLUMN IF NOT EXISTS last_login TIMESTAMP
      `);

      // Check if input looks like an email (contains @) or DOH ID
      const isEmail = emailOrDohId.includes('@');

      let result;
      if (isEmail) {
        // Login with email
        result = await client.query(
          `SELECT user_id, email, doh_id, password_hash, role, is_active, full_name, last_login FROM user_doh WHERE email = $1`,
          [emailOrDohId]
        );
      } else {
        // Login with DOH ID
        result = await client.query(
          `SELECT user_id, email, doh_id, password_hash, role, is_active, full_name, last_login FROM user_doh WHERE doh_id = $1`,
          [emailOrDohId]
        );
      }

      if (result.rowCount === 0) {
        await client.query('ROLLBACK');
        throw new Error('Invalid credentials');
      }

      const user = result.rows[0];

      if (!user.is_active) {
        await client.query('ROLLBACK');
        throw new Error('Account not activated');
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);

      if (!isMatch) {
        await client.query('ROLLBACK');
        throw new Error('Invalid credentials');
      }

      // Update last_login timestamp
      await client.query(
        `UPDATE user_doh SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1`,
        [user.user_id]
      );

      await client.query('COMMIT');

      return {
        userId: user.user_id,
        email: user.email,
        dohId: user.doh_id,
        role: user.role,
        fullName: user.full_name,
        lastLogin: user.last_login
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error logging in user:', error);
      throw error;
    } finally {
      client.release();
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

  async addBloodStock(bloodData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
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
      
      const result = await client.query(query, values);
      const stockId = result.rows[0].bs_id;
      
     
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error adding blood stock:', error);
      throw error;
    } finally {
      client.release();
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

      await client.query(`
        ALTER TABLE user_doh
        ADD COLUMN IF NOT EXISTS last_login TIMESTAMP
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
          u.last_login,
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

      // Ensure partnership_requests table exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS partnership_requests (
          id SERIAL PRIMARY KEY,
          appointment_id BIGINT NOT NULL,
          organization_name VARCHAR(255) NOT NULL,
          organization_barangay VARCHAR(255) NOT NULL,
          contact_name VARCHAR(255) NOT NULL,
          contact_email VARCHAR(255) NOT NULL,
          contact_phone VARCHAR(50) NOT NULL,
          event_date DATE NOT NULL,
          event_time TIME NOT NULL,
          event_address TEXT,
          status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          approved_by VARCHAR(255),
          approved_at TIMESTAMP
        )
      `);

      // Create indexes for partnership requests
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_partnership_requests_status ON partnership_requests(status);
        CREATE INDEX IF NOT EXISTS idx_partnership_requests_created_at ON partnership_requests(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_partnership_requests_org ON partnership_requests(organization_name);
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
        activityData.user_name || activityData.userName || 'System User',
        activityData.action_type || activityData.actionType,
        activityData.entity_type || activityData.entityType,
        activityData.entity_id || activityData.entityId,
        activityData.action_description || activityData.actionDescription,
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

  // ===== DONOR RECORDS SYNC METHODS =====

  // Request sync - Transfer donor records from org to temp table
  async requestDonorSync(donorRecords, sourceOrganization, sourceUserId, sourceUserName) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const insertedRecords = [];
      for (const donor of donorRecords) {
        const result = await client.query(`
          INSERT INTO temp_donor_records (
            tdr_donor_id, tdr_first_name, tdr_middle_name, tdr_last_name, tdr_gender, tdr_birthdate, tdr_age,
            tdr_blood_type, tdr_rh_factor, tdr_contact_number, tdr_address,
            tdr_source_organization, tdr_source_user_id, tdr_source_user_name, tdr_sync_status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'pending')
          RETURNING *
        `, [
          donor.donor_id, donor.first_name, donor.middle_name, donor.last_name,
          donor.gender, donor.birthdate, donor.age, donor.blood_type, donor.rh_factor,
          donor.contact_number, donor.address, sourceOrganization, sourceUserId,
          sourceUserName
        ]);
        insertedRecords.push(result.rows[0]);
      }

      await client.query('COMMIT');
      console.log(`[DB] Sync requested: ${insertedRecords.length} donor records added to temp table`);
      return insertedRecords;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[DB] Error requesting donor sync:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Get pending sync requests
  async getPendingSyncRequests() {
    try {
      const result = await pool.query(`
        SELECT
          tdr_id as id,
          tdr_donor_id as donor_id,
          tdr_first_name as first_name,
          tdr_middle_name as middle_name,
          tdr_last_name as last_name,
          tdr_gender as gender,
          tdr_birthdate as birthdate,
          tdr_age as age,
          tdr_blood_type as blood_type,
          tdr_rh_factor as rh_factor,
          tdr_contact_number as contact_number,
          tdr_address as address,
          tdr_source_organization as source_organization,
          tdr_source_user_id as source_user_id,
          tdr_source_user_name as source_user_name,
          tdr_sync_status as sync_status,
          tdr_sync_requested_at as sync_requested_at,
          tdr_sync_approved_at as sync_approved_at,
          tdr_sync_approved_by as sync_approved_by
        FROM temp_donor_records
        WHERE tdr_sync_status = 'pending'
        ORDER BY tdr_sync_requested_at DESC
      `);
      return result.rows;
    } catch (error) {
      console.error('[DB] Error getting pending sync requests:', error);
      throw error;
    }
  },

  // Get all donor records from main table
  async getAllDonorRecordsMain() {
    try {
      const result = await pool.query(`
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
          COALESCE(dr_times_donated, 1) as times_donated,
          COALESCE(dr_donation_dates, '[]'::jsonb) as donation_dates,
          dr_last_donation_date as last_donation_date,
          dr_source_organization as source_organization,
          dr_created_at as created_at,
          dr_modified_at as updated_at
        FROM donor_records
        ORDER BY dr_created_at DESC
      `);

      return result.rows.map(row => ({
        ...row,
        donation_dates: typeof row.donation_dates === 'string' ? JSON.parse(row.donation_dates) : row.donation_dates
      }));
    } catch (error) {
      console.error('[DB] Error getting all donor records:', error);
      throw error;
    }
  },

  // Approve sync - Transfer from temp to main donor_records with duplicate handling
  async approveDonorSync(approvedBy) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get all pending records
      const pendingResult = await client.query(`
        SELECT * FROM temp_donor_records WHERE tdr_sync_status = 'pending'
      `);

      const pendingRecords = pendingResult.rows;
      const approvedRecords = [];
      const mergedRecords = [];

      for (const record of pendingRecords) {
        // Check for duplicate (same donor_id or same full name)
        const duplicateCheck = await client.query(`
          SELECT * FROM donor_records
          WHERE dr_donor_id = $1 OR (
            LOWER(TRIM(dr_first_name)) = LOWER(TRIM($2)) AND
            LOWER(TRIM(dr_last_name)) = LOWER(TRIM($3))
          )
        `, [record.tdr_donor_id, record.tdr_first_name, record.tdr_last_name]);

        if (duplicateCheck.rows.length > 0) {
          // Duplicate found - merge donation data
          const existingDonor = duplicateCheck.rows[0];
          const currentDates = typeof existingDonor.dr_donation_dates === 'string'
            ? JSON.parse(existingDonor.dr_donation_dates)
            : existingDonor.dr_donation_dates || [];

          // Add new donation date
          const newDonationDate = { date: new Date().toISOString() };
          const updatedDates = [...currentDates, newDonationDate];

          await client.query(`
            UPDATE donor_records
            SET
              dr_times_donated = COALESCE(dr_times_donated, 1) + 1,
              dr_donation_dates = $1::jsonb,
              dr_last_donation_date = $2,
              dr_modified_at = CURRENT_TIMESTAMP
            WHERE dr_id = $3
          `, [JSON.stringify(updatedDates), new Date(), existingDonor.dr_id]);

          mergedRecords.push({
            ...existingDonor,
            dr_times_donated: (existingDonor.dr_times_donated || 1) + 1
          });
        } else {
          // No duplicate - insert new record
          const insertResult = await client.query(`
            INSERT INTO donor_records (
              dr_donor_id, dr_first_name, dr_middle_name, dr_last_name, dr_gender, dr_birthdate, dr_age,
              dr_blood_type, dr_rh_factor, dr_contact_number, dr_address, dr_times_donated,
              dr_donation_dates, dr_last_donation_date, dr_source_organization, dr_created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 1, $12::jsonb, $13, $14, CURRENT_TIMESTAMP)
            RETURNING *
          `, [
            record.tdr_donor_id, record.tdr_first_name, record.tdr_middle_name, record.tdr_last_name,
            record.tdr_gender, record.tdr_birthdate, record.tdr_age, record.tdr_blood_type, record.tdr_rh_factor,
            record.tdr_contact_number, record.tdr_address,
            JSON.stringify([{ date: new Date().toISOString() }]),
            new Date(), record.tdr_source_organization
          ]);

          approvedRecords.push(insertResult.rows[0]);
        }

        // Update temp record status
        await client.query(`
          UPDATE temp_donor_records
          SET tdr_sync_status = 'approved', tdr_sync_approved_at = CURRENT_TIMESTAMP, tdr_sync_approved_by = $1
          WHERE tdr_id = $2
        `, [approvedBy, record.tdr_id]);
      }

      await client.query('COMMIT');
      console.log(`[DB] Sync approved: ${approvedRecords.length} new, ${mergedRecords.length} merged`);

      return {
        newRecords: approvedRecords,
        mergedRecords: mergedRecords,
        totalProcessed: approvedRecords.length + mergedRecords.length
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[DB] Error approving donor sync:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Delete temp donor records after approval
  async clearApprovedTempRecords() {
    try {
      const result = await pool.query(`
        DELETE FROM temp_donor_records WHERE tdr_sync_status = 'approved'
      `);
      return result.rowCount;
    } catch (error) {
      console.error('[DB] Error clearing approved temp records:', error);
      throw error;
    }
  },

  // ===== NOTIFICATION METHODS =====

  // Create notification
  async createNotification(notificationData) {
    try {
      const {
        userId, userName, notificationType, title, description,
        relatedEntityType, relatedEntityId, linkTo, priority
      } = notificationData;

      const result = await pool.query(`
        INSERT INTO notifications (
          user_id, user_name, notification_type, title, description,
          related_entity_type, related_entity_id, link_to, priority
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        userId, userName, notificationType, title, description,
        relatedEntityType, relatedEntityId, linkTo, priority || 'normal'
      ]);

      console.log('[DB] Notification created:', result.rows[0].id);
      return result.rows[0];
    } catch (error) {
      console.error('[DB] Error creating notification:', error);
      throw error;
    }
  },

  // Get all notifications
  async getAllNotifications(userId = null) {
    try {
      let query = `
        SELECT * FROM notifications
        WHERE 1=1
      `;
      const params = [];

      if (userId) {
        query += ` AND (user_id = $1 OR user_id IS NULL)`;
        params.push(userId);
      }

      query += ` ORDER BY created_at DESC`;

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('[DB] Error getting notifications:', error);
      throw error;
    }
  },

  // Get unread notification count
  async getUnreadNotificationCount(userId = null) {
    try {
      let query = `SELECT COUNT(*) FROM notifications WHERE is_read = FALSE`;
      const params = [];

      if (userId) {
        query += ` AND (user_id = $1 OR user_id IS NULL)`;
        params.push(userId);
      }

      const result = await pool.query(query, params);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      console.error('[DB] Error getting unread notification count:', error);
      throw error;
    }
  },

  // Mark notification as read
  async markNotificationAsRead(notificationId) {
    try {
      const result = await pool.query(`
        UPDATE notifications
        SET is_read = TRUE, status = 'read', read_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `, [notificationId]);

      return result.rows[0];
    } catch (error) {
      console.error('[DB] Error marking notification as read:', error);
      throw error;
    }
  },

  // Mark all notifications as read
  async markAllNotificationsAsRead(userId = null) {
    try {
      let query = `
        UPDATE notifications
        SET is_read = TRUE, status = 'read', read_at = CURRENT_TIMESTAMP
        WHERE is_read = FALSE
      `;
      const params = [];

      if (userId) {
        query += ` AND (user_id = $1 OR user_id IS NULL)`;
        params.push(userId);
      }

      const result = await pool.query(query, params);
      return result.rowCount;
    } catch (error) {
      console.error('[DB] Error marking all notifications as read:', error);
      throw error;
    }
  },

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      const result = await pool.query(`
        DELETE FROM notifications WHERE id = $1
      `, [notificationId]);

      return result.rowCount > 0;
    } catch (error) {
      console.error('[DB] Error deleting notification:', error);
      throw error;
    }
  },

  // ========== PARTNERSHIP REQUEST METHODS ==========

  // Create partnership request
  async createPartnershipRequest(requestData) {
    try {
      const insertQuery = `
        INSERT INTO partnership_requests (
          appointment_id, organization_name, organization_barangay,
          contact_name, contact_email, contact_phone,
          event_date, event_time, event_address
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const values = [
        requestData.appointmentId,
        requestData.organizationName,
        requestData.organizationBarangay,
        requestData.contactName,
        requestData.contactEmail,
        requestData.contactPhone,
        requestData.eventDate,
        requestData.eventTime,
        requestData.eventAddress || null
      ];

      const result = await pool.query(insertQuery, values);
      console.log('[DB] Partnership request created:', result.rows[0].id);
      return result.rows[0];
    } catch (error) {
      console.error('[DB] Error creating partnership request:', error);
      throw error;
    }
  },

  // Get all partnership requests
  async getAllPartnershipRequests(status = null) {
    try {
      let query = `
        SELECT * FROM partnership_requests
      `;

      const params = [];
      if (status) {
        query += ` WHERE status = $1`;
        params.push(status);
      }

      query += ` ORDER BY created_at DESC`;

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('[DB] Error getting partnership requests:', error);
      throw error;
    }
  },

  // Get partnership request by ID
  async getPartnershipRequestById(requestId) {
    try {
      const result = await pool.query(`
        SELECT * FROM partnership_requests WHERE id = $1
      `, [requestId]);

      return result.rows[0];
    } catch (error) {
      console.error('[DB] Error getting partnership request:', error);
      throw error;
    }
  },

  // Update partnership request status
  async updatePartnershipRequestStatus(requestId, status, approvedBy = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const updateQuery = `
        UPDATE partnership_requests
        SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;

      const result = await client.query(updateQuery, [status, approvedBy, requestId]);
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[DB] Error updating partnership request status:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Get pending partnership requests count
  async getPendingPartnershipRequestsCount() {
    try {
      const result = await pool.query(`
        SELECT COUNT(*) as count FROM partnership_requests WHERE status = 'pending'
      `);

      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      console.error('[DB] Error getting pending partnership requests count:', error);
      throw error;
    }
  },

  // Delete partnership request
  async deletePartnershipRequest(requestId) {
    try {
      const result = await pool.query(`
        DELETE FROM partnership_requests WHERE id = $1 RETURNING *
      `, [requestId]);

      if (result.rows.length === 0) {
        throw new Error('Partnership request not found');
      }

      console.log('[DB] Partnership request deleted:', requestId);
      return result.rows[0];
    } catch (error) {
      console.error('[DB] Error deleting partnership request:', error);
      throw error;
    }
  },

  // ========== BLOOD DONATION ANALYTICS METHODS ==========

  // Get blood donation analytics for dashboard (last 4 months)
  async getBloodDonationAnalytics() {
    try {
      // Get current date info
      const currentDate = new Date();
      const months = [];

      // Generate 4 months: previous previous month, previous month, current month, next month
      for (let i = -2; i <= 1; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
        const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        months.push({
          monthKey,
          monthName,
          date
        });
      }

      // Get donation counts for each month
      const stats = [];

      for (const month of months) {
        const startDate = new Date(month.date.getFullYear(), month.date.getMonth(), 1);
        const endDate = new Date(month.date.getFullYear(), month.date.getMonth() + 1, 0);

        const query = `
          SELECT
            COUNT(*) as total_donations,
            COUNT(DISTINCT bs_blood_type || bs_rh_factor) as unique_blood_types,
            SUM(bs_volume) as total_volume,
            COUNT(CASE WHEN bs_category = 'Red Blood Cell' THEN 1 END) as rbc_count,
            COUNT(CASE WHEN bs_category = 'Plasma' THEN 1 END) as plasma_count,
            COUNT(CASE WHEN bs_category = 'Platelet' THEN 1 END) as platelet_count
          FROM blood_stock
          WHERE DATE(bs_created_at) >= $1
            AND DATE(bs_created_at) <= $2
        `;

        const result = await pool.query(query, [
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        ]);

        const data = result.rows[0];

        stats.push({
          month: month.monthKey,
          monthName: month.monthName,
          totalDonations: parseInt(data.total_donations) || 0,
          uniqueBloodTypes: parseInt(data.unique_blood_types) || 0,
          totalVolume: parseInt(data.total_volume) || 0,
          rbcCount: parseInt(data.rbc_count) || 0,
          plasmaCount: parseInt(data.plasma_count) || 0,
          plateletCount: parseInt(data.platelet_count) || 0
        });
      }

      return stats;
    } catch (error) {
      console.error('[DB] Error getting blood donation analytics:', error);
      throw error;
    }
  },

  // ========== BLOOD EXPIRATION CHECKING METHODS ==========

  // Get expiring blood stocks (within specified days)
  async getExpiringBloodStocks(daysThreshold = 7) {
    try {
      const query = `
        SELECT
          bs_serial_id as serial_id,
          bs_blood_type as blood_type,
          bs_rh_factor as rh_factor,
          bs_category as component,
          bs_volume as units,
          TO_CHAR(bs_expiration_date, 'YYYY-MM-DD') as expiration_date,
          bs_expiration_date - CURRENT_DATE as days_until_expiry,
          bs_status as status,
          CASE
            WHEN bs_expiration_date - CURRENT_DATE <= 3 THEN 'Urgent'
            WHEN bs_expiration_date - CURRENT_DATE <= 7 THEN 'Alert'
            ELSE 'Normal'
          END as alert_status
        FROM blood_stock
        WHERE bs_status = 'Stored'
          AND bs_expiration_date - CURRENT_DATE <= $1
          AND bs_expiration_date - CURRENT_DATE >= 0
        ORDER BY bs_expiration_date ASC, bs_blood_type ASC
      `;

      const result = await pool.query(query, [daysThreshold]);
      return result.rows;
    } catch (error) {
      console.error('[DB] Error getting expiring blood stocks:', error);
      throw error;
    }
  },

  // Get expiring non-conforming stocks
  async getExpiringNonConformingStocks(daysThreshold = 7) {
    try {
      const query = `
        SELECT
          nc_serial_id as serial_id,
          nc_blood_type as blood_type,
          nc_rh_factor as rh_factor,
          nc_category as component,
          nc_volume as units,
          TO_CHAR(nc_expiration_date, 'YYYY-MM-DD') as expiration_date,
          EXTRACT(DAY FROM (nc_expiration_date - CURRENT_DATE))::integer as days_until_expiry,
          nc_status as status,
          CASE
            WHEN EXTRACT(DAY FROM (nc_expiration_date - CURRENT_DATE)) <= 3 THEN 'Urgent'
            WHEN EXTRACT(DAY FROM (nc_expiration_date - CURRENT_DATE)) <= 7 THEN 'Alert'
            ELSE 'Normal'
          END as alert_status
        FROM non_conforming
        WHERE nc_status = 'Non-Conforming'
          AND EXTRACT(DAY FROM (nc_expiration_date - CURRENT_DATE)) <= $1
          AND EXTRACT(DAY FROM (nc_expiration_date - CURRENT_DATE)) >= 0
        ORDER BY nc_expiration_date ASC, nc_blood_type ASC
      `;

      const result = await pool.query(query, [daysThreshold]);
      return result.rows;
    } catch (error) {
      console.error('[DB] Error getting expiring non-conforming stocks:', error);
      throw error;
    }
  },

  // Get all expiring stocks (combined)
  async getAllExpiringStocks(daysThreshold = 7) {
    try {
      const bloodStocks = await this.getExpiringBloodStocks(daysThreshold);
      const nonConformingStocks = await this.getExpiringNonConformingStocks(daysThreshold);

      return {
        bloodStocks,
        nonConformingStocks,
        total: bloodStocks.length + nonConformingStocks.length
      };
    } catch (error) {
      console.error('[DB] Error getting all expiring stocks:', error);
      throw error;
    }
  },

  // Check and create expiration notifications
    async checkAndCreateExpirationNotifications() {
      try {
        const expiringStocks = await this.getAllExpiringStocks(7);
        const notificationsCreated = [];

        // Helper function to create notification
        const createWarningNotification = async (stock, entityType) => {
          const isUrgent = stock.days_until_expiry <= 2;
          const notificationType = isUrgent ? 'stock_expiring_urgent' : 'stock_expiring_soon';

          // Check if ANY expiration notification for this stock was created today
          const existingNotif = await pool.query(`
            SELECT id FROM notifications
            WHERE (notification_type = 'stock_expiring_urgent' OR notification_type = 'stock_expiring_soon')
              AND related_entity_id = $1
              AND related_entity_type = $2
              AND DATE(created_at) = CURRENT_DATE
          `, [stock.serial_id, entityType]);

          if (existingNotif.rows.length === 0) {

            const daysText = stock.days_until_expiry === 1 ? '1 day' : `${stock.days_until_expiry} days`;

            const title = isUrgent
              ? `URGENT: This stock is about to expire in ${daysText}!`
              : `Attention: This stock is about to expire in ${daysText}!`;

            const description = `${stock.blood_type}${stock.rh_factor} ${stock.component} (Serial: ${stock.serial_id}) will expire on ${stock.expiration_date}. Only ${daysText} remaining. Please use or properly dispose to prevent wastage.`;
            // Prepare stock data for the notification
            const stockData = JSON.stringify({
              category: entityType === 'blood_stock' ? 'Blood Stock' : 'Non-Conforming',
              stockType: stock.component,
              serialId: stock.serial_id,
              bloodType: stock.blood_type,
              rhFactor: stock.rh_factor,
              volumeMl: stock.volume_ml,
              dateOfCollection: stock.collection_date,
              expirationDate: stock.expiration_date,
              status: stock.status,
              createdAt: stock.created_at,
              modifiedAt: stock.updated_at
            });

            const notifQuery = `
              INSERT INTO notifications (
                notification_type, title, description,
                related_entity_type, related_entity_id,
                status, priority, is_read, link_to
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              RETURNING id
            `;

            const result = await pool.query(notifQuery, [
              notificationType,
              title,
              description,
              entityType,
              stock.serial_id,
              'unread',
              isUrgent ? 'urgent' : 'high',
              false,
              stockData
            ]);

            notificationsCreated.push({
              id: result.rows[0].id,
              type: entityType,
              serial_id: stock.serial_id,
              alert_status: isUrgent ? 'Urgent' : 'Warning'
            });
          }
        };

        // Create notifications for expiring blood stocks
        for (const stock of expiringStocks.bloodStocks) {
          await createWarningNotification(stock, 'blood_stock');
        }

        // Create notifications for expiring non-conforming stocks
        for (const stock of expiringStocks.nonConformingStocks) {
          await createWarningNotification(stock, 'non_conforming');
        }

        console.log(`[DB] Created ${notificationsCreated.length} expiration notifications`);
        return {
          notificationsCreated: notificationsCreated.length,
          notifications: notificationsCreated
        };
      } catch (error) {
        console.error('[DB] Error checking and creating expiration notifications:', error);
        throw error;
      }
    },

  // ========== BLOOD OPERATION NOTIFICATION METHODS ==========

  // Create Blood Release Confirmation Notification
  async createBloodReleaseNotification(stockCount, component) {
    try {
      const title = `Blood Release Confirmation`;
      const description = `${stockCount} units of ${component} were successfully released.`;

      const notifQuery = `
        INSERT INTO notifications (
          notification_type, title, description,
          related_entity_type,
          status, priority, is_read
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `;

      const result = await pool.query(notifQuery, [
        'blood_release',
        title,
        description,
        'blood_stock',
        'unread',
        'normal',
        false
      ]);

      console.log(`[DB] Created blood release notification for ${stockCount} units of ${component}`);
      return result.rows[0].id;
    } catch (error) {
      console.error('[DB] Error creating blood release notification:', error);
      throw error;
    }
  },

  // Create Blood Adding Confirmation Notification (Blood Stock)
  async createBloodAddingNotification(stockCount, component) {
    try {
      const title = `Blood Adding Confirmation`;
      const description = `${stockCount} units of ${component} were successfully added.`;

      const notifQuery = `
        INSERT INTO notifications (
          notification_type, title, description,
          related_entity_type,
          status, priority, is_read
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `;

      const result = await pool.query(notifQuery, [
        'blood_adding',
        title,
        description,
        'blood_stock',
        'unread',
        'normal',
        false
      ]);

      console.log(`[DB] Created blood adding notification for ${stockCount} units of ${component}`);
      return result.rows[0].id;
    } catch (error) {
      console.error('[DB] Error creating blood adding notification:', error);
      throw error;
    }
  },

  // Create Blood Restoring Confirmation Notification
  async createBloodRestoringNotification(stockCount, component) {
    try {
      const title = `Blood Restoring Confirmation`;
      const description = `${stockCount} units of ${component} were successfully restored.`;

      const notifQuery = `
        INSERT INTO notifications (
          notification_type, title, description,
          related_entity_type,
          status, priority, is_read
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `;

      const result = await pool.query(notifQuery, [
        'blood_restoring',
        title,
        description,
        'released_blood',
        'unread',
        'normal',
        false
      ]);

      console.log(`[DB] Created blood restoring notification for ${stockCount} units of ${component}`);
      return result.rows[0].id;
    } catch (error) {
      console.error('[DB] Error creating blood restoring notification:', error);
      throw error;
    }
  },

  // Create Blood Discarding Confirmation Notification
  async createBloodDiscardingNotification(stockCount, component) {
    try {
      const title = `Blood Discarding Confirmation`;
      const description = `${stockCount} units of ${component} were successfully discarded.`;

      const notifQuery = `
        INSERT INTO notifications (
          notification_type, title, description,
          related_entity_type,
          status, priority, is_read
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `;

      const result = await pool.query(notifQuery, [
        'blood_discarding',
        title,
        description,
        'non_conforming',
        'unread',
        'normal',
        false
      ]);

      console.log(`[DB] Created blood discarding notification for ${stockCount} units of ${component}`);
      return result.rows[0].id;
    } catch (error) {
      console.error('[DB] Error creating blood discarding notification:', error);
      throw error;
    }
  },

  // Create Non-Conforming Adding Confirmation Notification
  async createNonConformingAddingNotification(stockCount, component) {
    try {
      const title = `Blood Adding Confirmation`;
      const description = `${stockCount} units of ${component} were successfully added.`;

      const notifQuery = `
        INSERT INTO notifications (
          notification_type, title, description,
          related_entity_type,
          status, priority, is_read
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `;

      const result = await pool.query(notifQuery, [
        'nonconforming_adding',
        title,
        description,
        'non_conforming',
        'unread',
        'normal',
        false
      ]);

      console.log(`[DB] Created non-conforming adding notification for ${stockCount} units of ${component}`);
      return result.rows[0].id;
    } catch (error) {
      console.error('[DB] Error creating non-conforming adding notification:', error);
      throw error;
    }
  },

  // Create Weekly Stock Update Notifications
  async createWeeklyStockUpdateNotifications() {
    try {
      const notificationsCreated = [];
      const updateDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const updateTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

      // Get stock counts by component type
      const stockTypes = ['Red Blood Cell', 'Plasma', 'Platelet'];

      for (const component of stockTypes) {
        // Blood Stock Update
        const bloodStockResult = await pool.query(`
          SELECT COUNT(*) as count FROM blood_stock
          WHERE component = $1 AND status = 'Stored'
        `, [component]);
        const bloodStockCount = parseInt(bloodStockResult.rows[0].count);

        const bloodStockNotif = await pool.query(`
          INSERT INTO notifications (
            notification_type, title, description,
            related_entity_type, status, priority, is_read
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `, [
          'blood_stock_update',
          'Blood Stock Update',
          `Current stored ${component}: ${bloodStockCount} units. Updated on ${updateDate}, at ${updateTime}.`,
          'blood_stock',
          'unread',
          'low',
          false
        ]);
        notificationsCreated.push({ id: bloodStockNotif.rows[0].id, type: 'blood_stock_update', component });

        // Non-Conforming Update
        const nonConformingResult = await pool.query(`
          SELECT COUNT(*) as count FROM non_conforming
          WHERE component = $1
        `, [component]);
        const nonConformingCount = parseInt(nonConformingResult.rows[0].count);

        const nonConformingNotif = await pool.query(`
          INSERT INTO notifications (
            notification_type, title, description,
            related_entity_type, status, priority, is_read
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `, [
          'nonconforming_update',
          'Non-Conforming Update',
          `Current non-conforming ${component}: ${nonConformingCount} units. Updated on ${updateDate}, at ${updateTime}.`,
          'non_conforming',
          'unread',
          'low',
          false
        ]);
        notificationsCreated.push({ id: nonConformingNotif.rows[0].id, type: 'nonconforming_update', component });

        // Released Blood Update
        const releasedResult = await pool.query(`
          SELECT COUNT(*) as count FROM released_blood
          WHERE component = $1
        `, [component]);
        const releasedCount = parseInt(releasedResult.rows[0].count);

        const releasedNotif = await pool.query(`
          INSERT INTO notifications (
            notification_type, title, description,
            related_entity_type, status, priority, is_read
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `, [
          'released_update',
          'Released Update',
          `Current released ${component}: ${releasedCount} units. Updated on ${updateDate}, at ${updateTime}.`,
          'released_blood',
          'unread',
          'low',
          false
        ]);
        notificationsCreated.push({ id: releasedNotif.rows[0].id, type: 'released_update', component });
      }

      console.log(`[DB] Created ${notificationsCreated.length} weekly stock update notifications`);
      return {
        notificationsCreated: notificationsCreated.length,
        notifications: notificationsCreated
      };
    } catch (error) {
      console.error('[DB] Error creating weekly stock update notifications:', error);
      throw error;
    }
  },

  // ========== USER MANAGEMENT METHODS ==========

  // Get all active users (for Access Control tab)
  async getAllActiveUsers() {
    try {
      const query = `
        SELECT
          user_id,
          full_name,
          email,
          role,
          is_active,
          created_at
        FROM user_doh
        WHERE is_active = true
        ORDER BY created_at DESC
      `;

      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('[DB] Error getting all active users:', error);
      throw error;
    }
  },

  // Get all pending users (for User Approval tab)
  async getPendingUsers() {
    try {
      const query = `
        SELECT
          user_id,
          full_name,
          email,
          role,
          is_active,
          created_at
        FROM user_doh
        WHERE is_active = false
        ORDER BY created_at DESC
      `;

      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('[DB] Error getting pending users:', error);
      throw error;
    }
  },

  // Approve user account
  async approveUser(userId) {
    try {
      const query = `
        UPDATE user_doh
        SET is_active = true
        WHERE user_id = $1
        RETURNING user_id, full_name, email, role
      `;

      const result = await pool.query(query, [userId]);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return result.rows[0];
    } catch (error) {
      console.error('[DB] Error approving user:', error);
      throw error;
    }
  },

  // Reject/Delete user account
  async rejectUser(userId) {
    try {
      const query = `
        DELETE FROM user_doh
        WHERE user_id = $1
        RETURNING user_id, full_name, email
      `;

      const result = await pool.query(query, [userId]);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return result.rows[0];
    } catch (error) {
      console.error('[DB] Error rejecting user:', error);
      throw error;
    }
  },

  // Update user role (for Access Control)
  async updateUserRole(userId, newRole) {
    try {
      const validRoles = ['Admin', 'Doctor', 'Medical Technologist', 'Scheduler'];

      if (!validRoles.includes(newRole)) {
        throw new Error('Invalid role specified');
      }

      const query = `
        UPDATE user_doh
        SET role = $1
        WHERE user_id = $2
        RETURNING user_id, full_name, email, role
      `;

      const result = await pool.query(query, [newRole, userId]);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return result.rows[0];
    } catch (error) {
      console.error('[DB] Error updating user role:', error);
      throw error;
    }
  },

  // Delete user account (for Access Control)
  async deleteUser(userId) {
    try {
      const query = `
        DELETE FROM user_doh
        WHERE user_id = $1
        RETURNING user_id, full_name, email
      `;

      const result = await pool.query(query, [userId]);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return result.rows[0];
    } catch (error) {
      console.error('[DB] Error deleting user:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // ========== BLOOD REPORTS METHODS ==========
  // Get all blood reports
async getAllBloodReports() {
  try {
    const query = `
      SELECT 
        br_id as id,
        br_report_id as "docId",
        br_quarter as quarter,
        br_year as year,
        br_month_start as "monthStart",
        br_month_end as "monthEnd",
        br_month_labels as "monthLabels",
        br_o_positive as "oPositive",
        br_o_negative as "oNegative",
        br_a_positive as "aPositive",
        br_a_negative as "aNegative",
        br_b_positive as "bPositive",
        br_b_negative as "bNegative",
        br_ab_positive as "abPositive",
        br_ab_negative as "abNegative",
        br_others as others,
        br_o_positive_pct as "oPositivePct",
        br_o_negative_pct as "oNegativePct",
        br_a_positive_pct as "aPositivePct",
        br_a_negative_pct as "aNegativePct",
        br_b_positive_pct as "bPositivePct",
        br_b_negative_pct as "bNegativePct",
        br_ab_positive_pct as "abPositivePct",
        br_ab_negative_pct as "abNegativePct",
        br_others_pct as "othersPct",
        br_total_count as total,
        br_month1_data as "month1Data",
        br_month2_data as "month2Data",
        br_month3_data as "month3Data",
        br_created_by as "createdBy",
        TO_CHAR(br_created_at, 'MM/DD/YYYY') as "dateCreated"
      FROM blood_reports
      ORDER BY br_year DESC, br_month_start DESC
    `;
    
    const result = await pool.query(query);
    return result.rows.map(row => ({
      ...row,
      selected: false
    }));
  } catch (error) {
    console.error('Error fetching blood reports:', error);
    throw error;
  }
},

// Check if quarter has ended
async canGenerateQuarterReport(quarter, year) {
  try {
    const query = `
      SELECT 
        CASE 
          WHEN $2 < EXTRACT(YEAR FROM CURRENT_DATE) THEN TRUE
          WHEN $2 = EXTRACT(YEAR FROM CURRENT_DATE) THEN
            CASE $1
              WHEN '1st Quarter' THEN EXTRACT(MONTH FROM CURRENT_DATE) > 3
              WHEN '2nd Quarter' THEN EXTRACT(MONTH FROM CURRENT_DATE) > 6
              WHEN '3rd Quarter' THEN EXTRACT(MONTH FROM CURRENT_DATE) > 9
              WHEN '4th Quarter' THEN EXTRACT(MONTH FROM CURRENT_DATE) > 12
              ELSE FALSE
            END
          ELSE FALSE
        END as can_generate
    `;
    
    const result = await pool.query(query, [quarter, year]);
    return result.rows[0].can_generate;
  } catch (error) {
    console.error('Error checking quarter status:', error);
    throw error;
  }
},

  // Generate quarterly report
async generateQuarterlyReport(quarter, year) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Determine quarter months
    let monthStart, monthEnd, monthLabels;
    switch(quarter) {
      case '1st Quarter':
        monthStart = 1;
        monthEnd = 3;
        monthLabels = ['Jan', 'Feb', 'Mar'];
        break;
      case '2nd Quarter':
        monthStart = 4;
        monthEnd = 6;
        monthLabels = ['Apr', 'May', 'Jun'];
        break;
      case '3rd Quarter':
        monthStart = 7;
        monthEnd = 9;
        monthLabels = ['Jul', 'Aug', 'Sep'];
        break;
      case '4th Quarter':
        monthStart = 10;
        monthEnd = 12;
        monthLabels = ['Oct', 'Nov', 'Dec'];
        break;
      default:
        throw new Error('Invalid quarter');
    }
    
    // CRITICAL FIX: Ensure year is an integer
    const yearInt = parseInt(year);
    
    // Check if quarter has ended
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    
    if (yearInt > currentYear) {
      throw new Error(`Cannot generate report for future year ${yearInt}`);
    }
    
    if (yearInt === currentYear && currentMonth <= monthEnd) {
      throw new Error(`Quarter ${quarter} of ${yearInt} has not ended yet`);
    }
    
    // Generate report ID
    const reportIdQuery = `
      SELECT COALESCE(
        'DOC-' || $1::text || '-' || 
        LPAD((
          SELECT COUNT(*) + 1 
          FROM blood_reports 
          WHERE br_year = $1::integer
        )::text, 3, '0'),
        'DOC-' || $1::text || '-001'
      ) as report_id
    `;
    const reportIdResult = await client.query(reportIdQuery, [yearInt]);
    const reportId = reportIdResult.rows[0].report_id;
    
    // CRITICAL FIX: Updated query with proper type casting
    const statsQuery = `
    WITH quarter_data AS (
      SELECT 
        bsh_blood_type,
        bsh_rh_factor,
        EXTRACT(MONTH FROM bsh_timestamp)::integer as month_num,
        COUNT(*)::integer as count
      FROM blood_stock_history
      WHERE 
        EXTRACT(YEAR FROM bsh_timestamp)::integer = $1::integer
        AND EXTRACT(MONTH FROM bsh_timestamp)::integer BETWEEN $2::integer AND $3::integer
        AND bsh_action = 'ADDED'
        AND bsh_category = 'Red Blood Cell'
      GROUP BY bsh_blood_type, bsh_rh_factor, EXTRACT(MONTH FROM bsh_timestamp)
    )
    SELECT 
      bsh_blood_type || bsh_rh_factor as blood_type,
      month_num,
      SUM(count)::integer as total
    FROM quarter_data
    GROUP BY bsh_blood_type, bsh_rh_factor, month_num
    `;
    
    // CRITICAL FIX: Pass integers, not strings
    const statsResult = await client.query(statsQuery, [yearInt, monthStart, monthEnd]);
    
    // Initialize counters
    const bloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
    const monthlyCounts = {
      [monthStart]: {},
      [monthStart + 1]: {},
      [monthStart + 2]: {}
    };
    const quarterTotals = {};
    
    bloodTypes.forEach(type => {
      quarterTotals[type] = 0;
      monthlyCounts[monthStart][type] = 0;
      monthlyCounts[monthStart + 1][type] = 0;
      monthlyCounts[monthStart + 2][type] = 0;
    });
    
    // Process query results
    statsResult.rows.forEach(row => {
      const type = row.blood_type;
      const month = parseInt(row.month_num);
      const count = parseInt(row.total);
      
      if (monthlyCounts[month] && bloodTypes.includes(type)) {
        monthlyCounts[month][type] = count;
        quarterTotals[type] += count;
      }
    });
    
    // Calculate grand total
    const grandTotal = Object.values(quarterTotals).reduce((sum, val) => sum + val, 0);
    
    // Calculate percentages for quarter totals
    const percentages = {};
    bloodTypes.forEach(type => {
      percentages[type] = grandTotal > 0 
        ? ((quarterTotals[type] / grandTotal) * 100).toFixed(2)
        : '0.00';
    });
    
    // Calculate monthly percentages RELATIVE TO QUARTER TOTAL (not month total)
      const monthlyPercentages = {};
      Object.keys(monthlyCounts).forEach(month => {
        monthlyPercentages[month] = {};
        bloodTypes.forEach(type => {
          monthlyPercentages[month][type] = grandTotal > 0
            ? ((monthlyCounts[month][type] / grandTotal) * 100).toFixed(2)
            : '0.00';
        });
      });
    
    // Prepare monthly data as JSONB
    const month1Data = {
      counts: monthlyCounts[monthStart],
      percentages: monthlyPercentages[monthStart],
      total: Object.values(monthlyCounts[monthStart]).reduce((sum, val) => sum + val, 0)
    };
    
    const month2Data = {
      counts: monthlyCounts[monthStart + 1],
      percentages: monthlyPercentages[monthStart + 1],
      total: Object.values(monthlyCounts[monthStart + 1]).reduce((sum, val) => sum + val, 0)
    };
    
    const month3Data = {
      counts: monthlyCounts[monthStart + 2],
      percentages: monthlyPercentages[monthStart + 2],
      total: Object.values(monthlyCounts[monthStart + 2]).reduce((sum, val) => sum + val, 0)
    };
    
    // CRITICAL FIX: Pass array directly, use ::text[] cast in query
    const insertQuery = `
      INSERT INTO blood_reports (
        br_report_id, br_quarter, br_year, br_month_start, br_month_end, br_month_labels,
        br_o_positive, br_o_negative, br_a_positive, br_a_negative,
        br_b_positive, br_b_negative, br_ab_positive, br_ab_negative,
        br_o_positive_pct, br_o_negative_pct, br_a_positive_pct, br_a_negative_pct,
        br_b_positive_pct, br_b_negative_pct, br_ab_positive_pct, br_ab_negative_pct,
        br_total_count, br_month1_data, br_month2_data, br_month3_data,
        br_created_by, br_created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6::text[],
        $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21, $22,
        $23, $24::jsonb, $25::jsonb, $26::jsonb, $27, NOW()
      )
      ON CONFLICT (br_quarter, br_year)
      DO UPDATE SET
        br_report_id = $1,
        br_month_start = $4,
        br_month_end = $5,
        br_month_labels = $6::text[],
        br_o_positive = $7, 
        br_o_negative = $8, 
        br_a_positive = $9, 
        br_a_negative = $10,
        br_b_positive = $11, 
        br_b_negative = $12, 
        br_ab_positive = $13, 
        br_ab_negative = $14,
        br_o_positive_pct = $15, 
        br_o_negative_pct = $16, 
        br_a_positive_pct = $17, 
        br_a_negative_pct = $18,
        br_b_positive_pct = $19, 
        br_b_negative_pct = $20, 
        br_ab_positive_pct = $21, 
        br_ab_negative_pct = $22,
        br_total_count = $23, 
        br_month1_data = $24::jsonb, 
        br_month2_data = $25::jsonb, 
        br_month3_data = $26::jsonb,
        br_modified_at = NOW()
      RETURNING br_id
    `;
    
    // CRITICAL FIX: Pass monthLabels as array, not JSON string
    const values = [
      reportId, // $1
      quarter, // $2
      yearInt, // $3
      monthStart, // $4
      monthEnd, // $5
      monthLabels, // $6 - Pass array directly, NOT JSON.stringify()
      quarterTotals['O+'], // $7
      quarterTotals['O-'], // $8
      quarterTotals['A+'], // $9
      quarterTotals['A-'], // $10
      quarterTotals['B+'], // $11
      quarterTotals['B-'], // $12
      quarterTotals['AB+'], // $13
      quarterTotals['AB-'], // $14
      percentages['O+'], // $15
      percentages['O-'], // $16
      percentages['A+'], // $17
      percentages['A-'], // $18
      percentages['B+'], // $19
      percentages['B-'], // $20
      percentages['AB+'], // $21
      percentages['AB-'], // $22
      grandTotal, // $23
      JSON.stringify(month1Data), // $24 - Keep JSON.stringify for JSONB
      JSON.stringify(month2Data), // $25 - Keep JSON.stringify for JSONB
      JSON.stringify(month3Data), // $26 - Keep JSON.stringify for JSONB
      'Auto-generated' // $27
    ];
    
    await client.query(insertQuery, values);
    await client.query('COMMIT');
    
    return {
      success: true,
      reportId,
      quarter,
      year: yearInt,
      total: grandTotal
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error generating quarterly report:', error);
    throw error;
  } finally {
    client.release();
  }
},

// Get reports by year
async getReportsByYear(year) {
  try {
    const query = `
      SELECT 
        br_id as id,
        br_report_id as "docId",
        br_quarter as quarter,
        br_year as year,
        br_month_start as "monthStart",
        br_month_end as "monthEnd",
        br_month_labels as "monthLabels",
        br_o_positive as "oPositive",
        br_o_negative as "oNegative",
        br_a_positive as "aPositive",
        br_a_negative as "aNegative",
        br_b_positive as "bPositive",
        br_b_negative as "bNegative",
        br_ab_positive as "abPositive",
        br_ab_negative as "abNegative",
        br_others as others,
        br_o_positive_pct as "oPositivePct",
        br_o_negative_pct as "oNegativePct",
        br_a_positive_pct as "aPositivePct",
        br_a_negative_pct as "aNegativePct",
        br_b_positive_pct as "bPositivePct",
        br_b_negative_pct as "bNegativePct",
        br_ab_positive_pct as "abPositivePct",
        br_ab_negative_pct as "abNegativePct",
        br_others_pct as "othersPct",
        br_total_count as total,
        br_month1_data as "month1Data",
        br_month2_data as "month2Data",
        br_month3_data as "month3Data",
        br_created_by as "createdBy",
        TO_CHAR(br_created_at, 'MM/DD/YYYY') as "dateCreated"
      FROM blood_reports
      WHERE br_year = $1
      ORDER BY br_month_start
    `;
    
    const result = await pool.query(query, [year]);
    return result.rows.map(row => ({
      ...row,
      selected: false
    }));
  } catch (error) {
    console.error('Error fetching reports by year:', error);
    throw error;
  }
},

// Get report by ID (updated to include new fields)
async getReportById(reportId) {
  try {
    const query = `
      SELECT 
        br_id as id,
        br_report_id as "docId",
        br_quarter as quarter,
        br_year as year,
        br_month_start as "monthStart",
        br_month_end as "monthEnd",
        br_month_labels as "monthLabels",
        br_o_positive as "oPositive",
        br_o_negative as "oNegative",
        br_a_positive as "aPositive",
        br_a_negative as "aNegative",
        br_b_positive as "bPositive",
        br_b_negative as "bNegative",
        br_ab_positive as "abPositive",
        br_ab_negative as "abNegative",
        br_others as others,
        br_o_positive_pct as "oPositivePct",
        br_o_negative_pct as "oNegativePct",
        br_a_positive_pct as "aPositivePct",
        br_a_negative_pct as "aNegativePct",
        br_b_positive_pct as "bPositivePct",
        br_b_negative_pct as "bNegativePct",
        br_ab_positive_pct as "abPositivePct",
        br_ab_negative_pct as "abNegativePct",
        br_others_pct as "othersPct",
        br_total_count as total,
        br_month1_data as "month1Data",
        br_month2_data as "month2Data",
        br_month3_data as "month3Data",
        br_created_by as "createdBy",
        TO_CHAR(br_created_at, 'MM/DD/YYYY') as "dateCreated"
      FROM blood_reports
      WHERE br_id = $1
    `;
    
    const result = await pool.query(query, [reportId]);
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching report by ID:', error);
    throw error;
  }
},

// Delete reports
async deleteReports(reportIds) {
  try {
    const query = `DELETE FROM blood_reports WHERE br_id = ANY($1)`;
    await pool.query(query, [reportIds]);
    return { success: true };
  } catch (error) {
    console.error('Error deleting reports:', error);
    throw error;
  }
},

// Search reports
async searchReports(searchTerm) {
  try {
    const query = `
      SELECT 
        br_id as id,
        br_report_id as "docId",
        br_quarter as quarter,
        br_year as year,
        br_month_start as "monthStart",
        br_month_end as "monthEnd",
        br_month_labels as "monthLabels",
        br_o_positive as "oPositive",
        br_o_negative as "oNegative",
        br_a_positive as "aPositive",
        br_a_negative as "aNegative",
        br_b_positive as "bPositive",
        br_b_negative as "bNegative",
        br_ab_positive as "abPositive",
        br_ab_negative as "abNegative",
        br_others as others,
        br_o_positive_pct as "oPositivePct",
        br_o_negative_pct as "oNegativePct",
        br_a_positive_pct as "aPositivePct",
        br_a_negative_pct as "aNegativePct",
        br_b_positive_pct as "bPositivePct",
        br_b_negative_pct as "bNegativePct",
        br_ab_positive_pct as "abPositivePct",
        br_ab_negative_pct as "abNegativePct",
        br_others_pct as "othersPct",
        br_total_count as total,
        br_month1_data as "month1Data",
        br_month2_data as "month2Data",
        br_month3_data as "month3Data",
        br_created_by as "createdBy",
        TO_CHAR(br_created_at, 'MM/DD/YYYY') as "dateCreated"
      FROM blood_reports
      WHERE 
        br_report_id ILIKE $1 OR
        br_quarter ILIKE $1 OR
        CAST(br_year AS TEXT) ILIKE $1 OR
        br_created_by ILIKE $1
      ORDER BY br_year DESC, br_month_start DESC
    `;
    
    const result = await pool.query(query, [`%${searchTerm}%`]);
    return result.rows.map(row => ({
      ...row,
      selected: false
    }));
  } catch (error) {
    console.error('Error searching reports:', error);
    throw error;
  }
},

// Refresh/regenerate reports for current year
async refreshCurrentYearReports() {
  try {
    const currentYear = new Date().getFullYear();
    
    // Delete existing reports for current year
    await pool.query('DELETE FROM blood_reports WHERE br_year = $1', [currentYear]);
    
    // Generate all available quarters
    await this.generateAllQuarterlyReports(currentYear);
    
    return await this.getReportsByYear(currentYear);
  } catch (error) {
    console.error('Error refreshing current year reports:', error);
    throw error;
  }
},

// Add to history when adding new stock
async addToBloodStockHistory(stockData, action = 'ADDED', originalStockId = null) {
  try {
    const query = `
      INSERT INTO blood_stock_history (
        bsh_serial_id, bsh_blood_type, bsh_rh_factor, bsh_volume,
        bsh_timestamp, bsh_expiration_date, bsh_status, bsh_category,
        bsh_original_stock_id, bsh_action, bsh_action_timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING bsh_id
    `;
    
    const values = [
      stockData.serial_id,
      stockData.type,
      stockData.rhFactor,
      parseInt(stockData.volume),
      new Date(stockData.collection),
      new Date(stockData.expiration),
      stockData.status || 'Stored',
      stockData.category || 'Red Blood Cell',
      originalStockId,
      action
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error adding to blood stock history:', error);
    throw error;
  }
},



// Generate all available quarterly reports for a year
async generateAllQuarterlyReports(year) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  
  const quarters = [
    { name: '1st Quarter', endMonth: 3 },
    { name: '2nd Quarter', endMonth: 6 },
    { name: '3rd Quarter', endMonth: 9 },
    { name: '4th Quarter', endMonth: 12 }
  ];
  
  const generatedReports = [];
  
  for (const quarter of quarters) {
    try {
      // Check if quarter has ended
      if (year < currentYear || (year === currentYear && currentMonth > quarter.endMonth)) {
        const report = await this.generateQuarterlyReport(quarter.name, year);
        generatedReports.push(report);
      }
    } catch (error) {
      console.log(`Skipping ${quarter.name} ${year}: ${error.message}`);
    }
  }
  
  return generatedReports;
},

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
        activityData.user_name || activityData.userName || 'System User',
        activityData.action_type || activityData.actionType,
        activityData.entity_type || activityData.entityType,
        activityData.entity_id || activityData.entityId,
        activityData.action_description || activityData.actionDescription,
        JSON.stringify(activityData.details || {})
      ];

      const result = await pool.query(insertQuery, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw error to prevent activity logging from breaking main operations
    }
  },

  // ========== INVOICE METHODS (RELEASED) ==========

  async getAllReleasedBloodInvoices() {
    try {
      // Use DISTINCT ON to get only one row per reference number (for the main list)
      const query = `
        SELECT DISTINCT ON (rb_request_reference)
          rb_id as id,
          rb_request_reference as "invoiceId",
          rb_receiving_facility as "receivingFacility",
          rb_classification as classification,
          TO_CHAR(rb_date_of_release, 'MM/DD/YYYY') as "dateOfRelease",
          rb_released_by as "releasedBy",
          rb_request_reference as "referenceNumber"
        FROM released_blood
        WHERE rb_request_reference IS NOT NULL AND rb_request_reference != ''
        ORDER BY rb_request_reference DESC, rb_date_of_release DESC;
      `;
      const result = await pool.query(query);
      return result.rows.map(row => ({
        ...row,
        selected: false
      }));
    } catch (error) {
      console.error('Error getting all released blood invoices:', error);
      throw error;
    }
  },

  async viewReleasedBloodInvoice(invoiceId) {
    try {
      // The invoiceId passed is the rb_id of one of the items
      // First, get the reference number from that one item
      const refQuery = await pool.query(
        'SELECT rb_request_reference FROM released_blood WHERE rb_id = $1',
        [invoiceId]
      );
      if (refQuery.rows.length === 0) {
        throw new Error('Invoice not found');
      }
      const referenceNumber = refQuery.rows[0].rb_request_reference;

      // Get all items that share this reference number
      const itemsQuery = `
        SELECT
          rb_serial_id as "serialId",
          rb_blood_type as "bloodType",
          rb_rh_factor as "rhFactor",
          rb_volume as volume,
          TO_CHAR(rb_timestamp, 'MM/DD/YYYY') as "dateOfCollection",
          TO_CHAR(rb_expiration_date, 'MM/DD/YYYY') as "dateOfExpiration",
          rb_receiving_facility as "receivingFacility",
          TO_CHAR(rb_date_of_release, 'MM/DD/YYYY') as "dateOfRelease",
          rb_request_reference as "referenceNumber",
          rb_released_by as "preparedBy",
          rb_authorized_recipient as "authorizedRecipient"
        FROM released_blood
        WHERE rb_request_reference = $1;
      `;
      const itemsResult = await pool.query(itemsQuery, [referenceNumber]);
      
      if (itemsResult.rows.length === 0) {
        throw new Error('No items found for this invoice');
      }

      // Use the first item for header info (since it's duplicated on all rows)
      const header = {
        invoiceId: referenceNumber,
        referenceNumber: referenceNumber,
        receivingFacility: itemsResult.rows[0].receivingFacility,
        dateOfRelease: itemsResult.rows[0].dateOfRelease,
        preparedBy: itemsResult.rows[0].preparedBy, // or rb_released_by
        authorizedRecipient: itemsResult.rows[0].authorizedRecipient,
        // Add other header fields if needed
      };
      
      return { header, items: itemsResult.rows };
    } catch (error) {
      console.error('Error viewing released blood invoice:', error);
      throw error;
    }
  },

  async deleteReleasedBloodInvoices(ids) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Get the reference numbers for the given IDs
      const refQuery = await client.query(
        'SELECT DISTINCT rb_request_reference FROM released_blood WHERE rb_id = ANY($1)',
        [ids]
      );
      const referenceNumbers = refQuery.rows.map(r => r.rb_request_reference);

      if (referenceNumbers.length > 0) {
        // Delete all rows matching those reference numbers
        const deleteQuery = 'DELETE FROM released_blood WHERE rb_request_reference = ANY($1)';
        await client.query(deleteQuery, [referenceNumbers]);
      }

      await client.query('COMMIT');
      return { success: true, deletedCount: referenceNumbers.length };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error deleting released blood invoices:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // ========== INVOICE METHODS (DISCARDED) ==========

  async getAllDiscardedBloodInvoices() {
    try {
      // Use DISTINCT ON to get one row per reference number
      const query = `
        SELECT DISTINCT ON (db_reference_number)
          db_id as id,
          db_reference_number as "invoiceId",
          db_responsible_personnel as "responsiblePersonnel",
          db_reason_for_discarding as "reasonForDiscarding",
          TO_CHAR(db_date_of_discard, 'MM/DD/YYYY') as "dateOfDiscard",
          db_authorized_by as "authorizedBy",
          db_method_of_disposal as "methodOfDisposal",
          db_reference_number as "referenceNumber"
        FROM discarded_blood
        WHERE db_reference_number IS NOT NULL AND db_reference_number != ''
        ORDER BY db_reference_number DESC, db_date_of_discard DESC;
      `;
      const result = await pool.query(query);
      return result.rows.map(row => ({
        ...row,
        selected: false
      }));
    } catch (error) {
      console.error('Error getting all discarded blood invoices:', error);
      throw error;
    }
  },

  async viewDiscardedBloodInvoice(invoiceId) {
    try {
      // The invoiceId is the db_id
      const refQuery = await pool.query(
        'SELECT db_reference_number FROM discarded_blood WHERE db_id = $1',
        [invoiceId]
      );
      if (refQuery.rows.length === 0) {
        throw new Error('Invoice not found');
      }
      const referenceNumber = refQuery.rows[0].db_reference_number;

      // Get all items that share this reference number
      const itemsQuery = `
        SELECT
          db_serial_id as "serialId",
          db_blood_type as "bloodType",
          db_rh_factor as "rhFactor",
          db_volume as volume,
          TO_CHAR(db_timestamp, 'MM/DD/YYYY') as "dateOfCollection",
          TO_CHAR(db_expiration_date, 'MM/DD/YYYY') as "dateOfExpiration",
          db_responsible_personnel as "responsiblePersonnel",
          db_reason_for_discarding as "reasonForDiscarding",
          db_authorized_by as "authorizedBy",
          TO_CHAR(db_date_of_discard, 'YYYY-MM-DD') as "dateOfDiscard",
          db_method_of_disposal as "methodOfDisposal",
          db_reference_number as "referenceNumber"
        FROM discarded_blood
        WHERE db_reference_number = $1;
      `;
      const itemsResult = await pool.query(itemsQuery, [referenceNumber]);
      
      if (itemsResult.rows.length === 0) {
        throw new Error('No items found for this invoice');
      }

      // Use the first item for header info
      const header = {
        invoiceId: referenceNumber,
        referenceNumber: referenceNumber,
        responsiblePersonnel: itemsResult.rows[0].responsiblePersonnel,
        reasonForDiscarding: itemsResult.rows[0].reasonForDiscarding,
        authorizedBy: itemsResult.rows[0].authorizedBy,
        dateOfDiscard: itemsResult.rows[0].dateOfDiscard,
        methodOfDisposal: itemsResult.rows[0].methodOfDisposal,
      };
      
      return { header, items: itemsResult.rows };
    } catch (error) {
      console.error('Error viewing discarded blood invoice:', error);
      throw error;
    }
  },

  async deleteDiscardedBloodInvoices(ids) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Get the reference numbers for the given IDs
      const refQuery = await client.query(
        'SELECT DISTINCT db_reference_number FROM discarded_blood WHERE db_id = ANY($1)',
        [ids]
      );
      const referenceNumbers = refQuery.rows.map(r => r.db_reference_number);

      if (referenceNumbers.length > 0) {
        // Delete all rows matching those reference numbers
        const deleteQuery = 'DELETE FROM discarded_blood WHERE db_reference_number = ANY($1)';
        await client.query(deleteQuery, [referenceNumbers]);
      }

      await client.query('COMMIT');
      return { success: true, deletedCount: referenceNumbers.length };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error deleting discarded blood invoices:', error);
      throw error;
    }
  },
};



module.exports = dbService;