-- Donor Records Table for Regional Blood Center (Main System)
-- This table stores all approved donor records with donation history

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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_donor_records_donor_id ON donor_records(donor_id);
CREATE INDEX IF NOT EXISTS idx_donor_records_blood_type ON donor_records(blood_type);
CREATE INDEX IF NOT EXISTS idx_donor_records_rh_factor ON donor_records(rh_factor);
CREATE INDEX IF NOT EXISTS idx_donor_records_last_name ON donor_records(last_name);
CREATE INDEX IF NOT EXISTS idx_donor_records_created_at ON donor_records(created_at);
CREATE INDEX IF NOT EXISTS idx_donor_records_times_donated ON donor_records(times_donated);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_donor_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_donor_records_updated_at
BEFORE UPDATE ON donor_records
FOR EACH ROW
EXECUTE FUNCTION update_donor_records_updated_at();

-- Function to add donation date to donor record
CREATE OR REPLACE FUNCTION add_donation_date(donor_record_id INTEGER, donation_timestamp TIMESTAMP)
RETURNS void AS $$
BEGIN
  UPDATE donor_records
  SET
    donation_dates = donation_dates || jsonb_build_object('date', donation_timestamp),
    times_donated = times_donated + 1,
    last_donation_date = donation_timestamp,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = donor_record_id;
END;
$$ LANGUAGE plpgsql;
