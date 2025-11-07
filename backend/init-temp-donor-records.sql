-- Temporary Donor Records Table for Sync Requests
-- This table stores donor records from partnered organizations before approval

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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_temp_donor_records_donor_id ON temp_donor_records(tdr_donor_id);
CREATE INDEX IF NOT EXISTS idx_temp_donor_records_sync_status ON temp_donor_records(tdr_sync_status);
CREATE INDEX IF NOT EXISTS idx_temp_donor_records_source_org ON temp_donor_records(tdr_source_organization);
CREATE INDEX IF NOT EXISTS idx_temp_donor_records_requested_at ON temp_donor_records(tdr_sync_requested_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_temp_donor_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tdr_updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_temp_donor_records_updated_at
BEFORE UPDATE ON temp_donor_records
FOR EACH ROW
EXECUTE FUNCTION update_temp_donor_records_updated_at();
