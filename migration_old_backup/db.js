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


// Test database connection
pool.on("connect", () => {
  console.log("Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("Database connection error:", err);
});

// NEW: Add a second pool to connect to the Organization database
const pool_org = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres_org', // <-- Connects to the 'postgres_org' DB
  password: 'bloodsync',
  port: 5432,
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

// Call test connection
testConnection();

// START : ALL METHODS MAADE BY CHRISTIAN PAASA ============================================================================================
// Ensure user_doh table exists on startup
const ensureUserTable = async () => {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS user_doh (
        user_id SERIAL PRIMARY KEY,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('Admin','Non-Conforming Staff','Inventory Staff','Scheduler')),
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        is_active BOOLEAN DEFAULT FALSE,
        activation_token UUID,
        created_at TIMESTAMP DEFAULT NOW(),
        
        -- ADD THIS COLUMN --
        phone_number VARCHAR(50)
      )
    `;
    await pool.query(query);

    // This will add the column if the table already exists
    try {
      await pool.query(`ALTER TABLE user_doh ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50)`);
    } catch (alterError) {
      console.error('Error adding phone_number column (might already exist):', alterError.message);
    }

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
        rb_released_by VARCHAR(255),
        rb_source VARCHAR(100),
        rb_invoice_id INTEGER -- <-- ADD THIS LINE
      )
    `);

    // ADD THIS BLOCK to update existing tables
    try {
      await pool.query(`
        ALTER TABLE released_blood
        ADD COLUMN IF NOT EXISTS rb_source VARCHAR(100)
      `);
      
      // ADD THIS LINE to update existing tables
      await pool.query(`
        ALTER TABLE released_blood
        ADD COLUMN IF NOT EXISTS rb_invoice_id INTEGER
      `);

    } catch (alterError) {
      console.error('Error adding columns (might already exist):', alterError.message);
    }
    // END OF ADDED BLOCK

    // Create indexes for better query performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_released_blood_serial_id ON released_blood(rb_serial_id);
      CREATE INDEX IF NOT EXISTS idx_released_blood_category ON released_blood(rb_category);
      CREATE INDEX IF NOT EXISTS idx_released_blood_status ON released_blood(rb_status);
      CREATE INDEX IF NOT EXISTS idx_released_blood_released_at ON released_blood(rb_released_at);
    `);

    console.log('Released blood table ensured successfully (with rb_source and rb_invoice_id)');
    return true;
  } catch (error) {
    console.error('Error ensuring released_blood table:', error);
    throw error;
  }
};

// Ensure blood_stock table exists
const ensureBloodStockTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blood_stock (
        bs_id SERIAL PRIMARY KEY,
        bs_serial_id VARCHAR(100) NOT NULL UNIQUE,
        bs_blood_type VARCHAR(5) NOT NULL,
        bs_rh_factor VARCHAR(10) NOT NULL,
        bs_volume INTEGER NOT NULL,
        bs_timestamp TIMESTAMP NOT NULL,
        bs_expiration_date TIMESTAMP NOT NULL,
        bs_status VARCHAR(50) DEFAULT 'Stored',
        bs_category VARCHAR(50) NOT NULL,
        bs_source VARCHAR(100) DEFAULT 'Walk-In',
        bs_created_at TIMESTAMP DEFAULT NOW(),
        bs_modified_at TIMESTAMP
      )
    `);

    // Create indexes for better query performance
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_blood_stock_serial_id ON blood_stock(bs_serial_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_blood_stock_status ON blood_stock(bs_status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_blood_stock_category ON blood_stock(bs_category)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_blood_stock_expiration ON blood_stock(bs_expiration_date)`);
    
    console.log('Blood stock table ensured successfully');
    return true;
  } catch (error) {
    console.error('Error ensuring blood_stock table:', error);
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

// Ensure non_conforming table exists
const ensureNonConformingTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS non_conforming (
        nc_id SERIAL PRIMARY KEY,
        nc_serial_id VARCHAR(100) NOT NULL UNIQUE,
        nc_blood_type VARCHAR(5) NOT NULL,
        nc_rh_factor VARCHAR(10) NOT NULL,
        nc_volume INTEGER NOT NULL,
        nc_timestamp TIMESTAMP NOT NULL,
        nc_expiration_date TIMESTAMP NOT NULL,
        nc_status VARCHAR(50) DEFAULT 'Non-Conforming',
        nc_category VARCHAR(50) NOT NULL,
        nc_source VARCHAR(100) DEFAULT 'Walk-In',
        nc_created_at TIMESTAMP DEFAULT NOW(),
        nc_modified_at TIMESTAMP
      )
    `);

    // Create indexes for better query performance
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_non_conforming_serial_id ON non_conforming(nc_serial_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_non_conforming_status ON non_conforming(nc_status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_non_conforming_category ON non_conforming(nc_category)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_non_conforming_expiration ON non_conforming(nc_expiration_date)`);
    
    console.log('✓ Non-conforming table ensured successfully');
    return true;
  } catch (error) {
    console.error('Error ensuring non_conforming table:', error);
    throw error;
  }
};

// Ensure discarded_blood table exists
const ensureDiscardedBloodTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS discarded_blood (
        db_id SERIAL PRIMARY KEY,
        db_serial_id VARCHAR(100) NOT NULL UNIQUE,
        db_blood_type VARCHAR(5) NOT NULL,
        db_rh_factor VARCHAR(10) NOT NULL,
        db_volume INTEGER NOT NULL,
        db_timestamp TIMESTAMP NOT NULL,
        db_expiration_date TIMESTAMP NOT NULL,
        db_status VARCHAR(50) DEFAULT 'Discarded',
        db_category VARCHAR(50) NOT NULL,
        db_source VARCHAR(100) DEFAULT 'Walk-In',
        db_created_at TIMESTAMP,
        db_discarded_at TIMESTAMP DEFAULT NOW(),
        db_original_id INTEGER,
        db_responsible_personnel VARCHAR(255),
        db_reason_for_discarding TEXT,
        db_authorized_by VARCHAR(255),
        db_date_of_discard TIMESTAMP,
        db_time_of_discard VARCHAR(50),
        db_method_of_disposal VARCHAR(255),
        db_remarks TEXT,
        db_invoice_id INTEGER
      )
    `);

    // Add columns if not exists (for existing dbs)
    await pool.query(`ALTER TABLE discarded_blood ADD COLUMN IF NOT EXISTS db_source VARCHAR(100) DEFAULT 'Walk-In'`);
    await pool.query(`ALTER TABLE discarded_blood ADD COLUMN IF NOT EXISTS db_invoice_id INTEGER`);

    // Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_discarded_blood_serial_id ON discarded_blood(db_serial_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_discarded_blood_category ON discarded_blood(db_category)`);
    
    console.log('✓ Discarded blood table ensured successfully');
    return true;
  } catch (error) {
    console.error('Error ensuring discarded_blood table:', error);
    throw error;
  }
};

// Ensure donor_records table exists (Main System - Regional Blood Center)
const ensureDonorRecordsTable = async () => {
  try {
    // 1. CREATE THE TABLE IF IT DOESN'T EXIST
    await pool.query(`
      CREATE TABLE IF NOT EXISTS donor_records (
        dr_id SERIAL PRIMARY KEY,
        dr_donor_id VARCHAR(50) NOT NULL UNIQUE,
        dr_first_name VARCHAR(100) NOT NULL,
        dr_middle_name VARCHAR(100),
        dr_last_name VARCHAR(100) NOT NULL,
        dr_gender VARCHAR(10),
        dr_birthdate DATE,
        dr_age INTEGER,
        dr_blood_type VARCHAR(5),
        dr_rh_factor VARCHAR(5),
        dr_contact_number VARCHAR(20),
        dr_address TEXT,
        dr_status VARCHAR(50) DEFAULT 'Non-Reactive',
        dr_created_at TIMESTAMP DEFAULT NOW(),
        dr_modified_at TIMESTAMP,
        dr_recent_donation TIMESTAMP,
        dr_donation_count INTEGER DEFAULT 0,

        -- Columns from the original ALTER statements are now included
        dr_times_donated INTEGER DEFAULT 1,
        dr_donation_dates JSONB DEFAULT '[]'::jsonb,
        dr_last_donation_date TIMESTAMP,
        dr_source_organization VARCHAR(255)
      )
    `);
    console.log('✓ Donor records table ensured (CREATE IF NOT EXISTS)');

    // 2. RUN ALTER TABLE COMMANDS (safe because they use IF NOT EXISTS)
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
    console.log('✓ Donor records columns ensured (ALTER IF NOT EXISTS)');

    // 3. CREATE INDEXES AND TRIGGERS
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_donor_records_times_donated ON donor_records(dr_times_donated)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_donor_records_last_donation_date ON donor_records(dr_last_donation_date)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_donor_records_donor_id ON donor_records(dr_donor_id)`);

    // Create update trigger for dr_modified_at
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

    console.log('Donor records table indexes and triggers ensured successfully');
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
        tdr_rejection_reason TEXT,
        tdr_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        tdr_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`ALTER TABLE temp_donor_records ADD COLUMN IF NOT EXISTS tdr_rejection_reason TEXT`);

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
        link_to TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        status VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
        priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent', 'critical')),
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

    // Migrate link_to from VARCHAR(255) to TEXT to accommodate large JSON data
    try {
      await pool.query(`
        ALTER TABLE notifications
        ALTER COLUMN link_to TYPE TEXT
      `);
      console.log('✓ link_to migrated to TEXT');
    } catch (alterError) {
      // Column might already be TEXT, which is fine
      if (!alterError.message.includes('already') && !alterError.message.includes('cannot be cast automatically')) {
        console.log('link_to column type check:', alterError.message);
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
          CHECK (status IN ('pending', 'approved', 'declined', 'confirmed', 'scheduled', 'read')),
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

//Activity Logs Table
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

// Ensure rbc_user_logs table exists
const ensureRbcUserLogsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rbc_user_logs (
        log_id SERIAL PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        user_full_name VARCHAR(255) NOT NULL,
        action VARCHAR(10) NOT NULL CHECK (action IN ('login', 'logout')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_rbc_user_logs_user_id ON rbc_user_logs(user_id);
    `);
    console.log('Ensured rbc_user_logs table exists');
  } catch (error) {
    console.error('Error ensuring rbc_user_logs table:', error);
  }
};

// Ensure org_user_logs table exists
const ensureOrgUserLogsTable = async () => {
  try {
    await pool_org.query(`
      CREATE TABLE IF NOT EXISTS org_user_logs (
        log_id SERIAL PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        user_full_name VARCHAR(255) NOT NULL,
        action VARCHAR(10) NOT NULL CHECK (action IN ('login', 'logout')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_org_user_logs_user_id ON org_user_logs(user_id);
    `);
    console.log('Ensured org_user_logs table exists');
  } catch (error) {
    console.error('Error ensuring org_user_logs table:', error);
  }
};

// Ensure log tables exist on startup
ensureRbcUserLogsTable();
ensureOrgUserLogsTable();

// Ensure invoice utility functions exist
const ensureInvoiceFunctions = async () => {
  try {
    // Function to generate Release Invoice IDs (e.g., INV-20251113-103045-123)
    await pool.query(`
      CREATE OR REPLACE FUNCTION generate_invoice_id()
      RETURNS VARCHAR(25) AS $$
      BEGIN
        -- Format: INV-YYYYMMDD-HH24MISS-MS
        RETURN 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS-MS');
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    // Function to generate Discard Invoice IDs (e.g., DIS-20251113-103045-123)
    await pool.query(`
      CREATE OR REPLACE FUNCTION generate_discarded_invoice_id()
      RETURNS VARCHAR(25) AS $$
      BEGIN
        -- Format: DIS-YYYYMMDD-HH24MISS-MS
        RETURN 'DIS-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS-MS');
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✓ Invoice generator functions ensured');
    return true;
  } catch (error) {
    console.error('Error ensuring invoice functions:', error);
    throw error;
  }
};

// Ensure invoice tables exist
const ensureInvoiceTables = async () => {
  try {
    // 1. Create Released Blood Invoices Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blood_invoices (
        bi_id SERIAL PRIMARY KEY,
        bi_invoice_id VARCHAR(50) UNIQUE NOT NULL,
        bi_receiving_facility VARCHAR(255),
        bi_classification VARCHAR(100),
        bi_date_of_release TIMESTAMP,
        bi_released_by VARCHAR(255),
        bi_reference_number VARCHAR(100),
        bi_prepared_by VARCHAR(255),
        bi_verified_by VARCHAR(255),
        bi_created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 2. Create Released Blood Invoice Items Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blood_invoice_items (
        bii_id SERIAL PRIMARY KEY,
        bii_invoice_id INTEGER REFERENCES blood_invoices(bi_id) ON DELETE CASCADE,
        bii_released_blood_id INTEGER REFERENCES released_blood(rb_id) ON DELETE SET NULL,
        bii_serial_id VARCHAR(100),
        bii_blood_type VARCHAR(5),
        bii_rh_factor VARCHAR(10),
        bii_date_of_collection TIMESTAMP,
        bii_date_of_expiration TIMESTAMP,
        bii_volume INTEGER,
        bii_remarks TEXT,
        bii_created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // 3. Create Discarded Blood Invoices Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS discarded_blood_invoices (
        dbi_id SERIAL PRIMARY KEY,
        dbi_invoice_id VARCHAR(50) UNIQUE NOT NULL,
        dbi_reference_number VARCHAR(100),
        dbi_responsible_personnel VARCHAR(255),
        dbi_reason_for_discarding TEXT,
        dbi_authorized_by VARCHAR(255),
        dbi_date_of_discard TIMESTAMP,
        dbi_time_of_discard VARCHAR(50),
        dbi_method_of_disposal VARCHAR(255),
        dbi_remarks TEXT,
        dbi_created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 4. Create Discarded Blood Invoice Items Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS discarded_blood_invoice_items (
        dbii_id SERIAL PRIMARY KEY,
        dbii_invoice_id INTEGER REFERENCES discarded_blood_invoices(dbi_id) ON DELETE CASCADE,
        dbii_discarded_blood_id INTEGER, 
        dbii_serial_id VARCHAR(100),
        dbii_blood_type VARCHAR(5),
        dbii_rh_factor VARCHAR(10),
        dbii_date_of_collection TIMESTAMP,
        dbii_date_of_expiration TIMESTAMP,
        dbii_volume INTEGER,
        dbii_created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // ADD THIS NEW BLOCK to link released_blood to blood_invoices
    try {
      await pool.query(`
        ALTER TABLE released_blood
        ADD CONSTRAINT fk_blood_invoice
        FOREIGN KEY (rb_invoice_id) 
        REFERENCES blood_invoices(bi_id) ON DELETE SET NULL;
      `);
    } catch (e) {
      if (e.code !== '42710') { // 42710 = constraint already exists
         console.error('Error adding FK to released_blood:', e.message);
      }
    }

    console.log('✓ All Invoice tables ensured');
    return true;
  } catch (error) {
    console.error('Error ensuring invoice tables:', error);
    throw error;
  }
};

// Ensure blood_reports and blood_stock_history tables exist
const ensureBloodReportsTables = async () => {
  try {
    // 1. Create blood_reports table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blood_reports (
        br_id SERIAL PRIMARY KEY,
        br_report_id VARCHAR(50) NOT NULL,
        br_quarter VARCHAR(50) NOT NULL,
        br_year INTEGER NOT NULL,
        br_month_start INTEGER NOT NULL,
        br_month_end INTEGER NOT NULL,
        br_month_labels TEXT[],
        br_o_positive INTEGER DEFAULT 0,
        br_o_negative INTEGER DEFAULT 0,
        br_a_positive INTEGER DEFAULT 0,
        br_a_negative INTEGER DEFAULT 0,
        br_b_positive INTEGER DEFAULT 0,
        br_b_negative INTEGER DEFAULT 0,
        br_ab_positive INTEGER DEFAULT 0,
        br_ab_negative INTEGER DEFAULT 0,
        br_others INTEGER DEFAULT 0,
        br_o_positive_pct NUMERIC(5, 2) DEFAULT 0.00,
        br_o_negative_pct NUMERIC(5, 2) DEFAULT 0.00,
        br_a_positive_pct NUMERIC(5, 2) DEFAULT 0.00,
        br_a_negative_pct NUMERIC(5, 2) DEFAULT 0.00,
        br_b_positive_pct NUMERIC(5, 2) DEFAULT 0.00,
        br_b_negative_pct NUMERIC(5, 2) DEFAULT 0.00,
        br_ab_positive_pct NUMERIC(5, 2) DEFAULT 0.00,
        br_ab_negative_pct NUMERIC(5, 2) DEFAULT 0.00,
        br_others_pct NUMERIC(5, 2) DEFAULT 0.00,
        br_total_count INTEGER DEFAULT 0,
        br_month1_data JSONB,
        br_month2_data JSONB,
        br_month3_data JSONB,
        br_created_by VARCHAR(255),
        br_created_at TIMESTAMP DEFAULT NOW(),
        br_modified_at TIMESTAMP,
        CONSTRAINT uq_report_quarter_year UNIQUE (br_quarter, br_year)
      )
    `);
    console.log('✓ Blood reports table ensured');

    // 2. Create blood_stock_history table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blood_stock_history (
        bsh_id SERIAL PRIMARY KEY,
        bsh_serial_id VARCHAR(100) NOT NULL,
        bsh_blood_type VARCHAR(5),
        bsh_rh_factor VARCHAR(10),
        bsh_volume INTEGER,
        bsh_timestamp TIMESTAMP,
        bsh_expiration_date TIMESTAMP,
        bsh_status VARCHAR(50),
        bsh_category VARCHAR(50),
        bsh_original_stock_id INTEGER,
        bsh_action VARCHAR(50) NOT NULL,
        bsh_action_timestamp TIMESTAMP DEFAULT NOW(),
        bsh_source VARCHAR(100)
      )
    `);
    
    // Create indexes for history table
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_bsh_action_timestamp ON blood_stock_history(bsh_action_timestamp DESC)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_bsh_action ON blood_stock_history(bsh_action)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_bsh_category ON blood_stock_history(bsh_category)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_bsh_year_month ON blood_stock_history (EXTRACT(YEAR FROM bsh_timestamp), EXTRACT(MONTH FROM bsh_timestamp))`);

    console.log('✓ Blood stock history table ensured');
    return true;
  } catch (error) {
    console.error('Error ensuring blood reports tables:', error);
    throw error;
  }
};

// ONE-TIME BACKFILL: Copy existing data into the history table
const backfillBloodStockHistory = async () => {
  try {
    // Check if backfill has already been done
    const check = await pool.query("SELECT bsh_serial_id FROM blood_stock_history LIMIT 1");
    if (check.rowCount > 0) {
      console.log('✓ Blood stock history already contains data. Backfill skipped.');
      return true;
    }

    console.log('Performing one-time backfill of blood_stock_history...');

    // 1. Backfill from blood_stock (Current "Stored")
    const storedQuery = `
      INSERT INTO blood_stock_history (
        bsh_serial_id, bsh_blood_type, bsh_rh_factor, bsh_volume,
        bsh_timestamp, bsh_expiration_date, bsh_status, bsh_category,
        bsh_original_stock_id, bsh_action, bsh_action_timestamp, bsh_source
      )
      SELECT
        bs_serial_id, bs_blood_type, bs_rh_factor, bs_volume,
        bs_timestamp, bs_expiration_date, 'Stored', bs_category,
        bs_id, 'ADDED', bs_created_at, bs_source
      FROM blood_stock
      ON CONFLICT DO NOTHING
    `;
    const storedResult = await pool.query(storedQuery);
    console.log(`✓ Backfilled ${storedResult.rowCount} 'Stored' records.`);

    // 2. Backfill from released_blood (Already "Released")
    const releasedQuery = `
      INSERT INTO blood_stock_history (
        bsh_serial_id, bsh_blood_type, bsh_rh_factor, bsh_volume,
        bsh_timestamp, bsh_expiration_date, bsh_status, bsh_category,
        bsh_original_stock_id, bsh_action, bsh_action_timestamp, bsh_source
      )
      SELECT
        rb_serial_id, rb_blood_type, rb_rh_factor, rb_volume,
        rb_timestamp, rb_expiration_date, 'Released', rb_category,
        rb_original_id, 'RELEASED', rb_released_at, rb_source
      FROM released_blood
      ON CONFLICT DO NOTHING
    `;
    const releasedResult = await pool.query(releasedQuery);
    console.log(`✓ Backfilled ${releasedResult.rowCount} 'Released' records.`);

    // 3. Backfill from discarded_blood (Already "Discarded")
    const discardedQuery = `
      INSERT INTO blood_stock_history (
        bsh_serial_id, bsh_blood_type, bsh_rh_factor, bsh_volume,
        bsh_timestamp, bsh_expiration_date, bsh_status, bsh_category,
        bsh_original_stock_id, bsh_action, bsh_action_timestamp, bsh_source
      )
      SELECT
        db_serial_id, db_blood_type, db_rh_factor, db_volume,
        db_timestamp, db_expiration_date, 'Discarded', db_category,
        db_original_id, 'DISCARDED', db_discarded_at, db_source
      FROM discarded_blood
      ON CONFLICT DO NOTHING
    `;
    const discardedResult = await pool.query(discardedQuery);
    console.log(`✓ Backfilled ${discardedResult.rowCount} 'Discarded' records.`);

    // 4. Backfill from non_conforming (Current "Non-Conforming")
    const ncQuery = `
      INSERT INTO blood_stock_history (
        bsh_serial_id, bsh_blood_type, bsh_rh_factor, bsh_volume,
        bsh_timestamp, bsh_expiration_date, bsh_status, bsh_category,
        bsh_original_stock_id, bsh_action, bsh_action_timestamp, bsh_source
      )
      SELECT
        nc_serial_id, nc_blood_type, nc_rh_factor, nc_volume,
        nc_timestamp, nc_expiration_date, 'Non-Conforming', nc_category,
        nc_id, 'NON-CONFORMING', nc_created_at, nc_source
      FROM non_conforming
      ON CONFLICT DO NOTHING
    `;
    const ncResult = await pool.query(ncQuery);
    console.log(`✓ Backfilled ${ncResult.rowCount} 'Non-Conforming' records.`);

    console.log('✓ One-time history backfill complete.');
    return true;
  } catch (error) {
    console.error('Error during blood stock history backfill:', error);
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

// NEW: Copied from db_org.js and modified to use 'pool_org'
const dbOrgService = {
  async getAllAppointments(organizationName = null) {
    try {
      let query = `
      SELECT 
        id,
        appointment_id,
        title,
        TO_CHAR(appointment_date, 'YYYY-MM-DD') as date,
        appointment_time as time,
        appointment_type as type,
        contact_type,
        last_name,
        email,
        phone,
        address,
        message,
        notes,
        status,
        created_at,
        updated_at
      FROM appointments 
    `;

      const values = [];
      if (organizationName) {
        query += ' WHERE last_name = $1';
        values.push(organizationName);
      }

      query += ' ORDER BY appointment_date DESC, appointment_time DESC';

      // *** IMPORTANT: Use pool_org.query, not pool.query ***
      const result = await pool_org.query(query, values);
    
      return result.rows.map(row => ({
        ...row,
        contactInfo: {
          lastName: row.last_name,
          email: row.email,
          phone: row.phone,
          address: row.address,
          message: row.message,
          type: row.contact_type
        }
      }));
    } catch (error) {
      console.error('Error getting all appointments from org database:', error);
      throw error;
    }
  },

  async declineSyncRequest(notificationId, reason) {
    try {
      const query = `
        UPDATE notifications
        SET 
          status = 'declined',
          decline_reason = $2,
          read = FALSE, 
          updated_at = NOW()
        WHERE 
          notification_id = $1
      `;
      
      const values = [notificationId, reason];
      
      const result = await pool_org.query(query, values);
      return { success: true, updated: result.rowCount };

    } catch (error) {
      console.error('Error declining sync request in org db:', error);
      throw error;
    }
  }
};

const dbService = {
  async updateSyncRequestStatus(organization, userName, status, by, reason = null) {
    try {
        const isApproved = status === 'approved';
        const isDeclined = status === 'declined';

        if (!isApproved && !isDeclined) {
            return { success: false, message: 'Invalid status' };
        }

        const query = `
            UPDATE temp_donor_records
            SET
                tdr_sync_status = CASE WHEN $1::boolean THEN 'approved' ELSE 'rejected' END,
                tdr_sync_approved_by = $2,
                tdr_sync_approved_at = CASE WHEN $1::boolean THEN NOW() ELSE NULL END,
                tdr_rejection_reason = CASE WHEN $1::boolean THEN NULL ELSE $3 END,
                tdr_updated_at = NOW()
            WHERE
                tdr_source_organization = $4
                AND tdr_source_user_name = $5
                AND tdr_sync_status = 'pending'
        `;

        const values = [isApproved, by, reason, organization, userName];

        const result = await pool.query(query, values);
        return { success: true, updated: result.rowCount };

    } catch (error) {
      console.error('Error updating sync request status:', error);
      throw error;
    }
  },

  async createOrgNotification(notificationData) {
    try {
      const {
        notificationId,
        type,
        status,
        title,
        message,
        declineReason,
        requestorName,
        requestorOrganization,
        donorCount,
        contactEmail,
        contactPhone,
        contactAddress,
        appointmentId
      } = notificationData;

      const query = `
        INSERT INTO notifications (
          notification_id, type, status, title, message, decline_reason,
          requestor_name, requestor_organization, donor_count,
          contact_email, contact_phone, contact_address, appointment_id,
          created_at, updated_at, read
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW(), FALSE)
        RETURNING id;
      `;

      const values = [
        notificationId, type, status, title, message, declineReason,
        requestorName, requestorOrganization, donorCount,
        contactEmail, contactPhone, contactAddress, appointmentId
      ];

      const result = await pool_org.query(query, values);
      return { success: true, notificationId: result.rows[0].id };

    } catch (error) {
      console.error('Error creating org notification:', error);
      throw error;
    }
  },

  async getAllOrgNotifications() {
    try {
      const result = await pool_org.query('SELECT * FROM notifications ORDER BY created_at DESC');
      return result.rows;
    } catch (error) {
      console.error('Error getting all org notifications:', error);
      throw error;
    }
  },
  // Initialize database tables
  async initializeTables() {
    try {
      await ensureUserTable();
      await ensurePasswordResetTable();
      await ensureReleasedBloodTable();
      await ensureBloodStockTable();
      await ensureBloodStockResultColumn();
      await ensureNonConformingTable(); 
      await ensureDiscardedBloodTable(); 
      await ensureDonorRecordsTable();
      await ensureTempDonorRecordsTable();
      await ensureNotificationsTable();
      await ensurePartnershipRequestsTable();
      await ensureActivityLogsTable();
      await ensureInvoiceTables();
      await ensureInvoiceFunctions();
      await ensureBloodReportsTables();
      await backfillBloodStockHistory();
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

      const allowedRoles = ['Admin', 'Non-Conforming Staff', 'Inventory Staff', 'Scheduler'];

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

      // Log login event
      try {
        await pool.query(
          'INSERT INTO rbc_user_logs (user_id, user_full_name, action) VALUES ($1, $2, $3)',
          [user.user_id, user.full_name, 'login']
        );
      } catch (logError) {
        console.error('Error logging user login:', logError);
      }
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
        END as modified,
        COALESCE(TO_CHAR(dr_recent_donation, 'MM/DD/YYYY'), 'No donations') as "recentDonation",
        COALESCE(dr_donation_count, 0) as "donationCount"
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
        dr_contact_number, dr_address, dr_status, dr_recent_donation, dr_donation_count,dr_created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
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
      donorData.address,
      donorData.status || "Non-Reactive",  
      donorData.recentDonation ? new Date(donorData.recentDonation) : null,
      parseInt(donorData.donationCount) || 0,
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
        dr_status = $13,
        dr_recent_donation = $14,
        dr_donation_count = $15,
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
      donorData.address,
      donorData.status || "Non-Reactive",
      donorData.recentDonation ? new Date(donorData.recentDonation) : null,
      parseInt(donorData.donationCount) || 0,
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
        END as modified,
        COALESCE(TO_CHAR(dr_recent_donation, 'MM/DD/YYYY'), 'No donations') as "recentDonation",
        COALESCE(dr_donation_count, 0) as "donationCount"
      FROM donor_records 
      WHERE 
        dr_donor_id ILIKE $1 OR 
        dr_first_name ILIKE $1 OR 
        dr_middle_name ILIKE $1 OR
        dr_last_name ILIKE $1 OR
        dr_gender ILIKE $1 OR
        dr_blood_type ILIKE $1 OR
        dr_contact_number ILIKE $1 OR
        dr_address ILIKE $1 OR
        dr_status ILIKE $1
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


  // ========== NOTIFICATION METHODS ==========

  // Get all notifications for a user or all users
  async getAllNotifications(userId = null) {
    try {
      let query;
      const params = [];

      if (userId) {
        query = 'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC';
        params.push(userId);
      } else {
        query = 'SELECT * FROM notifications ORDER BY created_at DESC';
      }

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting all notifications:', error);
      throw error;
    }
  },

  // Get unread notification count for a user or all users
  async getUnreadNotificationCount(userId = null) {
    try {
      let query;
      const params = [];

      if (userId) {
        query = 'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE';
        params.push(userId);
      } else {
        query = 'SELECT COUNT(*) FROM notifications WHERE is_read = FALSE';
      }

      const result = await pool.query(query, params);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      if (error.code === '42P01') { // undefined_table
        console.warn('Notifications table not found, returning 0.');
        return 0;
      }
      throw error;
    }
  },

  // Mark a single notification as read
  async markNotificationAsRead(notificationId) {
    try {
      const result = await pool.query(
        `UPDATE notifications 
         SET status = 'read', is_read = TRUE, read_at = NOW() 
         WHERE id = $1 AND is_read = FALSE`,
        [notificationId]
      );
      return { success: true, updated: result.rowCount };
    } catch (error) {
      console.error(`Error marking notification ${notificationId} as read:`, error);
      throw error;
    }
  },

  // Mark all notifications as read for a user
  async markAllNotificationsAsRead(userId = null) {
    try {
      let query;
      const params = [];
      
      if (userId) {
        query = 'UPDATE notifications SET is_read = TRUE, status = \'read\', read_at = NOW() WHERE user_id = $1 AND is_read = FALSE';
        params.push(userId);
      } else {
        query = 'UPDATE notifications SET is_read = TRUE, status = \'read\', read_at = NOW() WHERE is_read = FALSE';
      }
      
      const result = await pool.query(query, params);
      return { success: true, updated: result.rowCount };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
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
  // Log logout event for RBC
  async logRbcUserLogout(userId, userFullName) {
    try {
      await pool.query(
        'INSERT INTO rbc_user_logs (user_id, user_full_name, action) VALUES ($1, $2, $3)',
        [userId, userFullName, 'logout']
      );
    } catch (error) {
      console.error('Error logging RBC user logout:', error);
    }
  },

  // Get RBC user logs
  async getRbcUserLogs(userId) {
    try {
      const result = await pool.query(
        'SELECT * FROM rbc_user_logs WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching RBC user logs:', error);
      return [];
    }
  },

  // Get RBC user profile
  async getUserProfileRBC(userId) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // First, ensure all columns exist
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
      // ADD THIS ONE
      await client.query(`
        ALTER TABLE user_doh
        ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50)
      `);

      console.log('✓ Columns verified/created in user_doh table');

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
          u.phone_number, -- ADD THIS LINE
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

      // Get activities from rbc_user_logs table
      const result = await pool.query(
        `SELECT
          log_id as id,
          user_full_name as user_name,
          action as action_type,
          CASE
            WHEN action = 'login' THEN user_full_name || ' logged in'
            WHEN action = 'logout' THEN user_full_name || ' logged out'
            ELSE user_full_name || ' performed ' || action
          END as action_description,
          created_at
         FROM rbc_user_logs
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      return result.rows;
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
            dr_status as status, -- <-- Added this, it was missing
            dr_contact_number as "contactNumber",
            dr_address as address,

            -- FIX: Select the correct columns and alias them
            COALESCE(dr_donation_count, 0) as "donationCount",
            COALESCE(dr_donation_dates, '[]'::jsonb) as "donationDates", -- <-- Added for history
            TO_CHAR(dr_recent_donation, 'MM/DD/YYYY HH24:MI') as "recentDonation", -- <-- Formatted date

            dr_source_organization as source_organization,
            dr_created_at as created_at,
            dr_modified_at as updated_at
          FROM donor_records
          ORDER BY dr_created_at DESC
        `);

        return result.rows.map(row => ({
          ...row,
          // Ensure donationDates is parsed JSON
          donationDates: typeof row.donationDates === 'string' ? JSON.parse(row.donationDates) : row.donationDates,
          selected: false
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
            dr_donation_count = COALESCE(dr_donation_count, 0) + 1,
            dr_donation_dates = $1::jsonb,
            dr_recent_donation = $2,
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
            dr_blood_type, dr_rh_factor, dr_contact_number, dr_address, dr_donation_count,
            dr_donation_dates, dr_recent_donation, dr_source_organization, dr_created_at
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

    // REMOVED the problematic notification code since it references undefined syncRequestId
    // Organizations will be notified through the main.js handler instead

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

  // Create a notification for the organization
  async createOrgNotification(type, title, message, related_id, organization_id) {
    try {
      const result = await pool.query(`
        INSERT INTO organization_notifications (
          on_type, on_title, on_message, on_related_id, on_organization_id, on_created_at
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        RETURNING *;
      `, [type, title, message, related_id, organization_id]);
      return result.rows[0];
    } catch (error) {
      console.error('[DB] Error creating organization notification:', error);
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
          bs_volume as volume_ml,
          TO_CHAR(bs_timestamp, 'YYYY-MM-DD') as collection_date,
          TO_CHAR(bs_expiration_date, 'YYYY-MM-DD') as expiration_date,
          (bs_expiration_date::DATE - CURRENT_DATE) as days_until_expiry,
          bs_status as status,
          bs_created_at as created_at,
          bs_modified_at as updated_at,
          CASE
            WHEN (bs_expiration_date::DATE - CURRENT_DATE) <= 3 THEN 'Urgent'
            WHEN (bs_expiration_date::DATE - CURRENT_DATE) <= 7 THEN 'Alert'
            ELSE 'Normal'
          END as alert_status
        FROM blood_stock
        WHERE bs_status = 'Stored'
          AND (bs_expiration_date::DATE - CURRENT_DATE) <= $1
          AND (bs_expiration_date::DATE - CURRENT_DATE) >= 0
        ORDER BY bs_expiration_date ASC, bs_blood_type ASC
      `;

      const result = await pool.query(query, [daysThreshold]);
      return result.rows;
    } catch (error) {
      console.error('[DB] Error getting expiring blood stocks:', error);
      throw error;
    }
  },

  // Get expiring Non-Conforming Staffs
  async getExpiringNonConformingStocks(daysThreshold = 7) {
    try {
      // --- THIS QUERY IS NOW FIXED ---
      const query = `
        SELECT
          nc_serial_id as serial_id,
          nc_blood_type as blood_type,
          nc_rh_factor as rh_factor,
          nc_category as component,
          nc_volume as volume_ml,
          TO_CHAR(nc_timestamp, 'YYYY-MM-DD') as collection_date,
          TO_CHAR(nc_expiration_date, 'YYYY-MM-DD') as expiration_date,
          (nc_expiration_date::DATE - CURRENT_DATE) as days_until_expiry,
          nc_status as status,
          nc_created_at as created_at,
          nc_modified_at as updated_at,
          CASE
            WHEN (nc_expiration_date::DATE - CURRENT_DATE) <= 3 THEN 'Urgent'
            WHEN (nc_expiration_date::DATE - CURRENT_DATE) <= 7 THEN 'Alert'
            ELSE 'Normal'
          END as alert_status
        FROM non_conforming
        WHERE nc_status = 'Non-Conforming'
          AND (nc_expiration_date::DATE - CURRENT_DATE) <= $1
          AND (nc_expiration_date::DATE - CURRENT_DATE) >= 0
        ORDER BY nc_expiration_date ASC, nc_blood_type ASC
      `;
      // --- END OF FIX ---

      const result = await pool.query(query, [daysThreshold]);
      return result.rows;
    } catch (error) {
      console.error('[DB] Error getting expiring Non-Conforming Staffs:', error);
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
        const expiringStocks = await this.getAllExpiringStocks(30);
        const notificationsCreated = [];

        const createWarningNotification = async (stock, entityType) => {
          const days = parseInt(stock.days_until_expiry, 10);
          const comp = String(stock.component || '').toLowerCase();

          let notificationType = null;
          let title = '';
          let description = '';
          let priority = 'high';

          if (days <= 0) {
            notificationType = 'stock_expired';
            title = 'CRITICAL: This Stock is now EXPIRED';
            description = `${stock.blood_type}${stock.rh_factor} ${stock.component} (Serial: ${stock.serial_id}) has EXPIRED on ${stock.expiration_date}. Immediate disposal required to prevent safety hazards.`;
            priority = 'critical';
          } else if (comp.includes('red blood cell')) {
            if (days === 7) {
              const exists = await pool.query(`
                SELECT id FROM notifications
                WHERE notification_type = 'stock_expiring_soon'
                  AND related_entity_id = $1
                  AND related_entity_type = $2
              `, [stock.serial_id, entityType]);
              if (exists.rows.length > 0) return;
              notificationType = 'stock_expiring_soon';
              title = `STOCK ALERT: This stock is about to expire in 7 days!`;
              description = `${stock.blood_type}${stock.rh_factor} ${stock.component} (Serial: ${stock.serial_id}) will expire on ${stock.expiration_date}. 7 days remaining.`;
              priority = 'high';
            } else if (days >= 1 && days <= 5) {
              const createdToday = await pool.query(`
                SELECT id FROM notifications
                WHERE notification_type = 'stock_expiring_urgent'
                  AND related_entity_id = $1
                  AND related_entity_type = $2
                  AND DATE(created_at) = CURRENT_DATE
              `, [stock.serial_id, entityType]);
              if (createdToday.rows.length > 0) return;
              notificationType = 'stock_expiring_urgent';
              title = `URGENT: This stock is about to expire in ${days} days!`;
              description = `${stock.blood_type}${stock.rh_factor} ${stock.component} (Serial: ${stock.serial_id}) will expire on ${stock.expiration_date}. Only ${days} days remaining.`;
              priority = 'urgent';
            } else {
              return;
            }
          } else if (comp.includes('plasma')) {
            if (days >= 8 && days <= 30 && days % 7 === 0) {
              const createdToday = await pool.query(`
                SELECT id FROM notifications
                WHERE notification_type = 'stock_expiring_soon'
                  AND related_entity_id = $1
                  AND related_entity_type = $2
                  AND DATE(created_at) = CURRENT_DATE
              `, [stock.serial_id, entityType]);
              if (createdToday.rows.length > 0) return;
              notificationType = 'stock_expiring_soon';
              title = `STOCK ALERT: This stock is about to expire in ${days} days!`;
              description = `${stock.blood_type}${stock.rh_factor} ${stock.component} (Serial: ${stock.serial_id}) will expire on ${stock.expiration_date}. ${days} days remaining.`;
              priority = 'high';
            } else if (days >= 1 && days <= 7) {
              const createdToday = await pool.query(`
                SELECT id FROM notifications
                WHERE notification_type = 'stock_expiring_urgent'
                  AND related_entity_id = $1
                  AND related_entity_type = $2
                  AND DATE(created_at) = CURRENT_DATE
              `, [stock.serial_id, entityType]);
              if (createdToday.rows.length > 0) return;
              notificationType = 'stock_expiring_urgent';
              title = `URGENT: This stock is about to expire in ${days} days!`;
              description = `${stock.blood_type}${stock.rh_factor} ${stock.component} (Serial: ${stock.serial_id}) will expire on ${stock.expiration_date}. Only ${days} days remaining.`;
              priority = 'urgent';
            } else {
              return;
            }
          } else if (comp.includes('platelet')) {
            if (days === 4) {
              const exists = await pool.query(`
                SELECT id FROM notifications
                WHERE notification_type = 'stock_expiring_soon'
                  AND related_entity_id = $1
                  AND related_entity_type = $2
              `, [stock.serial_id, entityType]);
              if (exists.rows.length > 0) return;
              notificationType = 'stock_expiring_soon';
              title = `STOCK ALERT: This stock is about to expire in 4 days!`;
              description = `${stock.blood_type}${stock.rh_factor} ${stock.component} (Serial: ${stock.serial_id}) will expire on ${stock.expiration_date}. 4 days remaining.`;
              priority = 'high';
            } else if (days >= 1 && days <= 3) {
              const createdToday = await pool.query(`
                SELECT id FROM notifications
                WHERE notification_type = 'stock_expiring_urgent'
                  AND related_entity_id = $1
                  AND related_entity_type = $2
                  AND DATE(created_at) = CURRENT_DATE
              `, [stock.serial_id, entityType]);
              if (createdToday.rows.length > 0) return;
              notificationType = 'stock_expiring_urgent';
              title = `URGENT: This stock is about to expire in ${days} days!`;
              description = `${stock.blood_type}${stock.rh_factor} ${stock.component} (Serial: ${stock.serial_id}) will expire on ${stock.expiration_date}. Only ${days} days remaining.`;
              priority = 'urgent';
            } else {
              return;
            }
          } else {
            return;
          }

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

          const result = await pool.query(
            `INSERT INTO notifications (
              notification_type, title, description,
              related_entity_type, related_entity_id,
              status, priority, is_read, link_to
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id`,
            [
              notificationType,
              title,
              description,
              entityType,
              stock.serial_id,
              'unread',
              priority,
              false,
              stockData
            ]
          );

          notificationsCreated.push({
            id: result.rows[0].id,
            type: entityType,
            serial_id: stock.serial_id
          });
        };

        for (const stock of expiringStocks.bloodStocks) {
          await createWarningNotification(stock, 'blood_stock');
        }
        for (const stock of expiringStocks.nonConformingStocks) {
          await createWarningNotification(stock, 'non_conforming');
        }

        return {
          notificationsCreated: notificationsCreated.length,
          notifications: notificationsCreated
        };
      } catch (error) {
        console.error('[DB] Error checking and creating expiration notifications:', error);
        throw error;
      }
    },

  // Check and create low/out of stock notifications
  async checkAndCreateStockLevelNotifications() {
    try {
      const notificationsCreated = [];
      const lowStockThreshold = 10; // Alert when stock is 10 or below

      // Get current stock counts by category
      const stockCountQuery = `
        SELECT
          bs_category as category,
          COUNT(*) as count
        FROM blood_stock
        WHERE bs_status = 'Stored'
        GROUP BY bs_category
      `;

      const result = await pool.query(stockCountQuery);
      const stockCounts = {
        'Red Blood Cell': 0,
        'Plasma': 0,
        'Platelet': 0
      };

      // Populate actual counts
      result.rows.forEach(row => {
        stockCounts[row.category] = parseInt(row.count);
      });

      console.log('[DB] Current stock counts:', stockCounts);

      // Check each category and create notifications if needed
      for (const [category, count] of Object.entries(stockCounts)) {
        let notificationType, title, description, priority;
        let shouldCreateNotification = false;

        if (count === 0) {
          // OUT OF STOCK - High Priority
          notificationType = 'stock_out';
          title = `STOCK ALERT: Out of Stocks, Restock Immediately!`;
          description = `${category} stock is completely depleted. Immediate restocking required to maintain blood supply operations.`;
          priority = 'high';
          shouldCreateNotification = true;
        } else if (count <= lowStockThreshold) {
          // LOW STOCK - Urgent
          notificationType = 'stock_low';
          title = `STOCK ALERT: The Stocks are about to Run Out!`;
          description = `The following stock in ${category} has ${count} remaining. Take this Action Immediately!`;
          priority = 'urgent';
          shouldCreateNotification = true;
        }

        if (shouldCreateNotification) {
          // Check if notification already exists today for this category
          const today = new Date().toISOString().split('T')[0];
          const existingNotif = await pool.query(`
            SELECT id FROM notifications
            WHERE notification_type IN ('stock_low', 'stock_out')
            AND related_entity_type = $1
            AND DATE(created_at) = $2
            LIMIT 1
          `, [category, today]);

          if (existingNotif.rows.length === 0) {
            // Prepare stock data for the notification
            const stockData = JSON.stringify({
              category: category,
              stockCount: count,
              threshold: lowStockThreshold,
              alertType: count === 0 ? 'out_of_stock' : 'low_stock'
            });

            const notifQuery = `
              INSERT INTO notifications (
                notification_type, title, description,
                related_entity_type, related_entity_id,
                status, priority, is_read, link_to
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              RETURNING id
            `;

            const insertResult = await pool.query(notifQuery, [
              notificationType,
              title,
              description,
              category,
              null, // No specific entity ID for stock level alerts
              'unread',
              priority,
              false,
              stockData
            ]);

            notificationsCreated.push({
              id: insertResult.rows[0].id,
              category: category,
              count: count,
              alertType: count === 0 ? 'out_of_stock' : 'low_stock'
            });

            console.log(`[DB] Created ${notificationType} notification for ${category} (count: ${count})`);
          } else {
            console.log(`[DB] Stock level notification for ${category} already exists today`);
          }
        }
      }

      console.log(`[DB] Created ${notificationsCreated.length} stock level notifications`);
      return {
        notificationsCreated: notificationsCreated.length,
        notifications: notificationsCreated
      };
    } catch (error) {
      console.error('[DB] Error checking and creating stock level notifications:', error);
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
          doh_id,
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
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const query = `
        UPDATE user_doh
        SET is_active = true
        WHERE user_id = $1 AND is_active = false
        RETURNING user_id, full_name, email, role
      `;

      const result = await client.query(query, [userId]);

      if (result.rows.length === 0) {
        throw new Error('User not found or already active');
      }

      const user = result.rows[0];

      // After approving, create their default permissions
      await client.query('SELECT create_default_permissions($1, $2)', [user.user_id, user.role]);

      await client.query('COMMIT');

      console.log(`[DB] User ${user.full_name} approved and permissions created.`);
      return user;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[DB] Error approving user:', error);
      throw error;
    } finally {
      client.release();
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
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const validRoles = ['Admin', 'Non-Conforming Staff', 'Inventory Staff', 'Scheduler'];

      if (!validRoles.includes(newRole)) {
        throw new Error('Invalid role specified');
      }

      const query = `
        UPDATE user_doh
        SET role = $1
        WHERE user_id = $2
        RETURNING user_id, full_name, email, role
      `;

      const result = await client.query(query, [newRole, userId]);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = result.rows[0];

      // After updating role, recreate their permissions
      await client.query('SELECT create_default_permissions($1, $2)', [user.user_id, user.role]);

      await client.query('COMMIT');

      console.log(`[DB] User ${user.full_name} role updated to ${user.role} and permissions reset.`);
      return user;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[DB] Error updating user role:', error);
      throw error;
    } finally {
      client.release();
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
    }
  },

  // ========== USER PERMISSIONS METHODS ==========
  // Get user permissions
  async getUserPermissions(userId) {
    try {
      const query = `
        SELECT
          id,
          user_id,
          screen,
          can_view,
          can_create,
          can_edit,
          can_delete,
          is_visible
        FROM user_permissions
        WHERE user_id = $1
        ORDER BY
          CASE screen
            WHEN 'Dashboard' THEN 1
            WHEN 'Blood Stock' THEN 2
            WHEN 'Released Blood' THEN 3
            WHEN 'Non-Conforming' THEN 4
            WHEN 'Donor Record' THEN 5
            WHEN 'Invoice' THEN 6
            WHEN 'Reports' THEN 7
            WHEN 'Recent Activity' THEN 8
            ELSE 9
          END
      `;

      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('[DB] Error getting user permissions:', error);
      throw error;
    }
  },

  // Update user permissions
  async updateUserPermissions(userId, permissions) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update each permission
      for (const perm of permissions) {
        await client.query(
          `UPDATE user_permissions
           SET can_view = $1,
               can_create = $2,
               can_edit = $3,
               can_delete = $4,
               is_visible = $5,
               updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $6 AND screen = $7`,
          [perm.can_view, perm.can_create, perm.can_edit, perm.can_delete, perm.is_visible, userId, perm.screen]
        );
      }

      await client.query('COMMIT');

      // Return updated permissions
      return await this.getUserPermissions(userId);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[DB] Error updating user permissions:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // ========== PASSWORD AND PHONE NUMBER MANAGEMENT ==========

// All functions here are suffixed with RBC and point to the 'user_doh' table.

  async verifyPasswordRBC(userId, password) {
    try {
      // USES bcryptjs from top of file, removed internal require('bcrypt')
      const query = 'SELECT password_hash FROM user_doh WHERE user_id = $1'; //
      const result = await pool.query(query, [userId]);

      if (result.rows.length === 0) {
        return false;
      }

      const hashedPassword = result.rows[0].password_hash; //
      const isValid = await bcrypt.compare(password, hashedPassword);
      return isValid;
    } catch (error) {
      console.error('Error verifying RBC password:', error);
      throw error;
    }
  },

  async updateUserPasswordRBC(userId, newPassword) {
      try {
        // USES bcryptjs from top of file
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const query = `
          UPDATE user_doh
          SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $2
          RETURNING user_id, email, full_name as "fullName"
        `; //

        const result = await pool.query(query, [hashedPassword, userId]);
        console.log(`[DB] Password updated for RBC user ID: ${userId}`);
        return result.rows[0];
      } catch (error) {
        console.error('Error updating RBC user password:', error);
        throw error;
      }
    },

  async sendPasswordResetOTPRBC(email) {
      try {
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store OTP in database (uses password_reset_tokens table, which is correct)
        const query = `
          INSERT INTO password_reset_tokens (email, otp_code, expires_at)
          VALUES ($1, $2, $3)
          ON CONFLICT (email)
          DO UPDATE SET otp_code = $2, expires_at = $3, created_at = CURRENT_TIMESTAMP
          RETURNING *
        `; //

        await pool.query(query, [email, otp, expiresAt]);

        console.log(`[DB] Password reset OTP generated for ${email}: ${otp}`);
        return { success: true, otp: otp }; // Remove otp from return in production
      } catch (error) {
        console.error('Error sending password reset OTP:', error);
        throw error;
      }
    },

  async verifyPasswordResetOTPRBC(email, otp) {
    try {
      const query = `
        SELECT * FROM password_reset_tokens
        WHERE email = $1 AND otp_code = $2 AND expires_at > CURRENT_TIMESTAMP
      `; //

      const result = await pool.query(query, [email, otp]);

      if (result.rows.length > 0) {
        // Delete OTP after successful verification
        await pool.query('DELETE FROM password_reset_tokens WHERE email = $1', [email]); //
        console.log(`[DB] Password reset OTP verified for ${email}`);
        return true;
      }

      console.log(`[DB] Invalid or expired OTP for ${email}`);
      return false;
    } catch (error) {
      console.error('Error verifying password reset OTP:', error);
      throw error;
    }
  },

  async updatePhoneNumberRBC(userId, phoneNumber) {
    try {
      const query = `
        UPDATE user_doh
        SET phone_number = $1, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2
        RETURNING user_id, email, full_name as "fullName", phone_number
      `; //

      const result = await pool.query(query, [phoneNumber, userId]);
      console.log(`[DB] Phone number updated for RBC user ID: ${userId}`);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating RBC phone number:', error);
      throw error;
    }
  },

  async sendPhoneVerificationOTPRBC(phoneNumber) {
    try {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Ensure table exists
      await pool.query(`
          CREATE TABLE IF NOT EXISTS phone_verification_otps (
            id SERIAL PRIMARY KEY,
            phone_number VARCHAR(50) UNIQUE NOT NULL,
            otp_code VARCHAR(6) NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

      // Store OTP in database
      const query = `
        INSERT INTO phone_verification_otps (phone_number, otp_code, expires_at)
        VALUES ($1, $2, $3)
        ON CONFLICT (phone_number)
        DO UPDATE SET otp_code = $2, expires_at = $3, created_at = CURRENT_TIMESTAMP
        RETURNING *
      `;

      await pool.query(query, [phoneNumber, otp, expiresAt]);

      console.log(`[DB] Phone verification OTP generated for ${phoneNumber}: ${otp}`);
      return { success: true, otp: otp }; // Remove otp from return in production
    } catch (error) {
      console.error('Error sending phone verification OTP:', error);
      throw error;
    }
  },

  async verifyPhoneOTPRBC(phoneNumber, otp) {
    try {
      const query = `
        SELECT * FROM phone_verification_otps
        WHERE phone_number = $1 AND otp_code = $2 AND expires_at > CURRENT_TIMESTAMP
      `;

      const result = await pool.query(query, [phoneNumber, otp]);

      if (result.rows.length > 0) {
        // Delete OTP after successful verification
        await pool.query('DELETE FROM phone_verification_otps WHERE phone_number = $1', [phoneNumber]);
        console.log(`[DB] Phone verification OTP verified for ${phoneNumber}`);
        return true;
      }

      console.log(`[DB] Invalid or expired OTP for ${phoneNumber}`);
      return false;
    } catch (error) {
      console.error('Error verifying phone OTP:', error);
      throw error;
    }
  },

 // --- NEW FUNCTION TO UPDATE EMAIL ---
  async updateEmailRBC(userId, newEmail) {
    try {
      // Check if email is already in use by another user
      const existing = await pool.query(
        "SELECT user_id FROM user_doh WHERE email = $1 AND user_id != $2",
        [newEmail, userId]
      );

      if (existing.rows.length > 0) {
        throw new Error('Email is already in use by another account.');
      }

      // Update the email
      const query = `
        UPDATE user_doh
        SET email = $1, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2
        RETURNING user_id, email, full_name
      `;
      
      const result = await pool.query(query, [newEmail, userId]);
      
      if (result.rows.length === 0) {
        throw new Error('User not found.');
      }
      
      console.log(`[DB] Email updated for RBC user ID: ${userId}`);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating RBC email:', error);
      throw error;
    }
  },

// END : ALL METHODS MADE BY CHRISTIAN PAASA ============================================================================================
//============================================BREAK HERE FOR EVEGEN DELA CRUZ METHODS======================================================
//============================================BREAK HERE FOR EVEGEN DELA CRUZ METHODS======================================================
//============================================BREAK HERE FOR EVEGEN DELA CRUZ METHODS======================================================
//============================================BREAK HERE FOR EVEGEN DELA CRUZ METHODS======================================================
//============================================BREAK HERE FOR EVEGEN DELA CRUZ METHODS======================================================
//START: ALL METHODS MADE BY EVEGEN DELA CRUZ ============================================================================================
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
        bs_category as category,
        bs_source as source
      FROM blood_stock 
      WHERE bs_category = 'Red Blood Cell' AND bs_status = 'Stored'
      ORDER BY bs_created_at DESC
    `;

      const result = await pool.query(query);
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error fetching red blood cell stock:", error);
      throw error;
    }
  },

  // Get blood stock by serial ID for release with search functionality
  async getBloodStockBySerialId(serialId) {
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
        bs_category as category,
        bs_source as source
      FROM blood_stock 
      WHERE bs_serial_id = $1 AND bs_category = 'Red Blood Cell' AND bs_status = 'Stored'
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
          bs_category as category,
          bs_source as source
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
      console.error("Error fetching blood stock by serial ID:", error);
      throw error;
    }
  },

  async addBloodStock(bloodData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const query = `
        INSERT INTO blood_stock (
          bs_serial_id, bs_blood_type, bs_rh_factor, bs_volume,
          bs_timestamp, bs_expiration_date, bs_status, bs_created_at, bs_category, bs_source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9)
        RETURNING bs_id
      `;

      // Ensure source is properly extracted
      const source = bloodData.source || "Walk-In";

      const values = [
        bloodData.serial_id,
        bloodData.type,
        bloodData.rhFactor,
        parseInt(bloodData.volume),
        new Date(bloodData.collection),
        new Date(bloodData.expiration),
        bloodData.status || "Stored",
        "Red Blood Cell",
        source, // Use the extracted source
      ];

      const result = await client.query(query, values);
      const stockId = result.rows[0].bs_id;


      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error adding blood stock:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  async updateBloodStock(id, bloodData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

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
        bs_category = $9,
        bs_source = $10
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
        bloodData.status || "Stored",
        "Red Blood Cell",
        bloodData.source || "Walk-In",
      ];

      await client.query(query, values);

      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error updating red blood cell stock:", error);
      throw error;
    } finally {
      client.release();
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
        bs_category as category,
        bs_source as source
      FROM blood_stock 
      WHERE 
        bs_category = 'Red Blood Cell' AND bs_status = 'Stored' AND (
          bs_serial_id ILIKE $1 OR 
          bs_blood_type ILIKE $1 OR 
          bs_status ILIKE $1 OR
          bs_rh_factor ILIKE $1 OR
          bs_source ILIKE $1
        )
      ORDER BY bs_created_at DESC
    `;

      const result = await pool.query(query, [`%${searchTerm}%`]);
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error searching red blood cell stock:", error);
      throw error;
    }
  },

  // Delete red blood cell stock records
  async deleteBloodStock(ids) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Get records before deletion to add to history
      const getRecordsQuery = `
        SELECT bs_id, bs_serial_id, bs_blood_type, bs_rh_factor, bs_volume,
               bs_timestamp, bs_expiration_date, bs_status, bs_source
        FROM blood_stock 
        WHERE bs_id = ANY($1) AND bs_category = 'Red Blood Cell'
      `;
      const records = await client.query(getRecordsQuery, [ids]);
      // Delete from blood_stock
      const query =
        "DELETE FROM blood_stock WHERE bs_id = ANY($1) AND bs_category = 'Red Blood Cell'";
      await client.query(query, [ids]);

      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error deleting red blood cell stock:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  // ========== RELEASE STOCK METHODS ==========

  async releaseBloodStock(releaseData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const getStockQuery = `
        SELECT * FROM blood_stock 
        WHERE bs_serial_id = ANY($1) AND bs_category = 'Red Blood Cell' AND bs_status = 'Stored'
      `;
      const stockResult = await client.query(getStockQuery, [
        releaseData.serialIds,
      ]);

      if (stockResult.rows.length === 0) {
        throw new Error("No valid blood stock records found for release");
      }

      const releasedBloodIds = [];

      for (const stockRecord of stockResult.rows) {
        const insertQuery = `
          INSERT INTO released_blood (
            rb_serial_id, rb_blood_type, rb_rh_factor, rb_volume,
            rb_timestamp, rb_expiration_date, rb_status, rb_created_at, 
            rb_released_at, rb_category, rb_original_id,
            rb_receiving_facility, rb_address, rb_contact_number,
            rb_classification, rb_authorized_recipient, rb_recipient_designation,
            rb_date_of_release, rb_condition_upon_release, rb_request_reference,
            rb_released_by, rb_source
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
          RETURNING rb_id
        `;

        const values = [
          stockRecord.bs_serial_id,
          stockRecord.bs_blood_type,
          stockRecord.bs_rh_factor,
          stockRecord.bs_volume,
          stockRecord.bs_timestamp,
          stockRecord.bs_expiration_date,
          "Released",
          stockRecord.bs_created_at,
          "Red Blood Cell",
          stockRecord.bs_id,
          releaseData.receivingFacility || "",
          releaseData.address || "",
          releaseData.contactNumber || "",
          releaseData.classification || "",
          releaseData.authorizedRecipient || "",
          releaseData.recipientDesignation || "",
          releaseData.dateOfRelease
            ? new Date(releaseData.dateOfRelease)
            : new Date(),
          releaseData.conditionUponRelease || "",
          releaseData.requestReference || "",
          releaseData.releasedBy || "",
          stockRecord.bs_source || "Walk-In",
        ];

        const insertResult = await client.query(insertQuery, values);
        releasedBloodIds.push(insertResult.rows[0].rb_id);
      }

      const deleteQuery = `
        DELETE FROM blood_stock 
        WHERE bs_serial_id = ANY($1) AND bs_category = 'Red Blood Cell' AND bs_status = 'Stored'
      `;
      await client.query(deleteQuery, [releaseData.serialIds]);

      const invoiceResult = await this.generateInvoiceWithClient(
        client,
        releaseData,
        releasedBloodIds
      );

      await client.query("COMMIT");
      return {
        success: true,
        releasedCount: stockResult.rows.length,
        invoiceId: invoiceResult.invoiceId,
        invoiceDbId: invoiceResult.invoiceDbId,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error releasing blood stock:", error);
      throw error;
    } finally {
      client.release();
    }
  },

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
          rb_released_by as releasedBy,
          rb_source as source
        FROM released_blood 
        WHERE rb_category = 'Red Blood Cell'
        ORDER BY rb_released_at DESC
      `;

      const result = await pool.query(query);
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error fetching released blood stock:", error);
      throw error;
    }
  },

  async releasePlasmaStock(releaseData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const getStockQuery = `
        SELECT * FROM blood_stock 
        WHERE bs_serial_id = ANY($1) AND bs_category = 'Plasma' AND bs_status = 'Stored'
      `;
      const stockResult = await client.query(getStockQuery, [
        releaseData.serialIds,
      ]);

      if (stockResult.rows.length === 0) {
        throw new Error("No valid plasma stock records found for release");
      }

      const releasedBloodIds = [];

      for (const stockRecord of stockResult.rows) {
        const insertQuery = `
          INSERT INTO released_blood (
            rb_serial_id, rb_blood_type, rb_rh_factor, rb_volume,
            rb_timestamp, rb_expiration_date, rb_status, rb_created_at, 
            rb_released_at, rb_category, rb_original_id,
            rb_receiving_facility, rb_address, rb_contact_number,
            rb_classification, rb_authorized_recipient, rb_recipient_designation,
            rb_date_of_release, rb_condition_upon_release, rb_request_reference,
            rb_released_by, rb_source
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
          RETURNING rb_id
        `;

        const values = [
          stockRecord.bs_serial_id,
          stockRecord.bs_blood_type,
          stockRecord.bs_rh_factor,
          stockRecord.bs_volume,
          stockRecord.bs_timestamp,
          stockRecord.bs_expiration_date,
          "Released",
          stockRecord.bs_created_at,
          "Plasma",
          stockRecord.bs_id,
          releaseData.receivingFacility || "",
          releaseData.address || "",
          releaseData.contactNumber || "",
          releaseData.classification || "",
          releaseData.authorizedRecipient || "",
          releaseData.recipientDesignation || "",
          releaseData.dateOfRelease
            ? new Date(releaseData.dateOfRelease)
            : new Date(),
          releaseData.conditionUponRelease || "",
          releaseData.requestReference || "",
          releaseData.releasedBy || "",
          stockRecord.bs_source || "Walk-In", // FIXED: Use actual source
        ];

        const insertResult = await client.query(insertQuery, values);
        releasedBloodIds.push(insertResult.rows[0].rb_id);
      }

      const deleteQuery = `
        DELETE FROM blood_stock 
        WHERE bs_serial_id = ANY($1) AND bs_category = 'Plasma' AND bs_status = 'Stored'
      `;
      await client.query(deleteQuery, [releaseData.serialIds]);

      const invoiceResult = await this.generateInvoiceWithClient(
        client,
        releaseData,
        releasedBloodIds
      );

      await client.query("COMMIT");
      return {
        success: true,
        releasedCount: stockResult.rows.length,
        invoiceId: invoiceResult.invoiceId,
        invoiceDbId: invoiceResult.invoiceDbId,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error releasing plasma stock:", error);
      throw error;
    } finally {
      client.release();
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
          bs_category as category,
          bs_source as source  -- THIS LINE WAS MISSING
        FROM blood_stock 
        WHERE bs_category = 'Platelet'
        ORDER BY bs_created_at DESC
      `;

      const result = await pool.query(query);
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error fetching platelet stock:", error);
      throw error;
    }
  },

  async addPlateletStock(plateletData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const query = `
        INSERT INTO blood_stock (
          bs_serial_id, bs_blood_type, bs_rh_factor, bs_volume,
          bs_timestamp, bs_expiration_date, bs_status, bs_created_at, bs_category, bs_source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9)
        RETURNING bs_id
      `;

      const values = [
        plateletData.serial_id,
        plateletData.type,
        plateletData.rhFactor,
        parseInt(plateletData.volume),
        new Date(plateletData.collection),
        new Date(plateletData.expiration),
        plateletData.status || "Stored",
        "Platelet",
        plateletData.source || "Walk-In",
      ];

      const result = await client.query(query, values);
      const stockId = result.rows[0].bs_id;

      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error adding platelet stock:", error);
      throw error;
    } finally {
      client.release();
    }
  },
  async updatePlateletStock(id, plateletData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

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
          bs_category = $9,
          bs_source = $10 
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
        plateletData.status || "Stored",
        "Platelet",
        plateletData.source || "Walk-In",
      ];

      await client.query(query, values);

      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error updating platelet stock:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  async deletePlateletStock(ids) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Get records before deletion
      const getRecordsQuery = `
        SELECT bs_id, bs_serial_id, bs_blood_type, bs_rh_factor, bs_volume,
               bs_timestamp, bs_expiration_date, bs_status, bs_source
        FROM blood_stock 
        WHERE bs_id = ANY($1) AND bs_category = 'Platelet'
      `;
      const records = await client.query(getRecordsQuery, [ids]);

      const query =
        "DELETE FROM blood_stock WHERE bs_id = ANY($1) AND bs_category = 'Platelet'";
      await client.query(query, [ids]);

      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error deleting platelet stock:", error);
      throw error;
    } finally {
      client.release();
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
          bs_source as source,
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
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error searching platelet stock:", error);
      throw error;
    }
  },

  // ========== PLATELET RELEASE METHODS ==========

  // Get platelet stock by serial ID for release with search functionality
  async getPlateletStockBySerialId(serialId) {
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
        bs_source as source,  -- ADD THIS LINE
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
          bs_source as source,  -- ADD THIS LINE
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
      console.error("Error fetching platelet stock by serial ID:", error);
      throw error;
    }
  },

  // Release platelet stock - moves records from blood_stock to released_blood
  async releasePlateletStock(releaseData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const getStockQuery = `
      SELECT * FROM blood_stock 
      WHERE bs_serial_id = ANY($1) AND bs_category = 'Platelet' AND bs_status = 'Stored'
    `;
      const stockResult = await client.query(getStockQuery, [
        releaseData.serialIds,
      ]);

      if (stockResult.rows.length === 0) {
        throw new Error("No valid platelet stock records found for release");
      }

      const releasedBloodIds = [];

      for (const stockRecord of stockResult.rows) {
        const insertQuery = `
        INSERT INTO released_blood (
          rb_serial_id, rb_blood_type, rb_rh_factor, rb_volume,
          rb_timestamp, rb_expiration_date, rb_status, rb_created_at, 
          rb_released_at, rb_category, rb_original_id,
          rb_receiving_facility, rb_address, rb_contact_number,
          rb_classification, rb_authorized_recipient, rb_recipient_designation,
          rb_date_of_release, rb_condition_upon_release, rb_request_reference,
          rb_released_by, rb_source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        RETURNING rb_id
      `;

        const values = [
          stockRecord.bs_serial_id,
          stockRecord.bs_blood_type,
          stockRecord.bs_rh_factor,
          stockRecord.bs_volume,
          stockRecord.bs_timestamp,
          stockRecord.bs_expiration_date,
          "Released",
          stockRecord.bs_created_at,
          "Platelet",
          stockRecord.bs_id,
          releaseData.receivingFacility || "",
          releaseData.address || "",
          releaseData.contactNumber || "",
          releaseData.classification || "",
          releaseData.authorizedRecipient || "",
          releaseData.recipientDesignation || "",
          releaseData.dateOfRelease
            ? new Date(releaseData.dateOfRelease)
            : new Date(),
          releaseData.conditionUponRelease || "",
          releaseData.requestReference || "",
          releaseData.releasedBy || "",
          stockRecord.bs_source || "Walk-In", // FIXED: Use actual source
        ];

        const insertResult = await client.query(insertQuery, values);
        releasedBloodIds.push(insertResult.rows[0].rb_id);
      }

      const deleteQuery = `
      DELETE FROM blood_stock 
      WHERE bs_serial_id = ANY($1) AND bs_category = 'Platelet' AND bs_status = 'Stored'
    `;
      await client.query(deleteQuery, [releaseData.serialIds]);

      const invoiceResult = await this.generateInvoiceWithClient(
        client,
        releaseData,
        releasedBloodIds
      );

      await client.query("COMMIT");
      return {
        success: true,
        releasedCount: stockResult.rows.length,
        invoiceId: invoiceResult.invoiceId,
        invoiceDbId: invoiceResult.invoiceDbId,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error releasing platelet stock:", error);
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
      return result.rows.map((row) => ({
        ...row,
        selected: false, // Add selection state for UI
      }));
    } catch (error) {
      console.error("Error fetching released platelet stock:", error);
      throw error;
    }
  },

  // ========== PLASMA METHODS ==========

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
        bs_category as category,
        bs_source as source
      FROM blood_stock 
      WHERE bs_category = 'Plasma' AND bs_status = 'Stored'
      ORDER BY bs_created_at DESC
    `;

      const result = await pool.query(query);
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error fetching plasma stock:", error);
      throw error;
    }
  },

  // Get plasma stock by serial ID for release with search functionality
  async getPlasmaStockBySerialId(serialId) {
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
        bs_category as category,
        bs_source as source
      FROM blood_stock 
      WHERE bs_serial_id = $1 AND bs_category = 'Plasma' AND bs_status = 'Stored'
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
          bs_category as category,
          bs_source as source
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
      console.error("Error fetching plasma stock by serial ID:", error);
      throw error;
    }
  },

  async addPlasmaStock(plasmaData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const query = `
      INSERT INTO blood_stock (
        bs_serial_id, bs_blood_type, bs_rh_factor, bs_volume,
        bs_timestamp, bs_expiration_date, bs_status, bs_created_at, bs_category, bs_source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9)
      RETURNING bs_id
    `;

      const values = [
        plasmaData.serial_id,
        plasmaData.type,
        plasmaData.rhFactor,
        parseInt(plasmaData.volume),
        new Date(plasmaData.collection),
        new Date(plasmaData.expiration),
        plasmaData.status || "Stored",
        "Plasma",
        plasmaData.source || "Walk-In",
      ];

      const result = await client.query(query, values);
      const stockId = result.rows[0].bs_id;

      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error adding plasma stock:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  async updatePlasmaStock(id, plasmaData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

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
        bs_category = $9,
        bs_source = $10
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
        plasmaData.status || "Stored",
        "Plasma",
        plasmaData.source || "Walk-In",
      ];

      await client.query(query, values);

      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error updating plasma stock:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  async deletePlasmaStock(ids) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Get records before deletion
      const getRecordsQuery = `
      SELECT bs_id, bs_serial_id, bs_blood_type, bs_rh_factor, bs_volume,
             bs_timestamp, bs_expiration_date, bs_status, bs_source
      FROM blood_stock 
      WHERE bs_id = ANY($1) AND bs_category = 'Plasma'
    `;
      const records = await client.query(getRecordsQuery, [ids]);

      const query =
        "DELETE FROM blood_stock WHERE bs_id = ANY($1) AND bs_category = 'Plasma'";
      await client.query(query, [ids]);

      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error deleting plasma stock:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Delete plasma stock records
  async deletePlasmaStock(ids) {
    try {
      const query =
        "DELETE FROM blood_stock WHERE bs_id = ANY($1) AND bs_category = 'Plasma'";
      await pool.query(query, [ids]);
      return true;
    } catch (error) {
      console.error("Error deleting plasma stock:", error);
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
        bs_category as category,
        bs_source as source
      FROM blood_stock 
      WHERE 
        bs_category = 'Plasma' AND bs_status = 'Stored' AND (
          bs_serial_id ILIKE $1 OR 
          bs_blood_type ILIKE $1 OR 
          bs_status ILIKE $1 OR
          bs_rh_factor ILIKE $1 OR
          bs_source ILIKE $1
        )
      ORDER BY bs_created_at DESC
    `;

      const result = await pool.query(query, [`%${searchTerm}%`]);
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error searching plasma stock:", error);
      throw error;
    }
  },

  // ========== RELEASE PLASMA STOCK METHODS ==========

  // Release plasma stock - moves records from blood_stock to released_blood
  async releasePlasmaStock(releaseData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const getStockQuery = `
      SELECT * FROM blood_stock 
      WHERE bs_serial_id = ANY($1) AND bs_category = 'Plasma' AND bs_status = 'Stored'
    `;
      const stockResult = await client.query(getStockQuery, [
        releaseData.serialIds,
      ]);

      if (stockResult.rows.length === 0) {
        throw new Error("No valid plasma stock records found for release");
      }

      const releasedBloodIds = [];

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
        RETURNING rb_id
      `;

        const values = [
          stockRecord.bs_serial_id,
          stockRecord.bs_blood_type,
          stockRecord.bs_rh_factor,
          stockRecord.bs_volume,
          stockRecord.bs_timestamp,
          stockRecord.bs_expiration_date,
          "Released",
          stockRecord.bs_created_at,
          "Plasma",
          stockRecord.bs_id,
          releaseData.receivingFacility || "",
          releaseData.address || "",
          releaseData.contactNumber || "",
          releaseData.classification || "",
          releaseData.authorizedRecipient || "",
          releaseData.recipientDesignation || "",
          releaseData.dateOfRelease
            ? new Date(releaseData.dateOfRelease)
            : new Date(),
          releaseData.conditionUponRelease || "",
          releaseData.requestReference || "",
          releaseData.releasedBy || "",
        ];

        const insertResult = await client.query(insertQuery, values);
        releasedBloodIds.push(insertResult.rows[0].rb_id);
      }

      const deleteQuery = `
      DELETE FROM blood_stock 
      WHERE bs_serial_id = ANY($1) AND bs_category = 'Plasma' AND bs_status = 'Stored'
    `;
      await client.query(deleteQuery, [releaseData.serialIds]);

      // Generate invoice with the released blood IDs using the transaction client
      const invoiceResult = await this.generateInvoiceWithClient(
        client,
        releaseData,
        releasedBloodIds
      );

      await client.query("COMMIT");
      return {
        success: true,
        releasedCount: stockResult.rows.length,
        invoiceId: invoiceResult.invoiceId,
        invoiceDbId: invoiceResult.invoiceDbId,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error releasing plasma stock:", error);
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
      return result.rows.map((row) => ({
        ...row,
        selected: false, // Add selection state for UI
      }));
    } catch (error) {
      console.error("Error fetching released plasma stock:", error);
      throw error;
    }
  },

  // ========== DONOR RECORD METHODS ==========

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
        return "DNR-0001-ON";
      }

      const lastId = result.rows[0].dr_donor_id;
      const numberPart = parseInt(lastId.split("-")[1]);
      const nextNumber = (numberPart + 1).toString().padStart(4, "0");

      return `DNR-${nextNumber}-ON`;
    } catch (error) {
      console.error("Error generating donor ID:", error);
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
        rb_source = $9,
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
        bloodData.status || "Released",
        bloodData.source || "Walk-In",
      ];

      await pool.query(query, values);
      return true;
    } catch (error) {
      console.error("Error updating released blood stock:", error);
      throw error;
    }
  },

  // Delete released RBC records
  async deleteReleasedBloodStock(ids) {
    try {
      const query =
        "DELETE FROM released_blood WHERE rb_id = ANY($1) AND rb_category = 'Red Blood Cell'";
      await pool.query(query, [ids]);
      return true;
    } catch (error) {
      console.error("Error deleting released blood stock:", error);
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
        plasmaData.status || "Released",
      ];

      await pool.query(query, values);
      return true;
    } catch (error) {
      console.error("Error updating released plasma stock:", error);
      throw error;
    }
  },

  // Delete released Plasma records
  async deleteReleasedPlasmaStock(ids) {
    try {
      const query =
        "DELETE FROM released_blood WHERE rb_id = ANY($1) AND rb_category = 'Plasma'";
      await pool.query(query, [ids]);
      return true;
    } catch (error) {
      console.error("Error deleting released plasma stock:", error);
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
        plateletData.status || "Released",
      ];

      await pool.query(query, values);
      return true;
    } catch (error) {
      console.error("Error updating released platelet stock:", error);
      throw error;
    }
  },

  // Delete released Platelet records
  async deleteReleasedPlateletStock(ids) {
    try {
      const query =
        "DELETE FROM released_blood WHERE rb_id = ANY($1) AND rb_category = 'Platelet'";
      await pool.query(query, [ids]);
      return true;
    } catch (error) {
      console.error("Error deleting released platelet stock:", error);
      throw error;
    }
  },

  // ========== RESTORE BLOOD STOCK METHODS ==========

  // Restore RBC from released_blood back to blood_stock
  async restoreBloodStock(serialIds) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Get the released blood records
      const getReleasedQuery = `
      SELECT * FROM released_blood 
      WHERE rb_serial_id = ANY($1) AND rb_category = 'Red Blood Cell'
    `;
      const releasedResult = await client.query(getReleasedQuery, [serialIds]);

      if (releasedResult.rows.length === 0) {
        throw new Error("No released blood records found to restore");
      }

      let restoredCount = 0;
      const serialIdsToDelete = [];

      // Insert back into blood_stock with status 'Stored'
      for (const record of releasedResult.rows) {
        // Check if serial ID already exists in blood_stock
        const checkExistingQuery = `
        SELECT bs_id FROM blood_stock WHERE bs_serial_id = $1
      `;
        const existingResult = await client.query(checkExistingQuery, [
          record.rb_serial_id,
        ]);

        if (existingResult.rows.length > 0) {
          console.warn(
            `Serial ID ${record.rb_serial_id} already exists in blood_stock, will only remove from released_blood`
          );
          serialIdsToDelete.push(record.rb_serial_id);
          continue;
        }

        const insertQuery = `
        INSERT INTO blood_stock (
          bs_serial_id, bs_blood_type, bs_rh_factor, bs_volume,
          bs_timestamp, bs_expiration_date, bs_status, bs_created_at, bs_category, bs_source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;

        const values = [
          record.rb_serial_id,
          record.rb_blood_type,
          record.rb_rh_factor,
          record.rb_volume,
          record.rb_timestamp,
          record.rb_expiration_date,
          "Stored",
          record.rb_created_at,
          "Red Blood Cell",
          record.rb_source || "Walk-In",
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

      await client.query("COMMIT");
      return { success: true, restoredCount: restoredCount };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error restoring blood stock:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Restore Plasma from released_blood back to blood_stock
  async restorePlasmaStock(serialIds) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const getReleasedQuery = `
      SELECT * FROM released_blood 
      WHERE rb_serial_id = ANY($1) AND rb_category = 'Plasma'
    `;
      const releasedResult = await client.query(getReleasedQuery, [serialIds]);

      if (releasedResult.rows.length === 0) {
        throw new Error("No released plasma records found to restore");
      }

      let restoredCount = 0;
      const serialIdsToDelete = [];

      for (const record of releasedResult.rows) {
        // Check if serial ID already exists in blood_stock
        const checkExistingQuery = `
        SELECT bs_id FROM blood_stock WHERE bs_serial_id = $1
      `;
        const existingResult = await client.query(checkExistingQuery, [
          record.rb_serial_id,
        ]);

        if (existingResult.rows.length > 0) {
          console.warn(
            `Serial ID ${record.rb_serial_id} already exists in blood_stock, will only remove from released_blood`
          );
          serialIdsToDelete.push(record.rb_serial_id);
          continue;
        }

        const insertQuery = `
        INSERT INTO blood_stock (
          bs_serial_id, bs_blood_type, bs_rh_factor, bs_volume,
          bs_timestamp, bs_expiration_date, bs_status, bs_created_at, bs_category, bs_source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;

        const values = [
          record.rb_serial_id,
          record.rb_blood_type,
          record.rb_rh_factor,
          record.rb_volume,
          record.rb_timestamp,
          record.rb_expiration_date,
          "Stored",
          record.rb_created_at,
          "Plasma",
          record.rb_source || "Walk-In",
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

      await client.query("COMMIT");
      return { success: true, restoredCount: restoredCount };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error restoring plasma stock:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Restore Platelet from released_blood back to blood_stock
  async restorePlateletStock(serialIds) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const getReleasedQuery = `
      SELECT * FROM released_blood 
      WHERE rb_serial_id = ANY($1) AND rb_category = 'Platelet'
    `;
      const releasedResult = await client.query(getReleasedQuery, [serialIds]);

      if (releasedResult.rows.length === 0) {
        throw new Error("No released platelet records found to restore");
      }

      let restoredCount = 0;
      const serialIdsToDelete = [];

      for (const record of releasedResult.rows) {
        // Check if serial ID already exists in blood_stock
        const checkExistingQuery = `
        SELECT bs_id FROM blood_stock WHERE bs_serial_id = $1
      `;
        const existingResult = await client.query(checkExistingQuery, [
          record.rb_serial_id,
        ]);

        if (existingResult.rows.length > 0) {
          console.warn(
            `Serial ID ${record.rb_serial_id} already exists in blood_stock, will only remove from released_blood`
          );
          serialIdsToDelete.push(record.rb_serial_id);
          continue;
        }

        const insertQuery = `
        INSERT INTO blood_stock (
          bs_serial_id, bs_blood_type, bs_rh_factor, bs_volume,
          bs_timestamp, bs_expiration_date, bs_status, bs_created_at, bs_category, bs_source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;

        const values = [
          record.rb_serial_id,
          record.rb_blood_type,
          record.rb_rh_factor,
          record.rb_volume,
          record.rb_timestamp,
          record.rb_expiration_date,
          "Stored",
          record.rb_created_at,
          "Platelet",
          record.rb_source || "Walk-In",
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

      await client.query("COMMIT");
      return { success: true, restoredCount: restoredCount };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error restoring platelet stock:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  // ========== NON-CONFORMING METHODS ==========

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
          nc_category as category,
          nc_source as source
        FROM non_conforming 
        WHERE nc_category = 'Red Blood Cell'
        ORDER BY nc_created_at DESC
      `;

      const result = await pool.query(query);
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error fetching non-conforming records:", error);
      throw error;
    }
  },

  async getBloodStockBySerialIdForNC(serialId) {
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
          bs_category as category,
          bs_source as source
        FROM blood_stock 
        WHERE bs_serial_id = $1 
          AND bs_status = 'Stored'
          AND bs_category = 'Red Blood Cell'
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
            bs_category as category,
            bs_source as source
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
      console.error("Error fetching blood stock by serial ID for NC:", error);
      throw error;
    }
  },

  async transferToNonConforming(serialIds) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const getStockQuery = `
        SELECT * FROM blood_stock 
        WHERE bs_serial_id = ANY($1) 
          AND bs_status = 'Stored'
          AND bs_category = 'Red Blood Cell'
      `;
      const stockResult = await client.query(getStockQuery, [serialIds]);

      if (stockResult.rows.length === 0) {
        throw new Error(
          "No valid Red Blood Cell stock records found for transfer to non-conforming"
        );
      }

      let transferredCount = 0;
      const serialIdsToDelete = [];

      for (const stockRecord of stockResult.rows) {
        const checkExistingQuery = `
          SELECT nc_id FROM non_conforming WHERE nc_serial_id = $1
        `;
        const existingResult = await client.query(checkExistingQuery, [
          stockRecord.bs_serial_id,
        ]);

        if (existingResult.rows.length > 0) {
          console.warn(
            `Serial ID ${stockRecord.bs_serial_id} already exists in non_conforming, skipping`
          );
          continue;
        }

        const insertQuery = `
          INSERT INTO non_conforming (
            nc_serial_id, nc_blood_type, nc_rh_factor, nc_volume,
            nc_timestamp, nc_expiration_date, nc_status, nc_created_at, nc_category, nc_source
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `;

        const values = [
          stockRecord.bs_serial_id,
          stockRecord.bs_blood_type,
          stockRecord.bs_rh_factor,
          stockRecord.bs_volume,
          stockRecord.bs_timestamp,
          stockRecord.bs_expiration_date,
          "Non-Conforming",
          stockRecord.bs_created_at,
          "Red Blood Cell",
          stockRecord.bs_source || "Walk-In",
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
            AND bs_category = 'Red Blood Cell'
        `;
        await client.query(deleteQuery, [serialIdsToDelete]);
      }

      await client.query("COMMIT");
      return { success: true, transferredCount: transferredCount };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error transferring to non-conforming:", error);
      throw error;
    } finally {
      client.release();
    }
  },

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
          nc_category = $9,
          nc_source = $10
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
        "Non-Conforming",
        "Red Blood Cell",
        ncData.source || "Walk-In", // ENSURE THIS IS HERE
      ];

      await pool.query(query, values);
      return true;
    } catch (error) {
      console.error("Error updating non-conforming record:", error);
      throw error;
    }
  },

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
          nc_category as category,
          nc_source as source
        FROM non_conforming 
        WHERE nc_category = 'Red Blood Cell'
          AND (
            nc_serial_id ILIKE $1 OR 
            nc_blood_type ILIKE $1 OR 
            nc_status ILIKE $1 OR
            nc_rh_factor ILIKE $1 OR
            nc_source ILIKE $1
          )
        ORDER BY nc_created_at DESC
      `;

      const result = await pool.query(query, [`%${searchTerm}%`]);
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error searching non-conforming records:", error);
      throw error;
    }
  },

  // Delete non-conforming records
  async deleteNonConforming(ids) {
    try {
      const query =
        "DELETE FROM non_conforming WHERE nc_id = ANY($1) AND nc_category = 'Red Blood Cell'";
      await pool.query(query, [ids]);
      return true;
    } catch (error) {
      console.error("Error deleting non-conforming records:", error);
      throw error;
    }
  },
  // Discard non-conforming stock (RED BLOOD CELL ONLY)
  async discardNonConformingStock(discardData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const getNonConformingQuery = `
      SELECT * FROM non_conforming 
      WHERE nc_serial_id = ANY($1) AND nc_category = 'Red Blood Cell'
    `;
      const ncResult = await client.query(getNonConformingQuery, [
        discardData.serialIds,
      ]);

      if (ncResult.rows.length === 0) {
        throw new Error(
          "No valid non-conforming Red Blood Cell records found for discard"
        );
      }

      let discardedCount = 0;
      const serialIdsToDelete = [];
      const discardedBloodIds = []; // Track discarded blood IDs

      for (const ncRecord of ncResult.rows) {
        const checkExistingQuery = `
        SELECT db_id FROM discarded_blood WHERE db_serial_id = $1
      `;
        const existingResult = await client.query(checkExistingQuery, [
          ncRecord.nc_serial_id,
        ]);

        if (existingResult.rows.length > 0) {
          console.warn(
            `Serial ID ${ncRecord.nc_serial_id} already exists in discarded_blood, skipping`
          );
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
        RETURNING db_id
      `;

        const values = [
          ncRecord.nc_serial_id,
          ncRecord.nc_blood_type,
          ncRecord.nc_rh_factor,
          ncRecord.nc_volume,
          ncRecord.nc_timestamp,
          ncRecord.nc_expiration_date,
          "Discarded",
          ncRecord.nc_created_at,
          "Red Blood Cell",
          ncRecord.nc_id,
          discardData.responsiblePersonnel,
          discardData.reasonForDiscarding,
          discardData.authorizedBy,
          new Date(discardData.dateOfDiscard),
          discardData.timeOfDiscard,
          discardData.methodOfDisposal,
          discardData.remarks || "",
        ];

        const insertResult = await client.query(insertQuery, values);
        discardedBloodIds.push(insertResult.rows[0].db_id); // Store the ID
        discardedCount++;
        serialIdsToDelete.push(ncRecord.nc_serial_id);
      }

      if (serialIdsToDelete.length > 0) {
        const deleteQuery = `
        DELETE FROM non_conforming 
        WHERE nc_serial_id = ANY($1) AND nc_category = 'Red Blood Cell'
      `;
        await client.query(deleteQuery, [serialIdsToDelete]);
      }

      // Generate invoice with the discarded blood IDs
      const invoiceResult = await this.generateDiscardedInvoiceWithClient(
        client,
        discardData,
        discardedBloodIds
      );

      await client.query("COMMIT");
      return {
        success: true,
        discardedCount: discardedCount,
        invoiceId: invoiceResult.invoiceId,
        invoiceDbId: invoiceResult.invoiceDbId,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error discarding non-conforming stock:", error);
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
        nc_category as category,
        nc_source as source  -- ADD THIS LINE (it was missing)
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
          nc_category as category,
          nc_source as source  -- ADD THIS LINE (it was missing)
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
      console.error(
        "Error fetching non-conforming stock by serial ID for discard:",
        error
      );
      throw error;
    }
  },

  async discardPlateletNonConformingStock(discardData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const getNonConformingQuery = `
      SELECT * FROM non_conforming 
      WHERE nc_serial_id = ANY($1) AND nc_category = 'Platelet'
    `;
      const ncResult = await client.query(getNonConformingQuery, [
        discardData.serialIds,
      ]);

      if (ncResult.rows.length === 0) {
        throw new Error(
          "No valid platelet non-conforming records found for discard"
        );
      }

      let discardedCount = 0;
      const serialIdsToDelete = [];
      const discardedBloodIds = []; // Track discarded blood IDs

      for (const ncRecord of ncResult.rows) {
        const checkExistingQuery = `
        SELECT db_id FROM discarded_blood WHERE db_serial_id = $1
      `;
        const existingResult = await client.query(checkExistingQuery, [
          ncRecord.nc_serial_id,
        ]);

        if (existingResult.rows.length > 0) {
          console.warn(
            `Serial ID ${ncRecord.nc_serial_id} already exists in discarded_blood, skipping`
          );
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
        RETURNING db_id
      `;

        const values = [
          ncRecord.nc_serial_id,
          ncRecord.nc_blood_type,
          ncRecord.nc_rh_factor,
          ncRecord.nc_volume,
          ncRecord.nc_timestamp,
          ncRecord.nc_expiration_date,
          "Discarded",
          ncRecord.nc_created_at,
          "Platelet",
          ncRecord.nc_id,
          discardData.responsiblePersonnel,
          discardData.reasonForDiscarding,
          discardData.authorizedBy,
          new Date(discardData.dateOfDiscard),
          discardData.timeOfDiscard,
          discardData.methodOfDisposal,
          discardData.remarks || "",
        ];

        const insertResult = await client.query(insertQuery, values);
        discardedBloodIds.push(insertResult.rows[0].db_id); // Store the ID
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

      // Generate invoice with the discarded blood IDs
      const invoiceResult = await this.generateDiscardedInvoiceWithClient(
        client,
        discardData,
        discardedBloodIds
      );

      await client.query("COMMIT");
      return {
        success: true,
        discardedCount: discardedCount,
        invoiceId: invoiceResult.invoiceId,
        invoiceDbId: invoiceResult.invoiceDbId,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error discarding platelet non-conforming stock:", error);
      throw error;
    } finally {
      client.release();
    }
  },
  async discardPlasmaNonConformingStock(discardData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const getNonConformingQuery = `
      SELECT * FROM non_conforming 
      WHERE nc_serial_id = ANY($1) AND nc_category = 'Plasma'
    `;
      const ncResult = await client.query(getNonConformingQuery, [
        discardData.serialIds,
      ]);

      if (ncResult.rows.length === 0) {
        throw new Error(
          "No valid plasma non-conforming records found for discard"
        );
      }

      let discardedCount = 0;
      const serialIdsToDelete = [];
      const discardedBloodIds = []; // Track discarded blood IDs

      for (const ncRecord of ncResult.rows) {
        const checkExistingQuery = `
        SELECT db_id FROM discarded_blood WHERE db_serial_id = $1
      `;
        const existingResult = await client.query(checkExistingQuery, [
          ncRecord.nc_serial_id,
        ]);

        if (existingResult.rows.length > 0) {
          console.warn(
            `Serial ID ${ncRecord.nc_serial_id} already exists in discarded_blood, skipping`
          );
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
        RETURNING db_id
      `;

        const values = [
          ncRecord.nc_serial_id,
          ncRecord.nc_blood_type,
          ncRecord.nc_rh_factor,
          ncRecord.nc_volume,
          ncRecord.nc_timestamp,
          ncRecord.nc_expiration_date,
          "Discarded",
          ncRecord.nc_created_at,
          "Plasma",
          ncRecord.nc_id,
          discardData.responsiblePersonnel,
          discardData.reasonForDiscarding,
          discardData.authorizedBy,
          new Date(discardData.dateOfDiscard),
          discardData.timeOfDiscard,
          discardData.methodOfDisposal,
          discardData.remarks || "",
        ];

        const insertResult = await client.query(insertQuery, values);
        discardedBloodIds.push(insertResult.rows[0].db_id); // Store the ID
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

      // Generate invoice with the discarded blood IDs
      const invoiceResult = await this.generateDiscardedInvoiceWithClient(
        client,
        discardData,
        discardedBloodIds
      );

      await client.query("COMMIT");
      return {
        success: true,
        discardedCount: discardedCount,
        invoiceId: invoiceResult.invoiceId,
        invoiceDbId: invoiceResult.invoiceDbId,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error discarding plasma non-conforming stock:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Search non-conforming records for discard modal (RED BLOOD CELL ONLY)
  // Search non-conforming records for discard modal (RED BLOOD CELL ONLY)
  async discardNonConformingStock(discardData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const getNonConformingQuery = `
      SELECT * FROM non_conforming 
      WHERE nc_serial_id = ANY($1) AND nc_category = 'Red Blood Cell'
    `;
      const ncResult = await client.query(getNonConformingQuery, [
        discardData.serialIds,
      ]);

      if (ncResult.rows.length === 0) {
        throw new Error(
          "No valid non-conforming Red Blood Cell records found for discard"
        );
      }

      let discardedCount = 0;
      const serialIdsToDelete = [];
      const discardedBloodIds = []; // Track discarded blood IDs

      for (const ncRecord of ncResult.rows) {
        const checkExistingQuery = `
        SELECT db_id FROM discarded_blood WHERE db_serial_id = $1
      `;
        const existingResult = await client.query(checkExistingQuery, [
          ncRecord.nc_serial_id,
        ]);

        if (existingResult.rows.length > 0) {
          console.warn(
            `Serial ID ${ncRecord.nc_serial_id} already exists in discarded_blood, skipping`
          );
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
        RETURNING db_id
      `;

        const values = [
          ncRecord.nc_serial_id,
          ncRecord.nc_blood_type,
          ncRecord.nc_rh_factor,
          ncRecord.nc_volume,
          ncRecord.nc_timestamp,
          ncRecord.nc_expiration_date,
          "Discarded",
          ncRecord.nc_created_at,
          "Red Blood Cell",
          ncRecord.nc_id,
          discardData.responsiblePersonnel,
          discardData.reasonForDiscarding,
          discardData.authorizedBy,
          new Date(discardData.dateOfDiscard),
          discardData.timeOfDiscard,
          discardData.methodOfDisposal,
          discardData.remarks || "",
        ];

        const insertResult = await client.query(insertQuery, values);
        discardedBloodIds.push(insertResult.rows[0].db_id); // Store the ID
        discardedCount++;
        serialIdsToDelete.push(ncRecord.nc_serial_id);
      }

      if (serialIdsToDelete.length > 0) {
        const deleteQuery = `
        DELETE FROM non_conforming 
        WHERE nc_serial_id = ANY($1) AND nc_category = 'Red Blood Cell'
      `;
        await client.query(deleteQuery, [serialIdsToDelete]);
      }

      // Generate invoice with the discarded blood IDs
      const invoiceResult = await this.generateDiscardedInvoiceWithClient(
        client,
        discardData,
        discardedBloodIds
      );

      await client.query("COMMIT");
      return {
        success: true,
        discardedCount: discardedCount,
        invoiceId: invoiceResult.invoiceId,
        invoiceDbId: invoiceResult.invoiceDbId,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error discarding non-conforming stock:", error);
      throw error;
    } finally {
      client.release();
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
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error fetching platelet non-conforming records:", error);
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
      console.error(
        "Error fetching platelet stock by serial ID for NC:",
        error
      );
      throw error;
    }
  },

  // Transfer platelet stock to non-conforming
  async transferPlateletToNonConforming(serialIds) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const getStockQuery = `
        SELECT * FROM blood_stock 
        WHERE bs_serial_id = ANY($1) 
          AND bs_status = 'Stored'
          AND bs_category = 'Platelet'
      `;
      const stockResult = await client.query(getStockQuery, [serialIds]);

      if (stockResult.rows.length === 0) {
        throw new Error(
          "No valid Platelet stock records found for transfer to non-conforming"
        );
      }

      let transferredCount = 0;
      const serialIdsToDelete = [];

      for (const stockRecord of stockResult.rows) {
        const checkExistingQuery = `
          SELECT nc_id FROM non_conforming WHERE nc_serial_id = $1
        `;
        const existingResult = await client.query(checkExistingQuery, [
          stockRecord.bs_serial_id,
        ]);

        if (existingResult.rows.length > 0) {
          console.warn(
            `Serial ID ${stockRecord.bs_serial_id} already exists in non_conforming, skipping`
          );
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
          "Non-Conforming",
          stockRecord.bs_created_at,
          "Platelet",
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

      await client.query("COMMIT");
      return { success: true, transferredCount: transferredCount };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error transferring platelet to non-conforming:", error);
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
        "Non-Conforming",
        "Platelet",
      ];

      await pool.query(query, values);
      return true;
    } catch (error) {
      console.error("Error updating platelet non-conforming record:", error);
      throw error;
    }
  },

  // Delete platelet non-conforming records
  async deletePlateletNonConforming(ids) {
    try {
      const query =
        "DELETE FROM non_conforming WHERE nc_id = ANY($1) AND nc_category = 'Platelet'";
      await pool.query(query, [ids]);
      return true;
    } catch (error) {
      console.error("Error deleting platelet non-conforming records:", error);
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
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error searching platelet non-conforming records:", error);
      throw error;
    }
  },

  // Discard platelet non-conforming stock
  async discardPlateletNonConformingStock(discardData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const getNonConformingQuery = `
        SELECT * FROM non_conforming 
        WHERE nc_serial_id = ANY($1) AND nc_category = 'Platelet'
      `;
      const ncResult = await client.query(getNonConformingQuery, [
        discardData.serialIds,
      ]);

      if (ncResult.rows.length === 0) {
        throw new Error(
          "No valid platelet non-conforming records found for discard"
        );
      }

      let discardedCount = 0;
      const serialIdsToDelete = [];
      const discardedBloodIds = [];

      for (const ncRecord of ncResult.rows) {
        const checkExistingQuery = `
          SELECT db_id FROM discarded_blood WHERE db_serial_id = $1
        `;
        const existingResult = await client.query(checkExistingQuery, [
          ncRecord.nc_serial_id,
        ]);

        if (existingResult.rows.length > 0) {
          console.warn(
            `Serial ID ${ncRecord.nc_serial_id} already exists in discarded_blood, skipping`
          );
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
          RETURNING db_id
        `;

        const values = [
          ncRecord.nc_serial_id,
          ncRecord.nc_blood_type,
          ncRecord.nc_rh_factor,
          ncRecord.nc_volume,
          ncRecord.nc_timestamp,
          ncRecord.nc_expiration_date,
          "Discarded",
          ncRecord.nc_created_at,
          "Platelet",
          ncRecord.nc_id,
          discardData.responsiblePersonnel,
          discardData.reasonForDiscarding,
          discardData.authorizedBy,
          new Date(discardData.dateOfDiscard),
          discardData.timeOfDiscard,
          discardData.methodOfDisposal,
          discardData.remarks || "",
        ];

        const insertResult = await client.query(insertQuery, values);
        discardedBloodIds.push(insertResult.rows[0].db_id);
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

      // Generate invoice with the discarded blood IDs
      const invoiceResult = await this.generateDiscardedInvoiceWithClient(
        client,
        discardData,
        discardedBloodIds
      );

      await client.query("COMMIT");
      return {
        success: true,
        discardedCount: discardedCount,
        invoiceId: invoiceResult.invoiceId,
        invoiceDbId: invoiceResult.invoiceDbId,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error discarding platelet non-conforming stock:", error);
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
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error fetching plasma non-conforming records:", error);
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
      console.error("Error fetching plasma stock by serial ID for NC:", error);
      throw error;
    }
  },

  // Transfer plasma stock to non-conforming
  async transferPlasmaToNonConforming(serialIds) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const getStockQuery = `
        SELECT * FROM blood_stock 
        WHERE bs_serial_id = ANY($1) 
          AND bs_status = 'Stored'
          AND bs_category = 'Plasma'
      `;
      const stockResult = await client.query(getStockQuery, [serialIds]);

      if (stockResult.rows.length === 0) {
        throw new Error(
          "No valid Plasma stock records found for transfer to non-conforming"
        );
      }

      let transferredCount = 0;
      const serialIdsToDelete = [];

      for (const stockRecord of stockResult.rows) {
        const checkExistingQuery = `
          SELECT nc_id FROM non_conforming WHERE nc_serial_id = $1
        `;
        const existingResult = await client.query(checkExistingQuery, [
          stockRecord.bs_serial_id,
        ]);

        if (existingResult.rows.length > 0) {
          console.warn(
            `Serial ID ${stockRecord.bs_serial_id} already exists in non_conforming, skipping`
          );
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
          "Non-Conforming",
          stockRecord.bs_created_at,
          "Plasma",
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

      await client.query("COMMIT");
      return { success: true, transferredCount: transferredCount };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error transferring plasma to non-conforming:", error);
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
        "Non-Conforming",
        "Plasma",
      ];

      await pool.query(query, values);
      return true;
    } catch (error) {
      console.error("Error updating plasma non-conforming record:", error);
      throw error;
    }
  },

  // Delete plasma non-conforming records
  async deletePlasmaNonConforming(ids) {
    try {
      const query =
        "DELETE FROM non_conforming WHERE nc_id = ANY($1) AND nc_category = 'Plasma'";
      await pool.query(query, [ids]);
      return true;
    } catch (error) {
      console.error("Error deleting plasma non-conforming records:", error);
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
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error searching plasma non-conforming records:", error);
      throw error;
    }
  },

  // Discard plasma non-conforming stock
  async discardPlasmaNonConformingStock(discardData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const getNonConformingQuery = `
        SELECT * FROM non_conforming 
        WHERE nc_serial_id = ANY($1) AND nc_category = 'Plasma'
      `;
      const ncResult = await client.query(getNonConformingQuery, [
        discardData.serialIds,
      ]);

      if (ncResult.rows.length === 0) {
        throw new Error(
          "No valid plasma non-conforming records found for discard"
        );
      }

      let discardedCount = 0;
      const serialIdsToDelete = [];
      const discardedBloodIds = [];

      for (const ncRecord of ncResult.rows) {
        const checkExistingQuery = `
          SELECT db_id FROM discarded_blood WHERE db_serial_id = $1
        `;
        const existingResult = await client.query(checkExistingQuery, [
          ncRecord.nc_serial_id,
        ]);

        if (existingResult.rows.length > 0) {
          console.warn(
            `Serial ID ${ncRecord.nc_serial_id} already exists in discarded_blood, skipping`
          );
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
          RETURNING db_id
        `;

        const values = [
          ncRecord.nc_serial_id,
          ncRecord.nc_blood_type,
          ncRecord.nc_rh_factor,
          ncRecord.nc_volume,
          ncRecord.nc_timestamp,
          ncRecord.nc_expiration_date,
          "Discarded",
          ncRecord.nc_created_at,
          "Plasma",
          ncRecord.nc_id,
          discardData.responsiblePersonnel,
          discardData.reasonForDiscarding,
          discardData.authorizedBy,
          new Date(discardData.dateOfDiscard),
          discardData.timeOfDiscard,
          discardData.methodOfDisposal,
          discardData.remarks || "",
        ];

        const insertResult = await client.query(insertQuery, values);
        discardedBloodIds.push(insertResult.rows[0].db_id);
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

      // Generate invoice with the discarded blood IDs
      const invoiceResult = await this.generateDiscardedInvoiceWithClient(
        client,
        discardData,
        discardedBloodIds
      );

      await client.query("COMMIT");
      return {
        success: true,
        discardedCount: discardedCount,
        invoiceId: invoiceResult.invoiceId,
        invoiceDbId: invoiceResult.invoiceDbId,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error discarding plasma non-conforming stock:", error);
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

  // ========== INVOICE METHODS ==========

  // Generate invoice using existing transaction client
  async generateInvoiceWithClient(client, releaseData, releasedBloodIds) {
    try {
      // Generate invoice ID
      const invoiceIdResult = await client.query(
        "SELECT generate_invoice_id() as invoice_id"
      );
      const invoiceId = invoiceIdResult.rows[0].invoice_id;

      // Insert invoice header
      const insertInvoiceQuery = `
      INSERT INTO blood_invoices (
        bi_invoice_id, bi_receiving_facility, bi_classification,
        bi_date_of_release, bi_released_by, bi_reference_number,
        bi_prepared_by, bi_verified_by, bi_created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING bi_id
    `;

      const invoiceValues = [
        invoiceId,
        releaseData.receivingFacility || "",
        releaseData.classification || "",
        releaseData.dateOfRelease
          ? new Date(releaseData.dateOfRelease)
          : new Date(),
        releaseData.releasedBy || "",
        releaseData.requestReference || "",
        releaseData.releasedBy || "",
        releaseData.verifiedBy || "",
      ];

      const invoiceResult = await client.query(
        insertInvoiceQuery,
        invoiceValues
      );
      const invoiceDbId = invoiceResult.rows[0].bi_id;

      // Get released blood details and insert invoice items
      for (const rbId of releasedBloodIds) {
        const getReleasedBloodQuery = `
        SELECT rb_serial_id, rb_blood_type, rb_rh_factor, rb_timestamp, 
               rb_expiration_date, rb_volume
        FROM released_blood
        WHERE rb_id = $1
      `;

        const rbResult = await client.query(getReleasedBloodQuery, [rbId]);

        if (rbResult.rows.length > 0) {
          const rb = rbResult.rows[0];

          const insertItemQuery = `
          INSERT INTO blood_invoice_items (
            bii_invoice_id, bii_released_blood_id, bii_serial_id,
            bii_blood_type, bii_rh_factor, bii_date_of_collection,
            bii_date_of_expiration, bii_volume, bii_created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        `;

          await client.query(insertItemQuery, [
            invoiceDbId,
            rbId,
            rb.rb_serial_id,
            rb.rb_blood_type,
            rb.rb_rh_factor,
            rb.rb_timestamp,
            rb.rb_expiration_date,
            rb.rb_volume,
          ]);

          // Update released_blood with invoice reference
          await client.query(
            "UPDATE released_blood SET rb_invoice_id = $1 WHERE rb_id = $2",
            [invoiceDbId, rbId]
          );
        }
      }

      return { success: true, invoiceId: invoiceId, invoiceDbId: invoiceDbId };
    } catch (error) {
      console.error("Error generating invoice:", error);
      throw error;
    }
  },

  // Get all invoices with item counts
  async getAllInvoices() {
    try {
      const query = `
      SELECT 
        bi.bi_id as id,
        bi.bi_invoice_id as "invoiceId",
        bi.bi_receiving_facility as "receivingFacility",
        bi.bi_classification as classification,
        TO_CHAR(bi.bi_date_of_release, 'MM/DD/YYYY') as "dateOfRelease",
        bi.bi_released_by as "releasedBy",
        bi.bi_reference_number as "referenceNumber",
        bi.bi_prepared_by as "preparedBy",
        bi.bi_verified_by as "verifiedBy",
        TO_CHAR(bi.bi_created_at, 'MM/DD/YYYY-HH24:MI:SS') as created,
        COUNT(bii.bii_id) as "itemCount"
      FROM blood_invoices bi
      LEFT JOIN blood_invoice_items bii ON bi.bi_id = bii.bii_invoice_id
      GROUP BY bi.bi_id
      ORDER BY bi.bi_created_at DESC
    `;

      const result = await pool.query(query);
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error fetching invoices:", error);
      throw error;
    }
  },

  async getInvoiceDetails(invoiceId) {
    try {
      const headerQuery = `
      SELECT 
        bi.bi_id as id,
        bi.bi_invoice_id as "invoiceId",
        bi.bi_receiving_facility as "receivingFacility",
        bi.bi_classification as classification,
        TO_CHAR(bi.bi_date_of_release, 'MM/DD/YYYY') as "dateOfRelease",
        bi.bi_released_by as "releasedBy",
        bi.bi_reference_number as "referenceNumber",
        bi.bi_prepared_by as "preparedBy",
        bi.bi_verified_by as "verifiedBy",
        TO_CHAR(bi.bi_created_at, 'MM/DD/YYYY') as created,
        rb.rb_authorized_recipient as "authorizedRecipient"
      FROM blood_invoices bi
      LEFT JOIN blood_invoice_items bii ON bi.bi_id = bii.bii_invoice_id
      LEFT JOIN released_blood rb ON bii.bii_released_blood_id = rb.rb_id
      WHERE bi.bi_id = $1
      LIMIT 1
    `;

      const itemsQuery = `
      SELECT 
        bii_serial_id as "serialId",
        bii_blood_type as "bloodType",
        bii_rh_factor as "rhFactor",
        TO_CHAR(bii_date_of_collection, 'MM/DD/YYYY') as "dateOfCollection",
        TO_CHAR(bii_date_of_expiration, 'MM/DD/YYYY') as "dateOfExpiration",
        bii_volume as volume,
        bii_remarks as remarks
      FROM blood_invoice_items
      WHERE bii_invoice_id = $1
      ORDER BY bii_created_at
    `;

      const headerResult = await pool.query(headerQuery, [invoiceId]);
      const itemsResult = await pool.query(itemsQuery, [invoiceId]);

      if (headerResult.rows.length === 0) {
        throw new Error("Invoice not found");
      }

      return {
        header: headerResult.rows[0],
        items: itemsResult.rows,
      };
    } catch (error) {
      console.error("Error fetching invoice details:", error);
      throw error;
    }
  },

  // Search invoices
  async searchInvoices(searchTerm) {
    try {
      const query = `
      SELECT 
        bi.bi_id as id,
        bi.bi_invoice_id as "invoiceId",
        bi.bi_receiving_facility as "receivingFacility",
        bi.bi_classification as classification,
        TO_CHAR(bi.bi_date_of_release, 'MM/DD/YYYY') as "dateOfRelease",
        bi.bi_released_by as "releasedBy",
        bi.bi_reference_number as "referenceNumber",
        COUNT(bii.bii_id) as "itemCount"
      FROM blood_invoices bi
      LEFT JOIN blood_invoice_items bii ON bi.bi_id = bii.bii_invoice_id
      WHERE 
        bi.bi_invoice_id ILIKE $1 OR
        bi.bi_receiving_facility ILIKE $1 OR
        bi.bi_classification ILIKE $1 OR
        bi.bi_released_by ILIKE $1 OR
        bi.bi_reference_number ILIKE $1
      GROUP BY bi.bi_id
      ORDER BY bi.bi_created_at DESC
    `;

      const result = await pool.query(query, [`%${searchTerm}%`]);
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error searching invoices:", error);
      throw error;
    }
  },

  // Delete invoices
  async deleteInvoices(invoiceIds) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Ensure invoiceIds is an array and contains valid integers
      if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
        throw new Error("Invalid invoice IDs provided");
      }

      // Get all released_blood IDs associated with these invoices
      const getReleasedBloodQuery = `
      SELECT DISTINCT bii.bii_released_blood_id
      FROM blood_invoice_items bii
      WHERE bii.bii_invoice_id = ANY($1::integer[])
    `;
      const releasedBloodResult = await client.query(getReleasedBloodQuery, [
        invoiceIds,
      ]);
      const releasedBloodIds = releasedBloodResult.rows
        .map((row) => row.bii_released_blood_id)
        .filter((id) => id !== null);

      // Delete invoice items first (due to foreign key constraint)
      const deleteItemsQuery = `
      DELETE FROM blood_invoice_items
      WHERE bii_invoice_id = ANY($1::integer[])
    `;
      await client.query(deleteItemsQuery, [invoiceIds]);

      // Delete invoices
      const deleteInvoicesQuery = `
      DELETE FROM blood_invoices
      WHERE bi_id = ANY($1::integer[])
    `;
      const deleteResult = await client.query(deleteInvoicesQuery, [
        invoiceIds,
      ]);

      // Clear invoice reference from released_blood records
      if (releasedBloodIds.length > 0) {
        const clearInvoiceRefQuery = `
        UPDATE released_blood
        SET rb_invoice_id = NULL
        WHERE rb_id = ANY($1::integer[])
      `;
        await client.query(clearInvoiceRefQuery, [releasedBloodIds]);
      }

      await client.query("COMMIT");

      return {
        success: true,
        deletedCount: deleteResult.rowCount,
        message: `Successfully deleted ${deleteResult.rowCount} invoice(s)`,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error deleting invoices:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  // ========== DISCARDED BLOOD INVOICE METHODS ==========

  async generateDiscardedInvoiceId() {
    try {
      // Get current timestamp in the format: YYYYMMDD-HHMMSS-mmm
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const milliseconds = String(now.getMilliseconds()).padStart(3, "0");

      const timestamp = `${year}${month}${day}-${hours}${minutes}${seconds}-${milliseconds}`;

      return timestamp;
    } catch (error) {
      console.error("Error generating discarded invoice ID:", error);
      throw error;
    }
  },

  // Generate reference number for discarded invoice
  async generateDiscardedReferenceNumber(category) {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const milliseconds = String(now.getMilliseconds()).padStart(3, "0");

      // Determine category prefix
      let categoryPrefix = "RBC";
      if (category === "Platelet") {
        categoryPrefix = "PLT";
      } else if (category === "Plasma") {
        categoryPrefix = "PLS";
      }

      const datePart = `${year}${month}${day}`;
      const timePart = `${hours}${minutes}${seconds}`;
      const uniquePart = milliseconds;

      return `REF-${categoryPrefix}-${datePart}-${timePart}-${uniquePart}`;
    } catch (error) {
      console.error("Error generating discarded reference number:", error);
      throw error;
    }
  },

  // Generate discarded invoice using existing transaction client
  async generateDiscardedInvoiceWithClient(
    client,
    discardData,
    discardedBloodIds
  ) {
    try {
      // Generate invoice ID
      const invoiceIdResult = await client.query(
        "SELECT generate_discarded_invoice_id() as invoice_id"
      );
      const invoiceId = invoiceIdResult.rows[0].invoice_id;

      // Determine category from first discarded blood item
      let category = "Red Blood Cell"; // default
      if (discardedBloodIds.length > 0) {
        const categoryQuery = `
          SELECT db_category FROM discarded_blood WHERE db_id = $1
        `;
        const categoryResult = await client.query(categoryQuery, [
          discardedBloodIds[0],
        ]);
        if (categoryResult.rows.length > 0) {
          category = categoryResult.rows[0].db_category;
        }
      }

      // Generate reference number based on category
      const referenceNumber =
        await this.generateDiscardedReferenceNumber(category);

      // Insert invoice header with reference number
      const insertInvoiceQuery = `
        INSERT INTO discarded_blood_invoices (
          dbi_invoice_id, dbi_reference_number, dbi_responsible_personnel, dbi_reason_for_discarding,
          dbi_authorized_by, dbi_date_of_discard, dbi_time_of_discard,
          dbi_method_of_disposal, dbi_remarks, dbi_created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING dbi_id
      `;

      const invoiceValues = [
        invoiceId,
        referenceNumber,
        discardData.responsiblePersonnel || "",
        discardData.reasonForDiscarding || "",
        discardData.authorizedBy || "",
        discardData.dateOfDiscard
          ? new Date(discardData.dateOfDiscard)
          : new Date(),
        discardData.timeOfDiscard || "",
        discardData.methodOfDisposal || "",
        discardData.remarks || "",
      ];

      const invoiceResult = await client.query(
        insertInvoiceQuery,
        invoiceValues
      );
      const invoiceDbId = invoiceResult.rows[0].dbi_id;

      // Get discarded blood details and insert invoice items
      for (const dbId of discardedBloodIds) {
        const getDiscardedBloodQuery = `
          SELECT db_serial_id, db_blood_type, db_rh_factor, db_timestamp, 
                db_expiration_date, db_volume
          FROM discarded_blood
          WHERE db_id = $1
        `;

        const dbResult = await client.query(getDiscardedBloodQuery, [dbId]);

        if (dbResult.rows.length > 0) {
          const db = dbResult.rows[0];

          const insertItemQuery = `
            INSERT INTO discarded_blood_invoice_items (
              dbii_invoice_id, dbii_discarded_blood_id, dbii_serial_id,
              dbii_blood_type, dbii_rh_factor, dbii_date_of_collection,
              dbii_date_of_expiration, dbii_volume, dbii_created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
          `;

          await client.query(insertItemQuery, [
            invoiceDbId,
            dbId,
            db.db_serial_id,
            db.db_blood_type,
            db.db_rh_factor,
            db.db_timestamp,
            db.db_expiration_date,
            db.db_volume,
          ]);

          // Update discarded_blood with invoice reference
          await client.query(
            "UPDATE discarded_blood SET db_invoice_id = $1 WHERE db_id = $2",
            [invoiceDbId, dbId]
          );
        }
      }

      return {
        success: true,
        invoiceId: invoiceId,
        invoiceDbId: invoiceDbId,
        referenceNumber: referenceNumber,
      };
    } catch (error) {
      console.error("Error generating discarded invoice:", error);
      throw error;
    }
  },

  // Get all discarded invoices with item counts
  // Get all discarded invoices with item counts
  async getAllDiscardedBloodInvoices() {
    try {
      const query = `
      SELECT 
        dbi.dbi_id as id,
        dbi.dbi_invoice_id as "invoiceId",
        COALESCE(dbi.dbi_reference_number, '') as "referenceNumber",
        dbi.dbi_responsible_personnel as "responsiblePersonnel",
        dbi.dbi_reason_for_discarding as "reasonForDiscarding",
        dbi.dbi_authorized_by as "authorizedBy",
        TO_CHAR(dbi.dbi_date_of_discard, 'MM/DD/YYYY') as "dateOfDiscard",
        dbi.dbi_time_of_discard as "timeOfDiscard",
        dbi.dbi_method_of_disposal as "methodOfDisposal",
        dbi.dbi_remarks as remarks,
        TO_CHAR(dbi.dbi_created_at, 'MM/DD/YYYY-HH24:MI:SS') as created,
        COUNT(dbii.dbii_id) as "itemCount"
      FROM discarded_blood_invoices dbi
      LEFT JOIN discarded_blood_invoice_items dbii ON dbi.dbi_id = dbii.dbii_invoice_id
      GROUP BY dbi.dbi_id, dbi.dbi_invoice_id, dbi.dbi_reference_number,
               dbi.dbi_responsible_personnel, dbi.dbi_reason_for_discarding,
               dbi.dbi_authorized_by, dbi.dbi_date_of_discard, dbi.dbi_time_of_discard,
               dbi.dbi_method_of_disposal, dbi.dbi_remarks, dbi.dbi_created_at
      ORDER BY dbi.dbi_created_at DESC
    `;

      const result = await pool.query(query);
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error fetching discarded invoices:", error);
      throw error;
    }
  },

  async viewDiscardedBloodInvoice(invoiceId) {
    try {
      const headerQuery = `
      SELECT 
        dbi.dbi_id as id,
        dbi.dbi_invoice_id as "invoiceId",
        COALESCE(dbi.dbi_reference_number, '') as "referenceNumber",
        dbi.dbi_responsible_personnel as "responsiblePersonnel",
        dbi.dbi_reason_for_discarding as "reasonForDiscarding",
        dbi.dbi_authorized_by as "authorizedBy",
        TO_CHAR(dbi.dbi_date_of_discard, 'MM/DD/YYYY') as "dateOfDiscard",
        dbi.dbi_time_of_discard as "timeOfDiscard",
        dbi.dbi_method_of_disposal as "methodOfDisposal",
        dbi.dbi_remarks as remarks,
        TO_CHAR(dbi.dbi_created_at, 'MM/DD/YYYY') as created
      FROM discarded_blood_invoices dbi
      WHERE dbi.dbi_id = $1
    `;

      const itemsQuery = `
      SELECT 
        dbii_serial_id as "serialId",
        dbii_blood_type as "bloodType",
        dbii_rh_factor as "rhFactor",
        TO_CHAR(dbii_date_of_collection, 'MM/DD/YYYY') as "dateOfCollection",
        TO_CHAR(dbii_date_of_expiration, 'MM/DD/YYYY') as "dateOfExpiration",
        dbii_volume as volume
      FROM discarded_blood_invoice_items
      WHERE dbii_invoice_id = $1
      ORDER BY dbii_created_at
    `;

      const headerResult = await pool.query(headerQuery, [invoiceId]);
      const itemsResult = await pool.query(itemsQuery, [invoiceId]);

      if (headerResult.rows.length === 0) {
        throw new Error("Discarded invoice not found");
      }

      return {
        header: headerResult.rows[0],
        items: itemsResult.rows,
      };
    } catch (error) {
      console.error("Error fetching discarded invoice details:", error);
      throw error;
    }
  },

  // Search discarded invoices
  // Search discarded invoices
  async searchDiscardedBloodInvoices(searchTerm) {
    try {
      const query = `
      SELECT 
        dbi.dbi_id as id,
        dbi.dbi_invoice_id as "invoiceId",
        COALESCE(dbi.dbi_reference_number, '') as "referenceNumber",
        dbi.dbi_responsible_personnel as "responsiblePersonnel",
        dbi.dbi_reason_for_discarding as "reasonForDiscarding",
        dbi.dbi_authorized_by as "authorizedBy",
        TO_CHAR(dbi.dbi_date_of_discard, 'MM/DD/YYYY') as "dateOfDiscard",
        dbi.dbi_method_of_disposal as "methodOfDisposal",
        COUNT(dbii.dbii_id) as "itemCount"
      FROM discarded_blood_invoices dbi
      LEFT JOIN discarded_blood_invoice_items dbii ON dbi.dbi_id = dbii.dbii_invoice_id
      WHERE 
        dbi.dbi_invoice_id ILIKE $1 OR
        COALESCE(dbi.dbi_reference_number, '') ILIKE $1 OR
        dbi.dbi_responsible_personnel ILIKE $1 OR
        dbi.dbi_reason_for_discarding ILIKE $1 OR
        dbi.dbi_authorized_by ILIKE $1 OR
        dbi.dbi_method_of_disposal ILIKE $1
      GROUP BY dbi.dbi_id
      ORDER BY dbi.dbi_created_at DESC
    `;

      const result = await pool.query(query, [`%${searchTerm}%`]);
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error searching discarded invoices:", error);
      throw error;
    }
  },

  // Delete discarded invoices
  async deleteDiscardedBloodInvoices(invoiceIds) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
        throw new Error("Invalid invoice IDs provided");
      }

      // Get all discarded_blood IDs associated with these invoices
      const getDiscardedBloodQuery = `
        SELECT DISTINCT dbii.dbii_discarded_blood_id
        FROM discarded_blood_invoice_items dbii
        WHERE dbii.dbii_invoice_id = ANY($1::integer[])
      `;
      const discardedBloodResult = await client.query(getDiscardedBloodQuery, [
        invoiceIds,
      ]);
      const discardedBloodIds = discardedBloodResult.rows
        .map((row) => row.dbii_discarded_blood_id)
        .filter((id) => id !== null);

      // Clear invoice reference from discarded_blood records FIRST (before deleting invoice)
      if (discardedBloodIds.length > 0) {
        const clearInvoiceRefQuery = `
          UPDATE discarded_blood
          SET db_invoice_id = NULL
          WHERE db_id = ANY($1::integer[])
        `;
        await client.query(clearInvoiceRefQuery, [discardedBloodIds]);
      }

      // Delete invoice items
      const deleteItemsQuery = `
        DELETE FROM discarded_blood_invoice_items
        WHERE dbii_invoice_id = ANY($1::integer[])
      `;
      await client.query(deleteItemsQuery, [invoiceIds]);

      // Delete invoices
      const deleteInvoicesQuery = `
        DELETE FROM discarded_blood_invoices
        WHERE dbi_id = ANY($1::integer[])
      `;
      const deleteResult = await client.query(deleteInvoicesQuery, [
        invoiceIds,
      ]);

      await client.query("COMMIT");

      return {
        success: true,
        deletedCount: deleteResult.rowCount,
        message: `Successfully deleted ${deleteResult.rowCount} invoice(s)`,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error deleting discarded invoices:", error);
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
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error fetching blood reports:", error);
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
      console.error("Error checking quarter status:", error);
      throw error;
    }
  },

  async generateQuarterlyReport(quarter, year) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
  
      // Determine quarter months
      let monthStart, monthEnd, monthLabels;
      switch (quarter) {
        case "1st Quarter":
          monthStart = 1;
          monthEnd = 3;
          monthLabels = ["Jan", "Feb", "Mar"];
          break;
        case "2nd Quarter":
          monthStart = 4;
          monthEnd = 6;
          monthLabels = ["Apr", "May", "Jun"];
          break;
        case "3rd Quarter":
          monthStart = 7;
          monthEnd = 9;
          monthLabels = ["Jul", "Aug", "Sep"];
          break;
        case "4th Quarter":
          monthStart = 10;
          monthEnd = 12;
          monthLabels = ["Oct", "Nov", "Dec"];
          break;
        default:
          throw new Error("Invalid quarter");
      }
  
      const yearInt = parseInt(year);
  
      // Only check if trying to generate reports for future quarters
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
  
      if (yearInt > currentYear) {
        throw new Error(`Cannot generate report for future year ${yearInt}`);
      }
  
      if (yearInt === currentYear && currentMonth <= monthEnd) {
        throw new Error(`Quarter ${quarter} of ${yearInt} has not ended yet`);
      }
  
      // Check if there's any data for this quarter
      const dataCheckQuery = `
        SELECT COUNT(*) as count
        FROM blood_stock_history
        WHERE 
          EXTRACT(YEAR FROM bsh_timestamp)::integer = $1::integer
          AND EXTRACT(MONTH FROM bsh_timestamp)::integer BETWEEN $2::integer AND $3::integer
          AND bsh_action = 'ADDED'
          AND bsh_category = 'Red Blood Cell'
      `;
      
      const dataCheckResult = await client.query(dataCheckQuery, [yearInt, monthStart, monthEnd]);
      const hasData = parseInt(dataCheckResult.rows[0].count) > 0;
      
      if (!hasData) {
        console.log(`No data found for ${quarter} ${yearInt}, skipping...`);
        await client.query("ROLLBACK");
        return { success: false, message: `No data available for ${quarter} ${yearInt}` };
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
  
      // Query to get data separated by source (Mobile vs Walk-In)
      const statsQuery = `
        WITH quarter_data AS (
          SELECT 
            bsh_blood_type,
            bsh_rh_factor,
            bsh_source,
            EXTRACT(MONTH FROM bsh_timestamp)::integer as month_num,
            COUNT(*)::integer as count
          FROM blood_stock_history
          WHERE 
            EXTRACT(YEAR FROM bsh_timestamp)::integer = $1::integer
            AND EXTRACT(MONTH FROM bsh_timestamp)::integer BETWEEN $2::integer AND $3::integer
            AND bsh_action = 'ADDED'
            AND bsh_category = 'Red Blood Cell'
          GROUP BY bsh_blood_type, bsh_rh_factor, bsh_source, EXTRACT(MONTH FROM bsh_timestamp)
        )
        SELECT 
          bsh_blood_type || bsh_rh_factor as blood_type,
          bsh_source as source,
          month_num,
          SUM(count)::integer as total
        FROM quarter_data
        GROUP BY bsh_blood_type, bsh_rh_factor, bsh_source, month_num
      `;
  
      const statsResult = await client.query(statsQuery, [
        yearInt,
        monthStart,
        monthEnd,
      ]);
  
      // Initialize counters for Mobile and Walk-In separately
      const bloodTypes = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
      
      // Mobile data
      const mobileMonthlyCounts = {
        [monthStart]: {},
        [monthStart + 1]: {},
        [monthStart + 2]: {},
      };
      const mobileQuarterTotals = {};
  
      // Walk-In data
      const walkInMonthlyCounts = {
        [monthStart]: {},
        [monthStart + 1]: {},
        [monthStart + 2]: {},
      };
      const walkInQuarterTotals = {};
  
      // Initialize all blood types to 0
      bloodTypes.forEach((type) => {
        // Mobile
        mobileQuarterTotals[type] = 0;
        mobileMonthlyCounts[monthStart][type] = 0;
        mobileMonthlyCounts[monthStart + 1][type] = 0;
        mobileMonthlyCounts[monthStart + 2][type] = 0;
  
        // Walk-In
        walkInQuarterTotals[type] = 0;
        walkInMonthlyCounts[monthStart][type] = 0;
        walkInMonthlyCounts[monthStart + 1][type] = 0;
        walkInMonthlyCounts[monthStart + 2][type] = 0;
      });
  
      // Process query results and separate by source
      statsResult.rows.forEach((row) => {
        const type = row.blood_type;
        const source = row.source;
        const month = parseInt(row.month_num);
        const count = parseInt(row.total);
  
        if (!bloodTypes.includes(type)) return;
  
        if (source === "Mobile") {
          if (mobileMonthlyCounts[month]) {
            mobileMonthlyCounts[month][type] = count;
            mobileQuarterTotals[type] += count;
          }
        } else if (source === "Walk-In") {
          if (walkInMonthlyCounts[month]) {
            walkInMonthlyCounts[month][type] = count;
            walkInQuarterTotals[type] += count;
          }
        }
      });
  
      // Calculate grand totals
      const mobileGrandTotal = Object.values(mobileQuarterTotals).reduce(
        (sum, val) => sum + val,
        0
      );
      const walkInGrandTotal = Object.values(walkInQuarterTotals).reduce(
        (sum, val) => sum + val,
        0
      );
      const combinedGrandTotal = mobileGrandTotal + walkInGrandTotal;
  
      // Calculate Mobile monthly percentages (relative to mobile grand total)
      const mobileMonthlyPercentages = {};
      Object.keys(mobileMonthlyCounts).forEach((month) => {
        mobileMonthlyPercentages[month] = {};
        bloodTypes.forEach((type) => {
          mobileMonthlyPercentages[month][type] =
            mobileGrandTotal > 0
              ? ((mobileMonthlyCounts[month][type] / mobileGrandTotal) * 100).toFixed(2)
              : "0.00";
        });
      });
  
      // Calculate Walk-In monthly percentages (relative to walk-in grand total)
      const walkInMonthlyPercentages = {};
      Object.keys(walkInMonthlyCounts).forEach((month) => {
        walkInMonthlyPercentages[month] = {};
        bloodTypes.forEach((type) => {
          walkInMonthlyPercentages[month][type] =
            walkInGrandTotal > 0
              ? ((walkInMonthlyCounts[month][type] / walkInGrandTotal) * 100).toFixed(2)
              : "0.00";
        });
      });
  
      // Prepare Mobile monthly data as JSONB
      const mobileMonth1Data = {
        counts: mobileMonthlyCounts[monthStart],
        percentages: mobileMonthlyPercentages[monthStart],
        total: Object.values(mobileMonthlyCounts[monthStart]).reduce(
          (sum, val) => sum + val,
          0
        ),
      };
      const mobileMonth2Data = {
        counts: mobileMonthlyCounts[monthStart + 1],
        percentages: mobileMonthlyPercentages[monthStart + 1],
        total: Object.values(mobileMonthlyCounts[monthStart + 1]).reduce(
          (sum, val) => sum + val,
          0
        ),
      };
      const mobileMonth3Data = {
        counts: mobileMonthlyCounts[monthStart + 2],
        percentages: mobileMonthlyPercentages[monthStart + 2],
        total: Object.values(mobileMonthlyCounts[monthStart + 2]).reduce(
          (sum, val) => sum + val,
          0
        ),
      };
  
      // Calculate mobile monthly total percentages
      mobileMonth1Data.totalPct = mobileGrandTotal > 0 
        ? ((mobileMonth1Data.total / mobileGrandTotal) * 100).toFixed(1) 
        : "0.0";
      mobileMonth2Data.totalPct = mobileGrandTotal > 0 
        ? ((mobileMonth2Data.total / mobileGrandTotal) * 100).toFixed(1) 
        : "0.0";
      mobileMonth3Data.totalPct = mobileGrandTotal > 0 
        ? ((mobileMonth3Data.total / mobileGrandTotal) * 100).toFixed(1) 
        : "0.0";
  
      // Prepare Walk-In monthly data as JSONB
      const walkInMonth1Data = {
        counts: walkInMonthlyCounts[monthStart],
        percentages: walkInMonthlyPercentages[monthStart],
        total: Object.values(walkInMonthlyCounts[monthStart]).reduce(
          (sum, val) => sum + val,
          0
        ),
      };
      const walkInMonth2Data = {
        counts: walkInMonthlyCounts[monthStart + 1],
        percentages: walkInMonthlyPercentages[monthStart + 1],
        total: Object.values(walkInMonthlyCounts[monthStart + 1]).reduce(
          (sum, val) => sum + val,
          0
        ),
      };
      const walkInMonth3Data = {
        counts: walkInMonthlyCounts[monthStart + 2],
        percentages: walkInMonthlyPercentages[monthStart + 2],
        total: Object.values(walkInMonthlyCounts[monthStart + 2]).reduce(
          (sum, val) => sum + val,
          0
        ),
      };
  
      // Calculate walk-in monthly total percentages
      walkInMonth1Data.totalPct = walkInGrandTotal > 0 
        ? ((walkInMonth1Data.total / walkInGrandTotal) * 100).toFixed(1) 
        : "0.0";
      walkInMonth2Data.totalPct = walkInGrandTotal > 0 
        ? ((walkInMonth2Data.total / walkInGrandTotal) * 100).toFixed(1) 
        : "0.0";
      walkInMonth3Data.totalPct = walkInGrandTotal > 0 
        ? ((walkInMonth3Data.total / walkInGrandTotal) * 100).toFixed(1) 
        : "0.0";
  
      // Combine monthly data with mobile and walkIn sections
      const month1Data = {
        mobile: mobileMonth1Data,
        walkIn: walkInMonth1Data,
      };
      const month2Data = {
        mobile: mobileMonth2Data,
        walkIn: walkInMonth2Data,
      };
      const month3Data = {
        mobile: mobileMonth3Data,
        walkIn: walkInMonth3Data,
      };
  
      // Calculate combined percentages (for backward compatibility if needed)
      const combinedTotals = {};
      const combinedPercentages = {};
      bloodTypes.forEach((type) => {
        combinedTotals[type] = mobileQuarterTotals[type] + walkInQuarterTotals[type];
        combinedPercentages[type] =
          combinedGrandTotal > 0
            ? ((combinedTotals[type] / combinedGrandTotal) * 100).toFixed(2)
            : "0.00";
      });
  
      // Insert or update report
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
  
      const values = [
        reportId, // $1
        quarter, // $2
        yearInt, // $3
        monthStart, // $4
        monthEnd, // $5
        monthLabels, // $6
        combinedTotals["O+"], // $7
        combinedTotals["O-"], // $8
        combinedTotals["A+"], // $9
        combinedTotals["A-"], // $10
        combinedTotals["B+"], // $11
        combinedTotals["B-"], // $12
        combinedTotals["AB+"], // $13
        combinedTotals["AB-"], // $14
        combinedPercentages["O+"], // $15
        combinedPercentages["O-"], // $16
        combinedPercentages["A+"], // $17
        combinedPercentages["A-"], // $18
        combinedPercentages["B+"], // $19
        combinedPercentages["B-"], // $20
        combinedPercentages["AB+"], // $21
        combinedPercentages["AB-"], // $22
        combinedGrandTotal, // $23
        JSON.stringify(month1Data), // $24
        JSON.stringify(month2Data), // $25
        JSON.stringify(month3Data), // $26
        "Auto-generated", // $27
      ];
  
      await client.query(insertQuery, values);
      await client.query("COMMIT");
  
      console.log(`✓ Generated report for ${quarter} ${yearInt}`);
  
      return {
        success: true,
        reportId,
        quarter,
        year: yearInt,
        total: combinedGrandTotal,
        mobileTotal: mobileGrandTotal,
        walkInTotal: walkInGrandTotal,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error generating quarterly report:", error);
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
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error fetching reports by year:", error);
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
      console.error("Error fetching report by ID:", error);
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
      console.error("Error deleting reports:", error);
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
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error searching reports:", error);
      throw error;
    }
  },

  // Refresh/regenerate reports for current year
  async refreshCurrentYearReports() {
    try {
      const currentYear = new Date().getFullYear();

      // Delete existing reports for current year
      await pool.query("DELETE FROM blood_reports WHERE br_year = $1", [
        currentYear,
      ]);

      // Generate all available quarters
      await this.generateAllQuarterlyReports(currentYear);

      return await this.getReportsByYear(currentYear);
    } catch (error) {
      console.error("Error refreshing current year reports:", error);
      throw error;
    }
  },

  async addToBloodStockHistory(
    stockData,
    action = "ADDED",
    originalStockId = null
  ) {
    try {
      const query = `
      INSERT INTO blood_stock_history (
        bsh_serial_id, bsh_blood_type, bsh_rh_factor, bsh_volume,
        bsh_timestamp, bsh_expiration_date, bsh_status, bsh_category,
        bsh_original_stock_id, bsh_action, bsh_action_timestamp, bsh_source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11)
      RETURNING bsh_id
    `;

      const values = [
        stockData.serial_id,
        stockData.type,
        stockData.rhFactor,
        parseInt(stockData.volume),
        new Date(stockData.collection),
        new Date(stockData.expiration),
        stockData.status || "Stored",
        stockData.category || "Red Blood Cell",
        originalStockId,
        action,
        stockData.source || "Walk-In",
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("Error adding to blood stock history:", error);
      throw error;
    }
  },

  // Generate all available quarterly reports for a year
  async generateAllQuarterlyReports(year) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
  
    const quarters = [
      { name: "1st Quarter", endMonth: 3 },
      { name: "2nd Quarter", endMonth: 6 },
      { name: "3rd Quarter", endMonth: 9 },
      { name: "4th Quarter", endMonth: 12 },
    ];
  
    const generatedReports = [];
  
    for (const quarter of quarters) {
      try {
        // For past years, generate all quarters
        // For current year, only generate completed quarters
        if (
          year < currentYear ||
          (year === currentYear && currentMonth > quarter.endMonth)
        ) {
          const report = await this.generateQuarterlyReport(quarter.name, year);
          if (report.success) {
            generatedReports.push(report);
          }
        } else {
          console.log(`Skipping ${quarter.name} ${year}: Quarter not yet completed`);
        }
      } catch (error) {
        console.log(`Error generating ${quarter.name} ${year}: ${error.message}`);
      }
    }
  
    return generatedReports;
  },

  // ADD THIS NEW METHOD to get all years that have blood stock data:
async getAllYearsWithData() {
  try {
    const query = `
      SELECT DISTINCT EXTRACT(YEAR FROM bsh_timestamp)::integer as year
      FROM blood_stock_history
      WHERE bsh_action = 'ADDED' AND bsh_category = 'Red Blood Cell'
      ORDER BY year DESC
    `;
    
    const result = await pool.query(query);
    return result.rows.map(row => row.year);
  } catch (error) {
    console.error('Error fetching years with data:', error);
    throw error;
  }
},

  // ADD THIS NEW METHOD to generate all historical reports:
  async generateAllHistoricalReports() {
    try {
      const years = await this.getAllYearsWithData();
      console.log('Found data for years:', years);
      
      const allGeneratedReports = [];
      
      for (const year of years) {
        console.log(`Generating reports for year ${year}...`);
        const yearReports = await this.generateAllQuarterlyReports(year);
        allGeneratedReports.push(...yearReports);
      }
      
      return allGeneratedReports;
    } catch (error) {
      console.error('Error generating all historical reports:', error);
      throw error;
    }
  },

//END: ALL METHODS MADE BY EVEGEN DELA CRUZ ==============================================================================================
};

module.exports = dbService;
