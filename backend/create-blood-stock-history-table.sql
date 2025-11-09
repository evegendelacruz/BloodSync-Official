-- This script creates the blood_stock_history table.
-- This table is necessary for generating quarterly reports and tracking stock changes.

CREATE TABLE IF NOT EXISTS blood_stock_history (
    bsh_id SERIAL PRIMARY KEY,
    bsh_serial_id VARCHAR(255) NOT NULL,
    bsh_blood_type VARCHAR(5) NOT NULL,
    bsh_rh_factor VARCHAR(5) NOT NULL,
    bsh_volume INT NOT NULL,
    bsh_timestamp TIMESTAMP NOT NULL, -- Represents the date of collection
    bsh_expiration_date DATE,
    bsh_status VARCHAR(50),
    bsh_category VARCHAR(50),
    bsh_original_stock_id INT,
    bsh_action VARCHAR(50) NOT NULL, -- e.g., 'ADDED', 'RELEASED', 'DELETED'
    bsh_action_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Add an index for faster queries on the columns used in reports
CREATE INDEX IF NOT EXISTS idx_bsh_report_query ON blood_stock_history (bsh_timestamp, bsh_action, bsh_category);

-- Optional: Add an index for faster lookups by serial ID
CREATE INDEX IF NOT EXISTS idx_bsh_serial_id ON blood_stock_history (bsh_serial_id);

COMMENT ON TABLE blood_stock_history IS 'Tracks the history of blood stock items (additions, releases, deletions).';
COMMENT ON COLUMN blood_stock_history.bsh_timestamp IS 'Represents the date of collection of the blood unit.';
COMMENT ON COLUMN blood_stock_history.bsh_action_timestamp IS 'The timestamp when the action (add, delete, etc.) was recorded.';
