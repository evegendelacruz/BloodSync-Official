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
  
  // In releaseBloodStock method, modify to return the released blood IDs
async releaseBloodStock(releaseData) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const getStockQuery = `
      SELECT * FROM blood_stock 
      WHERE bs_serial_id = ANY($1) AND bs_category = 'Red Blood Cell' AND bs_status = 'Stored'
    `;
    const stockResult = await client.query(getStockQuery, [releaseData.serialIds]);
    
    if (stockResult.rows.length === 0) {
      throw new Error('No valid blood stock records found for release');
    }

    const releasedBloodIds = []; // Track the inserted IDs

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
        'Released',
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
      
      const insertResult = await client.query(insertQuery, values);
      releasedBloodIds.push(insertResult.rows[0].rb_id); // Store the ID
    }

    const deleteQuery = `
      DELETE FROM blood_stock 
      WHERE bs_serial_id = ANY($1) AND bs_category = 'Red Blood Cell' AND bs_status = 'Stored'
    `;
    await client.query(deleteQuery, [releaseData.serialIds]);

    // Generate invoice with the released blood IDs using the transaction client
    const invoiceResult = await this.generateInvoiceWithClient(client, releaseData, releasedBloodIds);

    await client.query('COMMIT');
    return { 
      success: true, 
      releasedCount: stockResult.rows.length,
      invoiceId: invoiceResult.invoiceId,
      invoiceDbId: invoiceResult.invoiceDbId
    };
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
  
      const getStockQuery = `
        SELECT * FROM blood_stock 
        WHERE bs_serial_id = ANY($1) AND bs_category = 'Plasma' AND bs_status = 'Stored'
      `;
      const stockResult = await client.query(getStockQuery, [releaseData.serialIds]);
      
      if (stockResult.rows.length === 0) {
        throw new Error('No valid plasma stock records found for release');
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
          'Released',
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
        
        const insertResult = await client.query(insertQuery, values);
        releasedBloodIds.push(insertResult.rows[0].rb_id);
      }
  
      const deleteQuery = `
        DELETE FROM blood_stock 
        WHERE bs_serial_id = ANY($1) AND bs_category = 'Plasma' AND bs_status = 'Stored'
      `;
      await client.query(deleteQuery, [releaseData.serialIds]);
  
      const invoiceResult = await this.generateInvoiceWithClient(client, releaseData, releasedBloodIds);
  
      await client.query('COMMIT');
      return { 
        success: true, 
        releasedCount: stockResult.rows.length,
        invoiceId: invoiceResult.invoiceId,
        invoiceDbId: invoiceResult.invoiceDbId
      };
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

    const getStockQuery = `
      SELECT * FROM blood_stock 
      WHERE bs_serial_id = ANY($1) AND bs_category = 'Platelet' AND bs_status = 'Stored'
    `;
    const stockResult = await client.query(getStockQuery, [releaseData.serialIds]);
    
    if (stockResult.rows.length === 0) {
      throw new Error('No valid platelet stock records found for release');
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
        'Released',
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
      
      const insertResult = await client.query(insertQuery, values);
      releasedBloodIds.push(insertResult.rows[0].rb_id);
    }

    const deleteQuery = `
      DELETE FROM blood_stock 
      WHERE bs_serial_id = ANY($1) AND bs_category = 'Platelet' AND bs_status = 'Stored'
    `;
    await client.query(deleteQuery, [releaseData.serialIds]);

    // Generate invoice with the released blood IDs using the transaction client
    const invoiceResult = await this.generateInvoiceWithClient(client, releaseData, releasedBloodIds);

    await client.query('COMMIT');
    return { 
      success: true, 
      releasedCount: stockResult.rows.length,
      invoiceId: invoiceResult.invoiceId,
      invoiceDbId: invoiceResult.invoiceDbId
    };
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

    const getStockQuery = `
      SELECT * FROM blood_stock 
      WHERE bs_serial_id = ANY($1) AND bs_category = 'Plasma' AND bs_status = 'Stored'
    `;
    const stockResult = await client.query(getStockQuery, [releaseData.serialIds]);
    
    if (stockResult.rows.length === 0) {
      throw new Error('No valid plasma stock records found for release');
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
        'Released',
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
      
      const insertResult = await client.query(insertQuery, values);
      releasedBloodIds.push(insertResult.rows[0].rb_id);
    }

    const deleteQuery = `
      DELETE FROM blood_stock 
      WHERE bs_serial_id = ANY($1) AND bs_category = 'Plasma' AND bs_status = 'Stored'
    `;
    await client.query(deleteQuery, [releaseData.serialIds]);

    // Generate invoice with the released blood IDs using the transaction client
    const invoiceResult = await this.generateInvoiceWithClient(client, releaseData, releasedBloodIds);

    await client.query('COMMIT');
    return { 
      success: true, 
      releasedCount: stockResult.rows.length,
      invoiceId: invoiceResult.invoiceId,
      invoiceDbId: invoiceResult.invoiceDbId
    };
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
    const discardedBloodIds = []; // Track discarded blood IDs

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
        RETURNING db_id
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
    const invoiceResult = await this.generateDiscardedInvoiceWithClient(client, discardData, discardedBloodIds);

    await client.query('COMMIT');
    return { 
      success: true, 
      discardedCount: discardedCount,
      invoiceId: invoiceResult.invoiceId,
      invoiceDbId: invoiceResult.invoiceDbId
    };
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
    const discardedBloodIds = []; // Track discarded blood IDs

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
        RETURNING db_id
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
    const invoiceResult = await this.generateDiscardedInvoiceWithClient(client, discardData, discardedBloodIds);

    await client.query('COMMIT');
    return { 
      success: true, 
      discardedCount: discardedCount,
      invoiceId: invoiceResult.invoiceId,
      invoiceDbId: invoiceResult.invoiceDbId
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error discarding platelet non-conforming stock:', error);
    throw error;
  } finally {
    client.release();
  }
},
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
    const discardedBloodIds = []; // Track discarded blood IDs

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
        RETURNING db_id
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
    const invoiceResult = await this.generateDiscardedInvoiceWithClient(client, discardData, discardedBloodIds);

    await client.query('COMMIT');
    return { 
      success: true, 
      discardedCount: discardedCount,
      invoiceId: invoiceResult.invoiceId,
      invoiceDbId: invoiceResult.invoiceDbId
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error discarding plasma non-conforming stock:', error);
    throw error;
  } finally {
    client.release();
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
      const discardedBloodIds = [];
  
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
          RETURNING db_id
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
      const invoiceResult = await this.generateDiscardedInvoiceWithClient(client, discardData, discardedBloodIds);
  
      await client.query('COMMIT');
      return { 
        success: true, 
        discardedCount: discardedCount,
        invoiceId: invoiceResult.invoiceId,
        invoiceDbId: invoiceResult.invoiceDbId
      };
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
      const discardedBloodIds = [];
  
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
          RETURNING db_id
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
      const invoiceResult = await this.generateDiscardedInvoiceWithClient(client, discardData, discardedBloodIds);
  
      await client.query('COMMIT');
      return { 
        success: true, 
        discardedCount: discardedCount,
        invoiceId: invoiceResult.invoiceId,
        invoiceDbId: invoiceResult.invoiceDbId
      };
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

  // ========== INVOICE METHODS ==========

  // Generate invoice using existing transaction client
async generateInvoiceWithClient(client, releaseData, releasedBloodIds) {
  try {
    // Generate invoice ID
    const invoiceIdResult = await client.query('SELECT generate_invoice_id() as invoice_id');
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
      releaseData.receivingFacility || '',
      releaseData.classification || '',
      releaseData.dateOfRelease ? new Date(releaseData.dateOfRelease) : new Date(),
      releaseData.releasedBy || '',
      releaseData.requestReference || '',
      releaseData.releasedBy || '',
      releaseData.verifiedBy || '',
    ];

    const invoiceResult = await client.query(insertInvoiceQuery, invoiceValues);
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
          rb.rb_volume
        ]);

        // Update released_blood with invoice reference
        await client.query(
          'UPDATE released_blood SET rb_invoice_id = $1 WHERE rb_id = $2',
          [invoiceDbId, rbId]
        );
      }
    }

    return { success: true, invoiceId: invoiceId, invoiceDbId: invoiceDbId };
  } catch (error) {
    console.error('Error generating invoice:', error);
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
    return result.rows.map(row => ({
      ...row,
      selected: false
    }));
  } catch (error) {
    console.error('Error fetching invoices:', error);
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
      throw new Error('Invoice not found');
    }
    
    return {
      header: headerResult.rows[0],
      items: itemsResult.rows
    };
  } catch (error) {
    console.error('Error fetching invoice details:', error);
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
    return result.rows.map(row => ({
      ...row,
      selected: false
    }));
  } catch (error) {
    console.error('Error searching invoices:', error);
    throw error;
  }
},

  // Delete invoices
  async deleteInvoices(invoiceIds) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Ensure invoiceIds is an array and contains valid integers
    if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      throw new Error('Invalid invoice IDs provided');
    }

    // Get all released_blood IDs associated with these invoices
    const getReleasedBloodQuery = `
      SELECT DISTINCT bii.bii_released_blood_id
      FROM blood_invoice_items bii
      WHERE bii.bii_invoice_id = ANY($1::integer[])
    `;
    const releasedBloodResult = await client.query(getReleasedBloodQuery, [invoiceIds]);
    const releasedBloodIds = releasedBloodResult.rows
      .map(row => row.bii_released_blood_id)
      .filter(id => id !== null);

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
    const deleteResult = await client.query(deleteInvoicesQuery, [invoiceIds]);

    // Clear invoice reference from released_blood records
    if (releasedBloodIds.length > 0) {
      const clearInvoiceRefQuery = `
        UPDATE released_blood
        SET rb_invoice_id = NULL
        WHERE rb_id = ANY($1::integer[])
      `;
      await client.query(clearInvoiceRefQuery, [releasedBloodIds]);
    }

    await client.query('COMMIT');

    return {
      success: true,
      deletedCount: deleteResult.rowCount,
      message: `Successfully deleted ${deleteResult.rowCount} invoice(s)`
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting invoices:', error);
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
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
    
    const timestamp = `${year}${month}${day}-${hours}${minutes}${seconds}-${milliseconds}`;
    
    return timestamp;
  } catch (error) {
    console.error('Error generating discarded invoice ID:', error);
    throw error;
  }
},

// Generate reference number for discarded invoice
async generateDiscardedReferenceNumber(category) {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
    
    // Determine category prefix
    let categoryPrefix = 'RBC';
    if (category === 'Platelet') {
      categoryPrefix = 'PLT';
    } else if (category === 'Plasma') {
      categoryPrefix = 'PLS';
    }
    
    const datePart = `${year}${month}${day}`;
    const timePart = `${hours}${minutes}${seconds}`;
    const uniquePart = milliseconds;
    
    return `REF-${categoryPrefix}-${datePart}-${timePart}-${uniquePart}`;
  } catch (error) {
    console.error('Error generating discarded reference number:', error);
    throw error;
  }
},

  // Generate discarded invoice using existing transaction client
  async generateDiscardedInvoiceWithClient(client, discardData, discardedBloodIds) {
    try {
      // Generate invoice ID
      const invoiceIdResult = await client.query('SELECT generate_discarded_invoice_id() as invoice_id');
      const invoiceId = invoiceIdResult.rows[0].invoice_id;

      // Determine category from first discarded blood item
      let category = 'Red Blood Cell'; // default
      if (discardedBloodIds.length > 0) {
        const categoryQuery = `
          SELECT db_category FROM discarded_blood WHERE db_id = $1
        `;
        const categoryResult = await client.query(categoryQuery, [discardedBloodIds[0]]);
        if (categoryResult.rows.length > 0) {
          category = categoryResult.rows[0].db_category;
        }
      }

      // Generate reference number based on category
      const referenceNumber = await this.generateDiscardedReferenceNumber(category);

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
        discardData.responsiblePersonnel || '',
        discardData.reasonForDiscarding || '',
        discardData.authorizedBy || '',
        discardData.dateOfDiscard ? new Date(discardData.dateOfDiscard) : new Date(),
        discardData.timeOfDiscard || '',
        discardData.methodOfDisposal || '',
        discardData.remarks || '',
      ];

      const invoiceResult = await client.query(insertInvoiceQuery, invoiceValues);
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
            db.db_volume
          ]);

          // Update discarded_blood with invoice reference
          await client.query(
            'UPDATE discarded_blood SET db_invoice_id = $1 WHERE db_id = $2',
            [invoiceDbId, dbId]
          );
        }
      }

      return { success: true, invoiceId: invoiceId, invoiceDbId: invoiceDbId, referenceNumber: referenceNumber };
    } catch (error) {
      console.error('Error generating discarded invoice:', error);
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
    return result.rows.map(row => ({
      ...row,
      selected: false
    }));
  } catch (error) {
    console.error('Error fetching discarded invoices:', error);
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
      throw new Error('Discarded invoice not found');
    }
    
    return {
      header: headerResult.rows[0],
      items: itemsResult.rows
    };
  } catch (error) {
    console.error('Error fetching discarded invoice details:', error);
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
    return result.rows.map(row => ({
      ...row,
      selected: false
    }));
  } catch (error) {
    console.error('Error searching discarded invoices:', error);
    throw error;
  }
},

// Delete discarded invoices
  async deleteDiscardedBloodInvoices(invoiceIds) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
        throw new Error('Invalid invoice IDs provided');
      }

      // Get all discarded_blood IDs associated with these invoices
      const getDiscardedBloodQuery = `
        SELECT DISTINCT dbii.dbii_discarded_blood_id
        FROM discarded_blood_invoice_items dbii
        WHERE dbii.dbii_invoice_id = ANY($1::integer[])
      `;
      const discardedBloodResult = await client.query(getDiscardedBloodQuery, [invoiceIds]);
      const discardedBloodIds = discardedBloodResult.rows
        .map(row => row.dbii_discarded_blood_id)
        .filter(id => id !== null);

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
      const deleteResult = await client.query(deleteInvoicesQuery, [invoiceIds]);

      await client.query('COMMIT');

      return {
        success: true,
        deletedCount: deleteResult.rowCount,
        message: `Successfully deleted ${deleteResult.rowCount} invoice(s)`
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error deleting discarded invoices:', error);
      throw error;
    } finally {
      client.release();
    }
  },

};

module.exports = dbService;