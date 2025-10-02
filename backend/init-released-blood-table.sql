-- Create released_blood table for tracking released blood stock
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
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_released_blood_serial_id ON released_blood(rb_serial_id);
CREATE INDEX IF NOT EXISTS idx_released_blood_category ON released_blood(rb_category);
CREATE INDEX IF NOT EXISTS idx_released_blood_status ON released_blood(rb_status);
CREATE INDEX IF NOT EXISTS idx_released_blood_released_at ON released_blood(rb_released_at);

-- Display confirmation
SELECT 'released_blood table created successfully' AS message;
