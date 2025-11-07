-- ============================================================
-- FINAL SETUP SCRIPT FOR DONOR SYNC FUNCTIONALITY
-- Run this in your MAIN SYSTEM database (the one used by db.js)
-- ============================================================

-- STEP 1: Add new columns to existing donor_records table
-- ============================================================

-- Add times_donated column
ALTER TABLE donor_records
ADD COLUMN IF NOT EXISTS dr_times_donated INTEGER DEFAULT 1;

-- Add donation_dates column (JSONB array to store donation history)
ALTER TABLE donor_records
ADD COLUMN IF NOT EXISTS dr_donation_dates JSONB DEFAULT '[]'::jsonb;

-- Add last_donation_date column
ALTER TABLE donor_records
ADD COLUMN IF NOT EXISTS dr_last_donation_date TIMESTAMP;

-- Add source_organization column
ALTER TABLE donor_records
ADD COLUMN IF NOT EXISTS dr_source_organization VARCHAR(255);

-- Create index for times_donated
CREATE INDEX IF NOT EXISTS idx_donor_records_times_donated ON donor_records(dr_times_donated);

-- Initialize existing records with default donation data
UPDATE donor_records
SET
  dr_donation_dates = jsonb_build_array(jsonb_build_object('date', dr_created_at)),
  dr_last_donation_date = dr_created_at
WHERE dr_donation_dates IS NULL OR dr_donation_dates = '[]'::jsonb;


-- STEP 2: Create notifications table
-- ============================================================

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

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_related_entity ON notifications(related_entity_type, related_entity_id);


-- STEP 3: Create temp_donor_records table
-- ============================================================

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
);

-- Create indexes for temp_donor_records
CREATE INDEX IF NOT EXISTS idx_temp_donor_records_donor_id ON temp_donor_records(tdr_donor_id);
CREATE INDEX IF NOT EXISTS idx_temp_donor_records_sync_status ON temp_donor_records(tdr_sync_status);
CREATE INDEX IF NOT EXISTS idx_temp_donor_records_source_org ON temp_donor_records(tdr_source_organization);
CREATE INDEX IF NOT EXISTS idx_temp_donor_records_requested_at ON temp_donor_records(tdr_sync_requested_at);

-- Create update trigger for temp_donor_records
CREATE OR REPLACE FUNCTION update_temp_donor_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tdr_updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_temp_donor_records_updated_at ON temp_donor_records;
CREATE TRIGGER trigger_update_temp_donor_records_updated_at
BEFORE UPDATE ON temp_donor_records
FOR EACH ROW
EXECUTE FUNCTION update_temp_donor_records_updated_at();


-- STEP 4: Verify everything was created successfully
-- ============================================================

-- Check new columns in donor_records
SELECT
  'donor_records.' || column_name as "Column",
  data_type as "Type",
  CASE WHEN is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END as "Nullable"
FROM information_schema.columns
WHERE table_name = 'donor_records'
  AND column_name IN ('dr_times_donated', 'dr_donation_dates', 'dr_last_donation_date', 'dr_source_organization')
ORDER BY column_name;

-- Check tables exist
SELECT
  table_name as "Table",
  CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as "Status"
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('notifications', 'temp_donor_records', 'donor_records')
ORDER BY table_name;

-- Show summary
SELECT
  'Setup Complete!' as "Status",
  'All tables and columns have been created successfully' as "Message";
