-- Manual SQL script to create notifications table
-- Run this directly in your PostgreSQL database if automatic initialization fails

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  user_name VARCHAR(255),
  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  related_entity_type VARCHAR(50),
  related_entity_id INTEGER,
  link_to VARCHAR(255),
  is_read BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP,
  archived_at TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_related_entity ON notifications(related_entity_type, related_entity_id);

-- Create temp_donor_records table
CREATE TABLE IF NOT EXISTS temp_donor_records (
  id SERIAL PRIMARY KEY,
  donor_id VARCHAR(50) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(100) NOT NULL,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('Male', 'Female')),
  birthdate DATE NOT NULL,
  age INTEGER NOT NULL,
  blood_type VARCHAR(3) NOT NULL CHECK (blood_type IN ('A', 'B', 'AB', 'O')),
  rh_factor VARCHAR(1) NOT NULL CHECK (rh_factor IN ('+', '-')),
  contact_number VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  source_organization VARCHAR(255) NOT NULL,
  source_user_id INTEGER NOT NULL,
  source_user_name VARCHAR(255) NOT NULL,
  sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'approved', 'rejected')),
  sync_requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_approved_at TIMESTAMP,
  sync_approved_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for temp_donor_records
CREATE INDEX IF NOT EXISTS idx_temp_donor_records_donor_id ON temp_donor_records(donor_id);
CREATE INDEX IF NOT EXISTS idx_temp_donor_records_sync_status ON temp_donor_records(sync_status);
CREATE INDEX IF NOT EXISTS idx_temp_donor_records_source_org ON temp_donor_records(source_organization);
CREATE INDEX IF NOT EXISTS idx_temp_donor_records_requested_at ON temp_donor_records(sync_requested_at);

-- Create update trigger for temp_donor_records
CREATE OR REPLACE FUNCTION update_temp_donor_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_temp_donor_records_updated_at'
  ) THEN
    CREATE TRIGGER trigger_update_temp_donor_records_updated_at
    BEFORE UPDATE ON temp_donor_records
    FOR EACH ROW
    EXECUTE FUNCTION update_temp_donor_records_updated_at();
  END IF;
END $$;

-- Create donor_records table (main system)
CREATE TABLE IF NOT EXISTS donor_records (
  id SERIAL PRIMARY KEY,
  donor_id VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(100) NOT NULL,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('Male', 'Female')),
  birthdate DATE NOT NULL,
  age INTEGER NOT NULL,
  blood_type VARCHAR(3) NOT NULL CHECK (blood_type IN ('A', 'B', 'AB', 'O')),
  rh_factor VARCHAR(1) NOT NULL CHECK (rh_factor IN ('+', '-')),
  contact_number VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  times_donated INTEGER DEFAULT 1,
  donation_dates JSONB DEFAULT '[]'::jsonb,
  last_donation_date TIMESTAMP,
  source_organization VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for donor_records
CREATE INDEX IF NOT EXISTS idx_donor_records_donor_id ON donor_records(donor_id);
CREATE INDEX IF NOT EXISTS idx_donor_records_blood_type ON donor_records(blood_type);
CREATE INDEX IF NOT EXISTS idx_donor_records_rh_factor ON donor_records(rh_factor);
CREATE INDEX IF NOT EXISTS idx_donor_records_last_name ON donor_records(last_name);
CREATE INDEX IF NOT EXISTS idx_donor_records_created_at ON donor_records(created_at);
CREATE INDEX IF NOT EXISTS idx_donor_records_times_donated ON donor_records(times_donated);

-- Create update trigger for donor_records
CREATE OR REPLACE FUNCTION update_donor_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_donor_records_updated_at'
  ) THEN
    CREATE TRIGGER trigger_update_donor_records_updated_at
    BEFORE UPDATE ON donor_records
    FOR EACH ROW
    EXECUTE FUNCTION update_donor_records_updated_at();
  END IF;
END $$;

-- Verify tables were created
SELECT
  'notifications' as table_name,
  COUNT(*) as exists
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'notifications'
UNION ALL
SELECT
  'temp_donor_records' as table_name,
  COUNT(*) as exists
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'temp_donor_records'
UNION ALL
SELECT
  'donor_records' as table_name,
  COUNT(*) as exists
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'donor_records';
