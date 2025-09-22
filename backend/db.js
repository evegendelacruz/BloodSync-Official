const { Pool } = require('pg');

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

// Call test connection
testConnection();

// Database service functions
const dbService = {
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
};

module.exports = dbService;