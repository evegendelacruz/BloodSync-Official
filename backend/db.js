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
  
  // Get all red blood cell stock records
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
        WHERE bs_category = 'Red Blood Cell'
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

  // Search red blood cell stock
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
          bs_category = 'Red Blood Cell' AND (
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

  // ========== PLASMA METHODS ==========
  
  // Get all plasma stock records
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
        WHERE bs_category = 'Plasma'
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

  // Search plasma stock
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
          bs_category = 'Plasma' AND (
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
  }
};

module.exports = dbService;