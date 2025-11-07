-- Migration script to add sync-related columns to existing donor_records table
-- This adds the times_donated, donation_dates, last_donation_date, and source_organization columns

-- Add times_donated column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'donor_records' AND column_name = 'dr_times_donated'
  ) THEN
    ALTER TABLE donor_records ADD COLUMN dr_times_donated INTEGER DEFAULT 1;
    RAISE NOTICE 'Added dr_times_donated column';
  ELSE
    RAISE NOTICE 'dr_times_donated column already exists';
  END IF;
END $$;

-- Add donation_dates column if it doesn't exist (JSONB array to store donation history)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'donor_records' AND column_name = 'dr_donation_dates'
  ) THEN
    ALTER TABLE donor_records ADD COLUMN dr_donation_dates JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE 'Added dr_donation_dates column';
  ELSE
    RAISE NOTICE 'dr_donation_dates column already exists';
  END IF;
END $$;

-- Add last_donation_date column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'donor_records' AND column_name = 'dr_last_donation_date'
  ) THEN
    ALTER TABLE donor_records ADD COLUMN dr_last_donation_date TIMESTAMP;
    RAISE NOTICE 'Added dr_last_donation_date column';
  ELSE
    RAISE NOTICE 'dr_last_donation_date column already exists';
  END IF;
END $$;

-- Add source_organization column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'donor_records' AND column_name = 'dr_source_organization'
  ) THEN
    ALTER TABLE donor_records ADD COLUMN dr_source_organization VARCHAR(255);
    RAISE NOTICE 'Added dr_source_organization column';
  ELSE
    RAISE NOTICE 'dr_source_organization column already exists';
  END IF;
END $$;

-- Create index for times_donated column
CREATE INDEX IF NOT EXISTS idx_donor_records_times_donated ON donor_records(dr_times_donated);

-- Initialize existing records with default values
-- Set initial donation date for existing records (using created_at as first donation)
UPDATE donor_records
SET
  dr_donation_dates = jsonb_build_array(jsonb_build_object('date', dr_created_at)),
  dr_last_donation_date = dr_created_at
WHERE dr_donation_dates IS NULL OR dr_donation_dates = '[]'::jsonb;

-- Verify columns were added
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'donor_records'
  AND column_name IN ('dr_times_donated', 'dr_donation_dates', 'dr_last_donation_date', 'dr_source_organization')
ORDER BY column_name;
