const { Pool } = require("pg");
const nodemailer = require('nodemailer');
const crypto = require('crypto');

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
pool.on("connect", () => {
  console.log("Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("Database connection error:", err);
});

// Test connection on startup
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log("Database connection test successful");
    client.release();
    return true;
  } catch (err) {
    console.error("Database connection test failed:", err);
    return false;
  }
};

// Call test connection
testConnection();

const emailTransporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: 'bloodsync.doh@gmail.com',
    pass: 'ouks otjf ajgu yxfc' // Your App Password without spaces
  },
  tls: {
    rejectUnauthorized: false
  }
});

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
        bs_category as category,
        bs_source as source
      FROM blood_stock 
      WHERE bs_category = 'Red Blood Cell' AND bs_status = 'Stored'
      ORDER BY bs_created_at DESC
    `;

      const result = await pool.query(query);
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error fetching red blood cell stock:", error);
      throw error;
    }
  },

  // Get blood stock by serial ID for release with search functionality
  async getBloodStockBySerialId(serialId) {
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
        bs_category as category,
        bs_source as source
      FROM blood_stock 
      WHERE bs_serial_id = $1 AND bs_category = 'Red Blood Cell' AND bs_status = 'Stored'
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
          bs_category as category,
          bs_source as source
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
      console.error("Error fetching blood stock by serial ID:", error);
      throw error;
    }
  },

  async addBloodStock(bloodData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Check if serial ID already exists for this specific category
      const checkSerialQuery = `
        SELECT bs_id FROM blood_stock 
        WHERE bs_serial_id = $1 AND bs_category = $2
      `;
      const checkResult = await client.query(checkSerialQuery, [
        bloodData.serial_id,
        "Red Blood Cell",
      ]);

      if (checkResult.rows.length > 0) {
        throw new Error(
          `Serial ID ${bloodData.serial_id} already exists for Red Blood Cell category`
        );
      }

      const query = `
        INSERT INTO blood_stock (
          bs_serial_id, bs_blood_type, bs_rh_factor, bs_volume,
          bs_timestamp, bs_expiration_date, bs_status, bs_created_at, bs_category, bs_source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9)
        RETURNING bs_id
      `;

      const source = bloodData.source || "Walk-In";

      const values = [
        bloodData.serial_id,
        bloodData.type,
        bloodData.rhFactor,
        parseInt(bloodData.volume),
        new Date(bloodData.collection),
        new Date(bloodData.expiration),
        bloodData.status || "Stored",
        "Red Blood Cell",
        source,
      ];

      const result = await client.query(query, values);
      const stockId = result.rows[0].bs_id;

      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error adding blood stock:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  async updateBloodStock(id, bloodData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

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
        bs_category = $9,
        bs_source = $10
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
        bloodData.status || "Stored",
        "Red Blood Cell",
        bloodData.source || "Walk-In",
      ];

      await client.query(query, values);

      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error updating red blood cell stock:", error);
      throw error;
    } finally {
      client.release();
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
        bs_category as category,
        bs_source as source
      FROM blood_stock 
      WHERE 
        bs_category = 'Red Blood Cell' AND bs_status = 'Stored' AND (
          bs_serial_id ILIKE $1 OR 
          bs_blood_type ILIKE $1 OR 
          bs_status ILIKE $1 OR
          bs_rh_factor ILIKE $1 OR
          bs_source ILIKE $1
        )
      ORDER BY bs_created_at DESC
    `;

      const result = await pool.query(query, [`%${searchTerm}%`]);
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error searching red blood cell stock:", error);
      throw error;
    }
  },

  // Delete red blood cell stock records
  async deleteBloodStock(ids) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Get records before deletion to add to history
      const getRecordsQuery = `
        SELECT bs_id, bs_serial_id, bs_blood_type, bs_rh_factor, bs_volume,
               bs_timestamp, bs_expiration_date, bs_status, bs_source
        FROM blood_stock 
        WHERE bs_id = ANY($1) AND bs_category = 'Red Blood Cell'
      `;
      const records = await client.query(getRecordsQuery, [ids]);
      // Delete from blood_stock
      const query =
        "DELETE FROM blood_stock WHERE bs_id = ANY($1) AND bs_category = 'Red Blood Cell'";
      await client.query(query, [ids]);

      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error deleting red blood cell stock:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  // ========== RELEASE STOCK METHODS ==========

  async releaseBloodStock(releaseData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const getStockQuery = `
        SELECT * FROM blood_stock 
        WHERE bs_serial_id = ANY($1) AND bs_category = 'Red Blood Cell' AND bs_status = 'Stored'
      `;
      const stockResult = await client.query(getStockQuery, [
        releaseData.serialIds,
      ]);

      if (stockResult.rows.length === 0) {
        throw new Error("No valid blood stock records found for release");
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
            rb_released_by, rb_source
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
          RETURNING rb_id
        `;

        const values = [
          stockRecord.bs_serial_id,
          stockRecord.bs_blood_type,
          stockRecord.bs_rh_factor,
          stockRecord.bs_volume,
          stockRecord.bs_timestamp,
          stockRecord.bs_expiration_date,
          "Released",
          stockRecord.bs_created_at,
          "Red Blood Cell",
          stockRecord.bs_id,
          releaseData.receivingFacility || "",
          releaseData.address || "",
          releaseData.contactNumber || "",
          releaseData.classification || "",
          releaseData.authorizedRecipient || "",
          releaseData.recipientDesignation || "",
          releaseData.dateOfRelease
            ? new Date(releaseData.dateOfRelease)
            : new Date(),
          releaseData.conditionUponRelease || "",
          releaseData.requestReference || "",
          releaseData.releasedBy || "",
          stockRecord.bs_source || "Walk-In",
        ];

        const insertResult = await client.query(insertQuery, values);
        releasedBloodIds.push(insertResult.rows[0].rb_id);
      }

      const deleteQuery = `
        DELETE FROM blood_stock 
        WHERE bs_serial_id = ANY($1) AND bs_category = 'Red Blood Cell' AND bs_status = 'Stored'
      `;
      await client.query(deleteQuery, [releaseData.serialIds]);

      const invoiceResult = await this.generateInvoiceWithClient(
        client,
        releaseData,
        releasedBloodIds
      );

      await client.query("COMMIT");
      return {
        success: true,
        releasedCount: stockResult.rows.length,
        invoiceId: invoiceResult.invoiceId,
        invoiceDbId: invoiceResult.invoiceDbId,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error releasing blood stock:", error);
      throw error;
    } finally {
      client.release();
    }
  },

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
          rb_released_by as releasedBy,
          rb_source as source
        FROM released_blood 
        WHERE rb_category = 'Red Blood Cell'
        ORDER BY rb_released_at DESC
      `;

      const result = await pool.query(query);
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error fetching released blood stock:", error);
      throw error;
    }
  },

  async releasePlasmaStock(releaseData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const getStockQuery = `
        SELECT * FROM blood_stock 
        WHERE bs_serial_id = ANY($1) AND bs_category = 'Plasma' AND bs_status = 'Stored'
      `;
      const stockResult = await client.query(getStockQuery, [
        releaseData.serialIds,
      ]);

      if (stockResult.rows.length === 0) {
        throw new Error("No valid plasma stock records found for release");
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
            rb_released_by, rb_source
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
          RETURNING rb_id
        `;

        const values = [
          stockRecord.bs_serial_id,
          stockRecord.bs_blood_type,
          stockRecord.bs_rh_factor,
          stockRecord.bs_volume,
          stockRecord.bs_timestamp,
          stockRecord.bs_expiration_date,
          "Released",
          stockRecord.bs_created_at,
          "Plasma",
          stockRecord.bs_id,
          releaseData.receivingFacility || "",
          releaseData.address || "",
          releaseData.contactNumber || "",
          releaseData.classification || "",
          releaseData.authorizedRecipient || "",
          releaseData.recipientDesignation || "",
          releaseData.dateOfRelease
            ? new Date(releaseData.dateOfRelease)
            : new Date(),
          releaseData.conditionUponRelease || "",
          releaseData.requestReference || "",
          releaseData.releasedBy || "",
          stockRecord.bs_source || "Walk-In", // FIXED: Use actual source
        ];

        const insertResult = await client.query(insertQuery, values);
        releasedBloodIds.push(insertResult.rows[0].rb_id);
      }

      const deleteQuery = `
        DELETE FROM blood_stock 
        WHERE bs_serial_id = ANY($1) AND bs_category = 'Plasma' AND bs_status = 'Stored'
      `;
      await client.query(deleteQuery, [releaseData.serialIds]);

      const invoiceResult = await this.generateInvoiceWithClient(
        client,
        releaseData,
        releasedBloodIds
      );

      await client.query("COMMIT");
      return {
        success: true,
        releasedCount: stockResult.rows.length,
        invoiceId: invoiceResult.invoiceId,
        invoiceDbId: invoiceResult.invoiceDbId,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error releasing plasma stock:", error);
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
          bs_category as category,
          bs_source as source  -- THIS LINE WAS MISSING
        FROM blood_stock 
        WHERE bs_category = 'Platelet'
        ORDER BY bs_created_at DESC
      `;

      const result = await pool.query(query);
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error fetching platelet stock:", error);
      throw error;
    }
  },

  async addPlateletStock(plateletData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Check if serial ID already exists for this specific category
      const checkSerialQuery = `
        SELECT bs_id FROM blood_stock 
        WHERE bs_serial_id = $1 AND bs_category = $2
      `;
      const checkResult = await client.query(checkSerialQuery, [
        plateletData.serial_id,
        "Platelet",
      ]);

      if (checkResult.rows.length > 0) {
        throw new Error(
          `Serial ID ${plateletData.serial_id} already exists for Platelet category`
        );
      }

      const query = `
        INSERT INTO blood_stock (
          bs_serial_id, bs_blood_type, bs_rh_factor, bs_volume,
          bs_timestamp, bs_expiration_date, bs_status, bs_created_at, bs_category, bs_source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9)
        RETURNING bs_id
      `;

      const values = [
        plateletData.serial_id,
        plateletData.type,
        plateletData.rhFactor,
        parseInt(plateletData.volume),
        new Date(plateletData.collection),
        new Date(plateletData.expiration),
        plateletData.status || "Stored",
        "Platelet",
        plateletData.source || "Walk-In",
      ];

      const result = await client.query(query, values);
      const stockId = result.rows[0].bs_id;

      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error adding platelet stock:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  async deletePlateletStock(ids) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Get records before deletion
      const getRecordsQuery = `
        SELECT bs_id, bs_serial_id, bs_blood_type, bs_rh_factor, bs_volume,
               bs_timestamp, bs_expiration_date, bs_status, bs_source
        FROM blood_stock 
        WHERE bs_id = ANY($1) AND bs_category = 'Platelet'
      `;
      const records = await client.query(getRecordsQuery, [ids]);

      const query =
        "DELETE FROM blood_stock WHERE bs_id = ANY($1) AND bs_category = 'Platelet'";
      await client.query(query, [ids]);

      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error deleting platelet stock:", error);
      throw error;
    } finally {
      client.release();
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
          bs_source as source,
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
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error searching platelet stock:", error);
      throw error;
    }
  },

  async updatePlateletStock(id, plateletData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Check if serial ID already exists for a different record in this category
      const checkSerialQuery = `
        SELECT bs_id FROM blood_stock 
        WHERE bs_serial_id = $1 AND bs_category = $2 AND bs_id != $3
      `;
      const checkResult = await client.query(checkSerialQuery, [
        plateletData.serial_id,
        "Platelet",
        id,
      ]);

      if (checkResult.rows.length > 0) {
        throw new Error(
          `Serial ID ${plateletData.serial_id} already exists for Platelet category`
        );
      }

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
          bs_category = $9,
          bs_source = $10
        WHERE bs_id = $1 AND bs_category = 'Platelet'
      `;

      const values = [
        id,
        plateletData.serial_id,
        plateletData.type,
        plateletData.rhFactor,
        parseInt(plateletData.volume),
        new Date(plateletData.collection),
        new Date(plateletData.expiration),
        plateletData.status || "Stored",
        "Platelet",
        plateletData.source || "Walk-In",
      ];

      await client.query(query, values);

      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error updating platelet stock:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  // ========== PLATELET RELEASE METHODS ==========

  // Get platelet stock by serial ID for release with search functionality
  async getPlateletStockBySerialId(serialId) {
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
        bs_source as source,  -- ADD THIS LINE
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
          bs_source as source,  -- ADD THIS LINE
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
      console.error("Error fetching platelet stock by serial ID:", error);
      throw error;
    }
  },

  // Release platelet stock - moves records from blood_stock to released_blood
  async releasePlateletStock(releaseData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const getStockQuery = `
      SELECT * FROM blood_stock 
      WHERE bs_serial_id = ANY($1) AND bs_category = 'Platelet' AND bs_status = 'Stored'
    `;
      const stockResult = await client.query(getStockQuery, [
        releaseData.serialIds,
      ]);

      if (stockResult.rows.length === 0) {
        throw new Error("No valid platelet stock records found for release");
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
          rb_released_by, rb_source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        RETURNING rb_id
      `;

        const values = [
          stockRecord.bs_serial_id,
          stockRecord.bs_blood_type,
          stockRecord.bs_rh_factor,
          stockRecord.bs_volume,
          stockRecord.bs_timestamp,
          stockRecord.bs_expiration_date,
          "Released",
          stockRecord.bs_created_at,
          "Platelet",
          stockRecord.bs_id,
          releaseData.receivingFacility || "",
          releaseData.address || "",
          releaseData.contactNumber || "",
          releaseData.classification || "",
          releaseData.authorizedRecipient || "",
          releaseData.recipientDesignation || "",
          releaseData.dateOfRelease
            ? new Date(releaseData.dateOfRelease)
            : new Date(),
          releaseData.conditionUponRelease || "",
          releaseData.requestReference || "",
          releaseData.releasedBy || "",
          stockRecord.bs_source || "Walk-In", // FIXED: Use actual source
        ];

        const insertResult = await client.query(insertQuery, values);
        releasedBloodIds.push(insertResult.rows[0].rb_id);
      }

      const deleteQuery = `
      DELETE FROM blood_stock 
      WHERE bs_serial_id = ANY($1) AND bs_category = 'Platelet' AND bs_status = 'Stored'
    `;
      await client.query(deleteQuery, [releaseData.serialIds]);

      const invoiceResult = await this.generateInvoiceWithClient(
        client,
        releaseData,
        releasedBloodIds
      );

      await client.query("COMMIT");
      return {
        success: true,
        releasedCount: stockResult.rows.length,
        invoiceId: invoiceResult.invoiceId,
        invoiceDbId: invoiceResult.invoiceDbId,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error releasing platelet stock:", error);
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
      return result.rows.map((row) => ({
        ...row,
        selected: false, // Add selection state for UI
      }));
    } catch (error) {
      console.error("Error fetching released platelet stock:", error);
      throw error;
    }
  },

  // ========== PLASMA METHODS ==========

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
        bs_category as category,
        bs_source as source
      FROM blood_stock 
      WHERE bs_category = 'Plasma' AND bs_status = 'Stored'
      ORDER BY bs_created_at DESC
    `;

      const result = await pool.query(query);
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error fetching plasma stock:", error);
      throw error;
    }
  },

  // Get plasma stock by serial ID for release with search functionality
  async getPlasmaStockBySerialId(serialId) {
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
        bs_category as category,
        bs_source as source
      FROM blood_stock 
      WHERE bs_serial_id = $1 AND bs_category = 'Plasma' AND bs_status = 'Stored'
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
          bs_category as category,
          bs_source as source
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
      console.error("Error fetching plasma stock by serial ID:", error);
      throw error;
    }
  },

  async addPlasmaStock(plasmaData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Check if serial ID already exists for this specific category
      const checkSerialQuery = `
        SELECT bs_id FROM blood_stock 
        WHERE bs_serial_id = $1 AND bs_category = $2
      `;
      const checkResult = await client.query(checkSerialQuery, [
        plasmaData.serial_id,
        "Plasma",
      ]);

      if (checkResult.rows.length > 0) {
        throw new Error(
          `Serial ID ${plasmaData.serial_id} already exists for Plasma category`
        );
      }

      const query = `
        INSERT INTO blood_stock (
          bs_serial_id, bs_blood_type, bs_rh_factor, bs_volume,
          bs_timestamp, bs_expiration_date, bs_status, bs_created_at, bs_category, bs_source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9)
        RETURNING bs_id
      `;

      const values = [
        plasmaData.serial_id,
        plasmaData.type,
        plasmaData.rhFactor,
        parseInt(plasmaData.volume),
        new Date(plasmaData.collection),
        new Date(plasmaData.expiration),
        plasmaData.status || "Stored",
        "Plasma",
        plasmaData.source || "Walk-In",
      ];

      const result = await client.query(query, values);
      const stockId = result.rows[0].bs_id;

      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error adding plasma stock:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  async updatePlasmaStock(id, plasmaData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

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
        bs_category = $9,
        bs_source = $10
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
        plasmaData.status || "Stored",
        "Plasma",
        plasmaData.source || "Walk-In",
      ];

      await client.query(query, values);

      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error updating plasma stock:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  async deletePlasmaStock(ids) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Get records before deletion
      const getRecordsQuery = `
      SELECT bs_id, bs_serial_id, bs_blood_type, bs_rh_factor, bs_volume,
             bs_timestamp, bs_expiration_date, bs_status, bs_source
      FROM blood_stock 
      WHERE bs_id = ANY($1) AND bs_category = 'Plasma'
    `;
      const records = await client.query(getRecordsQuery, [ids]);

      const query =
        "DELETE FROM blood_stock WHERE bs_id = ANY($1) AND bs_category = 'Plasma'";
      await client.query(query, [ids]);

      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error deleting plasma stock:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Delete plasma stock records
  async deletePlasmaStock(ids) {
    try {
      const query =
        "DELETE FROM blood_stock WHERE bs_id = ANY($1) AND bs_category = 'Plasma'";
      await pool.query(query, [ids]);
      return true;
    } catch (error) {
      console.error("Error deleting plasma stock:", error);
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
        bs_category as category,
        bs_source as source
      FROM blood_stock 
      WHERE 
        bs_category = 'Plasma' AND bs_status = 'Stored' AND (
          bs_serial_id ILIKE $1 OR 
          bs_blood_type ILIKE $1 OR 
          bs_status ILIKE $1 OR
          bs_rh_factor ILIKE $1 OR
          bs_source ILIKE $1
        )
      ORDER BY bs_created_at DESC
    `;

      const result = await pool.query(query, [`%${searchTerm}%`]);
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error searching plasma stock:", error);
      throw error;
    }
  },

  // ========== RELEASE PLASMA STOCK METHODS ==========

  // Release plasma stock - moves records from blood_stock to released_blood
  async releasePlasmaStock(releaseData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const getStockQuery = `
      SELECT * FROM blood_stock 
      WHERE bs_serial_id = ANY($1) AND bs_category = 'Plasma' AND bs_status = 'Stored'
    `;
      const stockResult = await client.query(getStockQuery, [
        releaseData.serialIds,
      ]);

      if (stockResult.rows.length === 0) {
        throw new Error("No valid plasma stock records found for release");
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
          "Released",
          stockRecord.bs_created_at,
          "Plasma",
          stockRecord.bs_id,
          releaseData.receivingFacility || "",
          releaseData.address || "",
          releaseData.contactNumber || "",
          releaseData.classification || "",
          releaseData.authorizedRecipient || "",
          releaseData.recipientDesignation || "",
          releaseData.dateOfRelease
            ? new Date(releaseData.dateOfRelease)
            : new Date(),
          releaseData.conditionUponRelease || "",
          releaseData.requestReference || "",
          releaseData.releasedBy || "",
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
      const invoiceResult = await this.generateInvoiceWithClient(
        client,
        releaseData,
        releasedBloodIds
      );

      await client.query("COMMIT");
      return {
        success: true,
        releasedCount: stockResult.rows.length,
        invoiceId: invoiceResult.invoiceId,
        invoiceDbId: invoiceResult.invoiceDbId,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error releasing plasma stock:", error);
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
      return result.rows.map((row) => ({
        ...row,
        selected: false, // Add selection state for UI
      }));
    } catch (error) {
      console.error("Error fetching released plasma stock:", error);
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
          dr_status as status,
          TO_CHAR(dr_created_at, 'MM/DD/YYYY-HH24:MI:SS') as created,
          CASE 
            WHEN dr_modified_at IS NOT NULL 
            THEN TO_CHAR(dr_modified_at, 'MM/DD/YYYY-HH24:MI:SS')
            ELSE '-'
          END as modified,
          COALESCE(TO_CHAR(dr_recent_donation, 'MM/DD/YYYY'), 'No donations') as "recentDonation",
          COALESCE(dr_donation_count, 0) as "donationCount"
        FROM donor_records 
        ORDER BY dr_created_at DESC
      `;

      const result = await pool.query(query);
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error fetching donor records:", error);
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
          dr_contact_number, dr_address, dr_status, dr_recent_donation, dr_donation_count, dr_created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
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
        donorData.address,
        donorData.status || "Non-Reactive",
        donorData.recentDonation ? new Date(donorData.recentDonation) : null,
        parseInt(donorData.donationCount) || 0,
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("Error adding donor record:", error);
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
          dr_status = $13,
          dr_recent_donation = $14,
          dr_donation_count = $15,
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
        donorData.address,
        donorData.status || "Non-Reactive",
        donorData.recentDonation ? new Date(donorData.recentDonation) : null,
        parseInt(donorData.donationCount) || 0,
      ];

      await pool.query(query, values);
      return true;
    } catch (error) {
      console.error("Error updating donor record:", error);
      throw error;
    }
  },

  // Delete donor records
  async deleteDonorRecords(ids) {
    try {
      const query = "DELETE FROM donor_records WHERE dr_id = ANY($1)";
      await pool.query(query, [ids]);
      return true;
    } catch (error) {
      console.error("Error deleting donor records:", error);
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
          dr_status as status,
          TO_CHAR(dr_created_at, 'MM/DD/YYYY-HH24:MI:SS') as created,
          CASE 
            WHEN dr_modified_at IS NOT NULL 
            THEN TO_CHAR(dr_modified_at, 'MM/DD/YYYY-HH24:MI:SS')
            ELSE '-'
          END as modified,
          COALESCE(TO_CHAR(dr_recent_donation, 'MM/DD/YYYY'), 'No donations') as "recentDonation",
          COALESCE(dr_donation_count, 0) as "donationCount"
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
          dr_status ILIKE $1
        ORDER BY dr_created_at DESC
      `;

      const result = await pool.query(query, [`%${searchTerm}%`]);
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error searching donor records:", error);
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
        return "DNR-0001-ON";
      }

      const lastId = result.rows[0].dr_donor_id;
      const numberPart = parseInt(lastId.split("-")[1]);
      const nextNumber = (numberPart + 1).toString().padStart(4, "0");

      return `DNR-${nextNumber}-ON`;
    } catch (error) {
      console.error("Error generating donor ID:", error);
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
        rb_source = $9,
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
        bloodData.status || "Released",
        bloodData.source || "Walk-In",
      ];

      await pool.query(query, values);
      return true;
    } catch (error) {
      console.error("Error updating released blood stock:", error);
      throw error;
    }
  },

  // Delete released RBC records
  async deleteReleasedBloodStock(ids) {
    try {
      const query =
        "DELETE FROM released_blood WHERE rb_id = ANY($1) AND rb_category = 'Red Blood Cell'";
      await pool.query(query, [ids]);
      return true;
    } catch (error) {
      console.error("Error deleting released blood stock:", error);
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
        plasmaData.status || "Released",
      ];

      await pool.query(query, values);
      return true;
    } catch (error) {
      console.error("Error updating released plasma stock:", error);
      throw error;
    }
  },

  // Delete released Plasma records
  async deleteReleasedPlasmaStock(ids) {
    try {
      const query =
        "DELETE FROM released_blood WHERE rb_id = ANY($1) AND rb_category = 'Plasma'";
      await pool.query(query, [ids]);
      return true;
    } catch (error) {
      console.error("Error deleting released plasma stock:", error);
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
        plateletData.status || "Released",
      ];

      await pool.query(query, values);
      return true;
    } catch (error) {
      console.error("Error updating released platelet stock:", error);
      throw error;
    }
  },

  // Delete released Platelet records
  async deleteReleasedPlateletStock(ids) {
    try {
      const query =
        "DELETE FROM released_blood WHERE rb_id = ANY($1) AND rb_category = 'Platelet'";
      await pool.query(query, [ids]);
      return true;
    } catch (error) {
      console.error("Error deleting released platelet stock:", error);
      throw error;
    }
  },

  // ========== RESTORE BLOOD STOCK METHODS ==========

  async restoreBloodStock(serialIds) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const getReleasedQuery = `
        SELECT * FROM released_blood 
        WHERE rb_serial_id = ANY($1) AND rb_category = 'Red Blood Cell'
      `;
      const releasedResult = await client.query(getReleasedQuery, [serialIds]);

      if (releasedResult.rows.length === 0) {
        throw new Error("No released blood records found to restore");
      }

      let restoredCount = 0;
      const serialIdsToDelete = [];

      for (const record of releasedResult.rows) {
        // Check if serial ID already exists in blood_stock for this category
        const checkExistingQuery = `
          SELECT bs_id FROM blood_stock 
          WHERE bs_serial_id = $1 AND bs_category = 'Red Blood Cell'
        `;
        const existingResult = await client.query(checkExistingQuery, [
          record.rb_serial_id,
        ]);

        if (existingResult.rows.length > 0) {
          console.warn(
            `Serial ID ${record.rb_serial_id} already exists in blood_stock for Red Blood Cell category, will only remove from released_blood`
          );
          serialIdsToDelete.push(record.rb_serial_id);
          continue;
        }

        const insertQuery = `
          INSERT INTO blood_stock (
            bs_serial_id, bs_blood_type, bs_rh_factor, bs_volume,
            bs_timestamp, bs_expiration_date, bs_status, bs_created_at, bs_category, bs_source
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `;

        const values = [
          record.rb_serial_id,
          record.rb_blood_type,
          record.rb_rh_factor,
          record.rb_volume,
          record.rb_timestamp,
          record.rb_expiration_date,
          "Stored",
          record.rb_created_at,
          "Red Blood Cell",
          record.rb_source || "Walk-In",
        ];

        await client.query(insertQuery, values);
        restoredCount++;
        serialIdsToDelete.push(record.rb_serial_id);
      }

      if (serialIdsToDelete.length > 0) {
        const deleteQuery = `
          DELETE FROM released_blood 
          WHERE rb_serial_id = ANY($1) AND rb_category = 'Red Blood Cell'
        `;
        await client.query(deleteQuery, [serialIdsToDelete]);
      }

      await client.query("COMMIT");
      return { success: true, restoredCount: restoredCount };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error restoring blood stock:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  async restorePlasmaStock(serialIds) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const getReleasedQuery = `
        SELECT * FROM released_blood 
        WHERE rb_serial_id = ANY($1) AND rb_category = 'Plasma'
      `;
      const releasedResult = await client.query(getReleasedQuery, [serialIds]);

      if (releasedResult.rows.length === 0) {
        throw new Error("No released plasma records found to restore");
      }

      let restoredCount = 0;
      const serialIdsToDelete = [];

      for (const record of releasedResult.rows) {
        // Check if serial ID already exists in blood_stock for this category
        const checkExistingQuery = `
          SELECT bs_id FROM blood_stock 
          WHERE bs_serial_id = $1 AND bs_category = 'Plasma'
        `;
        const existingResult = await client.query(checkExistingQuery, [
          record.rb_serial_id,
        ]);

        if (existingResult.rows.length > 0) {
          console.warn(
            `Serial ID ${record.rb_serial_id} already exists in blood_stock for Plasma category, will only remove from released_blood`
          );
          serialIdsToDelete.push(record.rb_serial_id);
          continue;
        }

        const insertQuery = `
          INSERT INTO blood_stock (
            bs_serial_id, bs_blood_type, bs_rh_factor, bs_volume,
            bs_timestamp, bs_expiration_date, bs_status, bs_created_at, bs_category, bs_source
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `;

        const values = [
          record.rb_serial_id,
          record.rb_blood_type,
          record.rb_rh_factor,
          record.rb_volume,
          record.rb_timestamp,
          record.rb_expiration_date,
          "Stored",
          record.rb_created_at,
          "Plasma",
          record.rb_source || "Walk-In",
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

      await client.query("COMMIT");
      return { success: true, restoredCount: restoredCount };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error restoring plasma stock:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Restore Platelet from released_blood back to blood_stock
  async restorePlateletStock(serialIds) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const getReleasedQuery = `
        SELECT * FROM released_blood 
        WHERE rb_serial_id = ANY($1) AND rb_category = 'Platelet'
      `;
      const releasedResult = await client.query(getReleasedQuery, [serialIds]);

      if (releasedResult.rows.length === 0) {
        throw new Error("No released platelet records found to restore");
      }

      let restoredCount = 0;
      const serialIdsToDelete = [];

      for (const record of releasedResult.rows) {
        // Check if serial ID already exists in blood_stock for this category
        const checkExistingQuery = `
          SELECT bs_id FROM blood_stock 
          WHERE bs_serial_id = $1 AND bs_category = 'Platelet'
        `;
        const existingResult = await client.query(checkExistingQuery, [
          record.rb_serial_id,
        ]);

        if (existingResult.rows.length > 0) {
          console.warn(
            `Serial ID ${record.rb_serial_id} already exists in blood_stock for Platelet category, will only remove from released_blood`
          );
          serialIdsToDelete.push(record.rb_serial_id);
          continue;
        }

        const insertQuery = `
          INSERT INTO blood_stock (
            bs_serial_id, bs_blood_type, bs_rh_factor, bs_volume,
            bs_timestamp, bs_expiration_date, bs_status, bs_created_at, bs_category, bs_source
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `;

        const values = [
          record.rb_serial_id,
          record.rb_blood_type,
          record.rb_rh_factor,
          record.rb_volume,
          record.rb_timestamp,
          record.rb_expiration_date,
          "Stored",
          record.rb_created_at,
          "Platelet",
          record.rb_source || "Walk-In",
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

      await client.query("COMMIT");
      return { success: true, restoredCount: restoredCount };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error restoring platelet stock:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  // ========== NON-CONFORMING METHODS ==========

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
          nc_category as category,
          nc_source as source
        FROM non_conforming 
        WHERE nc_category = 'Red Blood Cell'
        ORDER BY nc_created_at DESC
      `;

      const result = await pool.query(query);
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error fetching non-conforming records:", error);
      throw error;
    }
  },

  async getBloodStockBySerialIdForNC(serialId) {
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
          bs_category as category,
          bs_source as source
        FROM blood_stock 
        WHERE bs_serial_id = $1 
          AND bs_status = 'Stored'
          AND bs_category = 'Red Blood Cell'
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
            bs_category as category,
            bs_source as source
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
      console.error("Error fetching blood stock by serial ID for NC:", error);
      throw error;
    }
  },

  async transferToNonConforming(serialIds) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const getStockQuery = `
        SELECT * FROM blood_stock 
        WHERE bs_serial_id = ANY($1) 
          AND bs_status = 'Stored'
          AND bs_category = 'Red Blood Cell'
      `;
      const stockResult = await client.query(getStockQuery, [serialIds]);

      if (stockResult.rows.length === 0) {
        throw new Error(
          "No valid Red Blood Cell stock records found for transfer to non-conforming"
        );
      }

      let transferredCount = 0;
      const serialIdsToDelete = [];

      for (const stockRecord of stockResult.rows) {
        const checkExistingQuery = `
          SELECT nc_id FROM non_conforming 
          WHERE nc_serial_id = $1 AND nc_category = 'Red Blood Cell'
        `;
        const existingResult = await client.query(checkExistingQuery, [
          stockRecord.bs_serial_id,
        ]);

        if (existingResult.rows.length > 0) {
          console.warn(
            `Serial ID ${stockRecord.bs_serial_id} already exists in non_conforming for Red Blood Cell category, skipping`
          );
          continue;
        }

        const insertQuery = `
          INSERT INTO non_conforming (
            nc_serial_id, nc_blood_type, nc_rh_factor, nc_volume,
            nc_timestamp, nc_expiration_date, nc_status, nc_created_at, nc_category, nc_source
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `;

        const values = [
          stockRecord.bs_serial_id,
          stockRecord.bs_blood_type,
          stockRecord.bs_rh_factor,
          stockRecord.bs_volume,
          stockRecord.bs_timestamp,
          stockRecord.bs_expiration_date,
          "Non-Conforming",
          stockRecord.bs_created_at,
          "Red Blood Cell",
          stockRecord.bs_source || "Walk-In",
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
            AND bs_category = 'Red Blood Cell'
        `;
        await client.query(deleteQuery, [serialIdsToDelete]);
      }

      await client.query("COMMIT");
      return { success: true, transferredCount: transferredCount };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error transferring to non-conforming:", error);
      throw error;
    } finally {
      client.release();
    }
  },

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
          nc_category = $9,
          nc_source = $10
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
        "Non-Conforming",
        "Red Blood Cell",
        ncData.source || "Walk-In", // ENSURE THIS IS HERE
      ];

      await pool.query(query, values);
      return true;
    } catch (error) {
      console.error("Error updating non-conforming record:", error);
      throw error;
    }
  },

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
          nc_category as category,
          nc_source as source
        FROM non_conforming 
        WHERE nc_category = 'Red Blood Cell'
          AND (
            nc_serial_id ILIKE $1 OR 
            nc_blood_type ILIKE $1 OR 
            nc_status ILIKE $1 OR
            nc_rh_factor ILIKE $1 OR
            nc_source ILIKE $1
          )
        ORDER BY nc_created_at DESC
      `;

      const result = await pool.query(query, [`%${searchTerm}%`]);
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error searching non-conforming records:", error);
      throw error;
    }
  },

  // Delete non-conforming records
  async deleteNonConforming(ids) {
    try {
      const query =
        "DELETE FROM non_conforming WHERE nc_id = ANY($1) AND nc_category = 'Red Blood Cell'";
      await pool.query(query, [ids]);
      return true;
    } catch (error) {
      console.error("Error deleting non-conforming records:", error);
      throw error;
    }
  },
  // Discard non-conforming stock (RED BLOOD CELL ONLY)
  async discardNonConformingStock(discardData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const getNonConformingQuery = `
        SELECT * FROM non_conforming 
        WHERE nc_serial_id = ANY($1) AND nc_category = 'Red Blood Cell'
      `;
      const ncResult = await client.query(getNonConformingQuery, [
        discardData.serialIds,
      ]);

      if (ncResult.rows.length === 0) {
        throw new Error(
          "No valid non-conforming Red Blood Cell records found for discard"
        );
      }

      let discardedCount = 0;
      const serialIdsToDelete = [];
      const discardedBloodIds = [];

      for (const ncRecord of ncResult.rows) {
        // Check for duplicate with BOTH serial_id AND category
        const checkExistingQuery = `
          SELECT db_id FROM discarded_blood 
          WHERE db_serial_id = $1 AND db_category = $2
        `;
        const existingResult = await client.query(checkExistingQuery, [
          ncRecord.nc_serial_id,
          "Red Blood Cell",
        ]);

        if (existingResult.rows.length > 0) {
          console.warn(
            `Serial ID ${ncRecord.nc_serial_id} already exists in discarded_blood for Red Blood Cell category, skipping`
          );
          continue;
        }

        const insertQuery = `
          INSERT INTO discarded_blood (
            db_serial_id, db_blood_type, db_rh_factor, db_volume,
            db_timestamp, db_expiration_date, db_status, db_created_at, 
            db_discarded_at, db_category, db_original_id,
            db_responsible_personnel, db_reason_for_discarding, db_authorized_by,
            db_date_of_discard, db_time_of_discard, db_method_of_disposal, db_remarks, 
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
          "Discarded",
          ncRecord.nc_created_at,
          "Red Blood Cell",
          ncRecord.nc_id,
          discardData.responsiblePersonnel,
          discardData.reasonForDiscarding,
          discardData.authorizedBy,
          new Date(discardData.dateOfDiscard),
          discardData.timeOfDiscard,
          discardData.methodOfDisposal,
          discardData.remarks || "",
        ];

        const insertResult = await client.query(insertQuery, values);
        discardedBloodIds.push(insertResult.rows[0].db_id);
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

      const invoiceResult = await this.generateDiscardedInvoiceWithClient(
        client,
        discardData,
        discardedBloodIds
      );

      await client.query("COMMIT");
      return {
        success: true,
        discardedCount: discardedCount,
        invoiceId: invoiceResult.invoiceId,
        invoiceDbId: invoiceResult.invoiceDbId,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error discarding non-conforming stock:", error);
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
        nc_category as category,
        nc_source as source  -- ADD THIS LINE (it was missing)
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
          nc_category as category,
          nc_source as source  -- ADD THIS LINE (it was missing)
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
      console.error(
        "Error fetching non-conforming stock by serial ID for discard:",
        error
      );
      throw error;
    }
  },

  async discardPlateletNonConformingStock(discardData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const getNonConformingQuery = `
      SELECT * FROM non_conforming 
      WHERE nc_serial_id = ANY($1) AND nc_category = 'Platelet'
    `;
      const ncResult = await client.query(getNonConformingQuery, [
        discardData.serialIds,
      ]);

      if (ncResult.rows.length === 0) {
        throw new Error(
          "No valid platelet non-conforming records found for discard"
        );
      }

      let discardedCount = 0;
      const serialIdsToDelete = [];
      const discardedBloodIds = []; // Track discarded blood IDs

      for (const ncRecord of ncResult.rows) {
        const checkExistingQuery = `
          SELECT db_id FROM discarded_blood 
          WHERE db_serial_id = $1 AND db_category = $2
        `;
        const existingResult = await client.query(checkExistingQuery, [
          ncRecord.nc_serial_id,
          "Platelet", // Make sure this matches exactly
        ]);

        if (existingResult.rows.length > 0) {
          console.warn(
            `Serial ID ${ncRecord.nc_serial_id} already exists in discarded_blood, skipping`
          );
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
          "Discarded",
          ncRecord.nc_created_at,
          "Platelet",
          ncRecord.nc_id,
          discardData.responsiblePersonnel,
          discardData.reasonForDiscarding,
          discardData.authorizedBy,
          new Date(discardData.dateOfDiscard),
          discardData.timeOfDiscard,
          discardData.methodOfDisposal,
          discardData.remarks || "",
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
      const invoiceResult = await this.generateDiscardedInvoiceWithClient(
        client,
        discardData,
        discardedBloodIds
      );

      await client.query("COMMIT");
      return {
        success: true,
        discardedCount: discardedCount,
        invoiceId: invoiceResult.invoiceId,
        invoiceDbId: invoiceResult.invoiceDbId,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error discarding platelet non-conforming stock:", error);
      throw error;
    } finally {
      client.release();
    }
  },
  async discardPlasmaNonConformingStock(discardData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const getNonConformingQuery = `
        SELECT * FROM non_conforming 
        WHERE nc_serial_id = ANY($1) AND nc_category = 'Plasma'
      `;
      const ncResult = await client.query(getNonConformingQuery, [
        discardData.serialIds,
      ]);

      if (ncResult.rows.length === 0) {
        throw new Error(
          "No valid plasma non-conforming records found for discard"
        );
      }

      let discardedCount = 0;
      const serialIdsToDelete = [];
      const discardedBloodIds = [];

      for (const ncRecord of ncResult.rows) {
        // FIXED: Check for duplicate with BOTH serial_id AND category
        const checkExistingQuery = `
          SELECT db_id FROM discarded_blood 
          WHERE db_serial_id = $1 AND db_category = $2
        `;
        const existingResult = await client.query(checkExistingQuery, [
          ncRecord.nc_serial_id,
          "Plasma", // Make sure this matches exactly
        ]);

        if (existingResult.rows.length > 0) {
          console.warn(
            `Serial ID ${ncRecord.nc_serial_id} already exists in discarded_blood for Plasma category, skipping`
          );
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
          "Discarded",
          ncRecord.nc_created_at,
          "Plasma",
          ncRecord.nc_id,
          discardData.responsiblePersonnel,
          discardData.reasonForDiscarding,
          discardData.authorizedBy,
          new Date(discardData.dateOfDiscard),
          discardData.timeOfDiscard,
          discardData.methodOfDisposal,
          discardData.remarks || "",
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

      const invoiceResult = await this.generateDiscardedInvoiceWithClient(
        client,
        discardData,
        discardedBloodIds
      );

      await client.query("COMMIT");
      return {
        success: true,
        discardedCount: discardedCount,
        invoiceId: invoiceResult.invoiceId,
        invoiceDbId: invoiceResult.invoiceDbId,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error discarding plasma non-conforming stock:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Search non-conforming records for discard modal (RED BLOOD CELL ONLY)
  async discardNonConformingStock(discardData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const getNonConformingQuery = `
        SELECT * FROM non_conforming 
        WHERE nc_serial_id = ANY($1) AND nc_category = 'Red Blood Cell'
      `;
      const ncResult = await client.query(getNonConformingQuery, [
        discardData.serialIds,
      ]);

      if (ncResult.rows.length === 0) {
        throw new Error(
          "No valid non-conforming Red Blood Cell records found for discard"
        );
      }

      let discardedCount = 0;
      const serialIdsToDelete = [];
      const discardedBloodIds = [];

      for (const ncRecord of ncResult.rows) {
        // FIXED: Check for duplicate with BOTH serial_id AND category
        const checkExistingQuery = `
          SELECT db_id FROM discarded_blood 
          WHERE db_serial_id = $1 AND db_category = $2
        `;
        const existingResult = await client.query(checkExistingQuery, [
          ncRecord.nc_serial_id,
          "Red Blood Cell", // Add category to the check
        ]);

        if (existingResult.rows.length > 0) {
          console.warn(
            `Serial ID ${ncRecord.nc_serial_id} already exists in discarded_blood for Red Blood Cell category, skipping`
          );
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
          "Discarded",
          ncRecord.nc_created_at,
          "Red Blood Cell",
          ncRecord.nc_id,
          discardData.responsiblePersonnel,
          discardData.reasonForDiscarding,
          discardData.authorizedBy,
          new Date(discardData.dateOfDiscard),
          discardData.timeOfDiscard,
          discardData.methodOfDisposal,
          discardData.remarks || "",
        ];

        const insertResult = await client.query(insertQuery, values);
        discardedBloodIds.push(insertResult.rows[0].db_id);
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

      const invoiceResult = await this.generateDiscardedInvoiceWithClient(
        client,
        discardData,
        discardedBloodIds
      );

      await client.query("COMMIT");
      return {
        success: true,
        discardedCount: discardedCount,
        invoiceId: invoiceResult.invoiceId,
        invoiceDbId: invoiceResult.invoiceDbId,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error discarding non-conforming stock:", error);
      throw error;
    } finally {
      client.release();
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
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error fetching platelet non-conforming records:", error);
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
      console.error(
        "Error fetching platelet stock by serial ID for NC:",
        error
      );
      throw error;
    }
  },

  // Transfer platelet stock to non-conforming
  async transferPlateletToNonConforming(serialIds) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const getStockQuery = `
        SELECT * FROM blood_stock 
        WHERE bs_serial_id = ANY($1) 
          AND bs_status = 'Stored'
          AND bs_category = 'Platelet'
      `;
      const stockResult = await client.query(getStockQuery, [serialIds]);

      if (stockResult.rows.length === 0) {
        throw new Error(
          "No valid Platelet stock records found for transfer to non-conforming"
        );
      }

      let transferredCount = 0;
      const serialIdsToDelete = [];

      for (const stockRecord of stockResult.rows) {
        const checkExistingQuery = `
          SELECT nc_id FROM non_conforming 
          WHERE nc_serial_id = $1 AND nc_category = 'Platelet'
        `;
        const existingResult = await client.query(checkExistingQuery, [
          stockRecord.bs_serial_id,
        ]);

        if (existingResult.rows.length > 0) {
          console.warn(
            `Serial ID ${stockRecord.bs_serial_id} already exists in non_conforming for Platelet category, skipping`
          );
          continue;
        }

        const insertQuery = `
          INSERT INTO non_conforming (
            nc_serial_id, nc_blood_type, nc_rh_factor, nc_volume,
            nc_timestamp, nc_expiration_date, nc_status, nc_created_at, nc_category, nc_source
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `;

        const values = [
          stockRecord.bs_serial_id,
          stockRecord.bs_blood_type,
          stockRecord.bs_rh_factor,
          stockRecord.bs_volume,
          stockRecord.bs_timestamp,
          stockRecord.bs_expiration_date,
          "Non-Conforming",
          stockRecord.bs_created_at,
          "Platelet",
          stockRecord.bs_source || "Walk-In",
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

      await client.query("COMMIT");
      return { success: true, transferredCount: transferredCount };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error transferring platelet to non-conforming:", error);
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
        "Non-Conforming",
        "Platelet",
      ];

      await pool.query(query, values);
      return true;
    } catch (error) {
      console.error("Error updating platelet non-conforming record:", error);
      throw error;
    }
  },

  // Delete platelet non-conforming records
  async deletePlateletNonConforming(ids) {
    try {
      const query =
        "DELETE FROM non_conforming WHERE nc_id = ANY($1) AND nc_category = 'Platelet'";
      await pool.query(query, [ids]);
      return true;
    } catch (error) {
      console.error("Error deleting platelet non-conforming records:", error);
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
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error searching platelet non-conforming records:", error);
      throw error;
    }
  },

  // Discard platelet non-conforming stock
  async discardPlateletNonConformingStock(discardData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const getNonConformingQuery = `
        SELECT * FROM non_conforming 
        WHERE nc_serial_id = ANY($1) AND nc_category = 'Platelet'
      `;
      const ncResult = await client.query(getNonConformingQuery, [
        discardData.serialIds,
      ]);

      if (ncResult.rows.length === 0) {
        throw new Error(
          "No valid platelet non-conforming records found for discard"
        );
      }

      let discardedCount = 0;
      const serialIdsToDelete = [];
      const discardedBloodIds = [];

      for (const ncRecord of ncResult.rows) {
        // Check for duplicate with BOTH serial_id AND category
        const checkExistingQuery = `
          SELECT db_id FROM discarded_blood 
          WHERE db_serial_id = $1 AND db_category = $2
        `;
        const existingResult = await client.query(checkExistingQuery, [
          ncRecord.nc_serial_id,
          "Platelet",
        ]);

        if (existingResult.rows.length > 0) {
          console.warn(
            `Serial ID ${ncRecord.nc_serial_id} already exists in discarded_blood for Platelet category, skipping`
          );
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
          "Discarded",
          ncRecord.nc_created_at,
          "Platelet",
          ncRecord.nc_id,
          discardData.responsiblePersonnel,
          discardData.reasonForDiscarding,
          discardData.authorizedBy,
          new Date(discardData.dateOfDiscard),
          discardData.timeOfDiscard,
          discardData.methodOfDisposal,
          discardData.remarks || "",
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

      const invoiceResult = await this.generateDiscardedInvoiceWithClient(
        client,
        discardData,
        discardedBloodIds
      );

      await client.query("COMMIT");
      return {
        success: true,
        discardedCount: discardedCount,
        invoiceId: invoiceResult.invoiceId,
        invoiceDbId: invoiceResult.invoiceDbId,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error discarding platelet non-conforming stock:", error);
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
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error fetching plasma non-conforming records:", error);
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
      console.error("Error fetching plasma stock by serial ID for NC:", error);
      throw error;
    }
  },

  // Transfer plasma stock to non-conforming
  async transferPlasmaToNonConforming(serialIds) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const getStockQuery = `
        SELECT * FROM blood_stock 
        WHERE bs_serial_id = ANY($1) 
          AND bs_status = 'Stored'
          AND bs_category = 'Plasma'
      `;
      const stockResult = await client.query(getStockQuery, [serialIds]);

      if (stockResult.rows.length === 0) {
        throw new Error(
          "No valid Plasma stock records found for transfer to non-conforming"
        );
      }

      let transferredCount = 0;
      const serialIdsToDelete = [];

      for (const stockRecord of stockResult.rows) {
        const checkExistingQuery = `
          SELECT nc_id FROM non_conforming 
          WHERE nc_serial_id = $1 AND nc_category = 'Plasma'
        `;
        const existingResult = await client.query(checkExistingQuery, [
          stockRecord.bs_serial_id,
        ]);

        if (existingResult.rows.length > 0) {
          console.warn(
            `Serial ID ${stockRecord.bs_serial_id} already exists in non_conforming for Plasma category, skipping`
          );
          continue;
        }

        const insertQuery = `
          INSERT INTO non_conforming (
            nc_serial_id, nc_blood_type, nc_rh_factor, nc_volume,
            nc_timestamp, nc_expiration_date, nc_status, nc_created_at, nc_category, nc_source
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `;

        const values = [
          stockRecord.bs_serial_id,
          stockRecord.bs_blood_type,
          stockRecord.bs_rh_factor,
          stockRecord.bs_volume,
          stockRecord.bs_timestamp,
          stockRecord.bs_expiration_date,
          "Non-Conforming",
          stockRecord.bs_created_at,
          "Plasma",
          stockRecord.bs_source || "Walk-In",
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

      await client.query("COMMIT");
      return { success: true, transferredCount: transferredCount };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error transferring plasma to non-conforming:", error);
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
        "Non-Conforming",
        "Plasma",
      ];

      await pool.query(query, values);
      return true;
    } catch (error) {
      console.error("Error updating plasma non-conforming record:", error);
      throw error;
    }
  },

  // Delete plasma non-conforming records
  async deletePlasmaNonConforming(ids) {
    try {
      const query =
        "DELETE FROM non_conforming WHERE nc_id = ANY($1) AND nc_category = 'Plasma'";
      await pool.query(query, [ids]);
      return true;
    } catch (error) {
      console.error("Error deleting plasma non-conforming records:", error);
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
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error searching plasma non-conforming records:", error);
      throw error;
    }
  },

  // Discard plasma non-conforming stock
  async discardPlasmaNonConformingStock(discardData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const getNonConformingQuery = `
        SELECT * FROM non_conforming 
        WHERE nc_serial_id = ANY($1) AND nc_category = 'Plasma'
      `;
      const ncResult = await client.query(getNonConformingQuery, [
        discardData.serialIds,
      ]);

      if (ncResult.rows.length === 0) {
        throw new Error(
          "No valid plasma non-conforming records found for discard"
        );
      }

      let discardedCount = 0;
      const serialIdsToDelete = [];
      const discardedBloodIds = [];

      for (const ncRecord of ncResult.rows) {
        // Check for duplicate with BOTH serial_id AND category
        const checkExistingQuery = `
          SELECT db_id FROM discarded_blood 
          WHERE db_serial_id = $1 AND db_category = $2
        `;
        const existingResult = await client.query(checkExistingQuery, [
          ncRecord.nc_serial_id,
          "Plasma",
        ]);

        if (existingResult.rows.length > 0) {
          console.warn(
            `Serial ID ${ncRecord.nc_serial_id} already exists in discarded_blood for Plasma category, skipping`
          );
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
          "Discarded",
          ncRecord.nc_created_at,
          "Plasma",
          ncRecord.nc_id,
          discardData.responsiblePersonnel,
          discardData.reasonForDiscarding,
          discardData.authorizedBy,
          new Date(discardData.dateOfDiscard),
          discardData.timeOfDiscard,
          discardData.methodOfDisposal,
          discardData.remarks || "",
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

      const invoiceResult = await this.generateDiscardedInvoiceWithClient(
        client,
        discardData,
        discardedBloodIds
      );

      await client.query("COMMIT");
      return {
        success: true,
        discardedCount: discardedCount,
        invoiceId: invoiceResult.invoiceId,
        invoiceDbId: invoiceResult.invoiceDbId,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error discarding plasma non-conforming stock:", error);
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
      const invoiceIdResult = await client.query(
        "SELECT generate_invoice_id() as invoice_id"
      );
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
        releaseData.receivingFacility || "",
        releaseData.classification || "",
        releaseData.dateOfRelease
          ? new Date(releaseData.dateOfRelease)
          : new Date(),
        releaseData.releasedBy || "",
        releaseData.requestReference || "",
        releaseData.releasedBy || "",
        releaseData.verifiedBy || "",
      ];

      const invoiceResult = await client.query(
        insertInvoiceQuery,
        invoiceValues
      );
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
            rb.rb_volume,
          ]);

          // Update released_blood with invoice reference
          await client.query(
            "UPDATE released_blood SET rb_invoice_id = $1 WHERE rb_id = $2",
            [invoiceDbId, rbId]
          );
        }
      }

      return { success: true, invoiceId: invoiceId, invoiceDbId: invoiceDbId };
    } catch (error) {
      console.error("Error generating invoice:", error);
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
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error fetching invoices:", error);
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
        throw new Error("Invoice not found");
      }

      return {
        header: headerResult.rows[0],
        items: itemsResult.rows,
      };
    } catch (error) {
      console.error("Error fetching invoice details:", error);
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
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error searching invoices:", error);
      throw error;
    }
  },

  // Delete invoices
  async deleteInvoices(invoiceIds) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Ensure invoiceIds is an array and contains valid integers
      if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
        throw new Error("Invalid invoice IDs provided");
      }

      // Get all released_blood IDs associated with these invoices
      const getReleasedBloodQuery = `
      SELECT DISTINCT bii.bii_released_blood_id
      FROM blood_invoice_items bii
      WHERE bii.bii_invoice_id = ANY($1::integer[])
    `;
      const releasedBloodResult = await client.query(getReleasedBloodQuery, [
        invoiceIds,
      ]);
      const releasedBloodIds = releasedBloodResult.rows
        .map((row) => row.bii_released_blood_id)
        .filter((id) => id !== null);

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
      const deleteResult = await client.query(deleteInvoicesQuery, [
        invoiceIds,
      ]);

      // Clear invoice reference from released_blood records
      if (releasedBloodIds.length > 0) {
        const clearInvoiceRefQuery = `
        UPDATE released_blood
        SET rb_invoice_id = NULL
        WHERE rb_id = ANY($1::integer[])
      `;
        await client.query(clearInvoiceRefQuery, [releasedBloodIds]);
      }

      await client.query("COMMIT");

      return {
        success: true,
        deletedCount: deleteResult.rowCount,
        message: `Successfully deleted ${deleteResult.rowCount} invoice(s)`,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error deleting invoices:", error);
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
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const milliseconds = String(now.getMilliseconds()).padStart(3, "0");

      const timestamp = `${year}${month}${day}-${hours}${minutes}${seconds}-${milliseconds}`;

      return timestamp;
    } catch (error) {
      console.error("Error generating discarded invoice ID:", error);
      throw error;
    }
  },

  // Generate reference number for discarded invoice
  async generateDiscardedReferenceNumber(category) {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const milliseconds = String(now.getMilliseconds()).padStart(3, "0");

      // Determine category prefix
      let categoryPrefix = "RBC";
      if (category === "Platelet") {
        categoryPrefix = "PLT";
      } else if (category === "Plasma") {
        categoryPrefix = "PLS";
      }

      const datePart = `${year}${month}${day}`;
      const timePart = `${hours}${minutes}${seconds}`;
      const uniquePart = milliseconds;

      return `REF-${categoryPrefix}-${datePart}-${timePart}-${uniquePart}`;
    } catch (error) {
      console.error("Error generating discarded reference number:", error);
      throw error;
    }
  },

  // Generate discarded invoice using existing transaction client
  async generateDiscardedInvoiceWithClient(
    client,
    discardData,
    discardedBloodIds
  ) {
    try {
      // Generate invoice ID
      const invoiceIdResult = await client.query(
        "SELECT generate_discarded_invoice_id() as invoice_id"
      );
      const invoiceId = invoiceIdResult.rows[0].invoice_id;

      // Determine category from first discarded blood item
      let category = "Red Blood Cell"; // default
      if (discardedBloodIds.length > 0) {
        const categoryQuery = `
          SELECT db_category FROM discarded_blood WHERE db_id = $1
        `;
        const categoryResult = await client.query(categoryQuery, [
          discardedBloodIds[0],
        ]);
        if (categoryResult.rows.length > 0) {
          category = categoryResult.rows[0].db_category;
        }
      }

      // Generate reference number based on category
      const referenceNumber =
        await this.generateDiscardedReferenceNumber(category);

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
        discardData.responsiblePersonnel || "",
        discardData.reasonForDiscarding || "",
        discardData.authorizedBy || "",
        discardData.dateOfDiscard
          ? new Date(discardData.dateOfDiscard)
          : new Date(),
        discardData.timeOfDiscard || "",
        discardData.methodOfDisposal || "",
        discardData.remarks || "",
      ];

      const invoiceResult = await client.query(
        insertInvoiceQuery,
        invoiceValues
      );
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
            db.db_volume,
          ]);

          // Update discarded_blood with invoice reference
          await client.query(
            "UPDATE discarded_blood SET db_invoice_id = $1 WHERE db_id = $2",
            [invoiceDbId, dbId]
          );
        }
      }

      return {
        success: true,
        invoiceId: invoiceId,
        invoiceDbId: invoiceDbId,
        referenceNumber: referenceNumber,
      };
    } catch (error) {
      console.error("Error generating discarded invoice:", error);
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
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error fetching discarded invoices:", error);
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
        throw new Error("Discarded invoice not found");
      }

      return {
        header: headerResult.rows[0],
        items: itemsResult.rows,
      };
    } catch (error) {
      console.error("Error fetching discarded invoice details:", error);
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
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error searching discarded invoices:", error);
      throw error;
    }
  },

  // Delete discarded invoices
  async deleteDiscardedBloodInvoices(invoiceIds) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
        throw new Error("Invalid invoice IDs provided");
      }

      // Get all discarded_blood IDs associated with these invoices
      const getDiscardedBloodQuery = `
        SELECT DISTINCT dbii.dbii_discarded_blood_id
        FROM discarded_blood_invoice_items dbii
        WHERE dbii.dbii_invoice_id = ANY($1::integer[])
      `;
      const discardedBloodResult = await client.query(getDiscardedBloodQuery, [
        invoiceIds,
      ]);
      const discardedBloodIds = discardedBloodResult.rows
        .map((row) => row.dbii_discarded_blood_id)
        .filter((id) => id !== null);

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
      const deleteResult = await client.query(deleteInvoicesQuery, [
        invoiceIds,
      ]);

      await client.query("COMMIT");

      return {
        success: true,
        deletedCount: deleteResult.rowCount,
        message: `Successfully deleted ${deleteResult.rowCount} invoice(s)`,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error deleting discarded invoices:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  // ========== BLOOD REPORTS METHODS ==========
  // Get all blood reports
  async getAllBloodReports() {
    try {
      const query = `
      SELECT 
        br_id as id,
        br_report_id as "docId",
        br_quarter as quarter,
        br_year as year,
        br_month_start as "monthStart",
        br_month_end as "monthEnd",
        br_month_labels as "monthLabels",
        br_o_positive as "oPositive",
        br_o_negative as "oNegative",
        br_a_positive as "aPositive",
        br_a_negative as "aNegative",
        br_b_positive as "bPositive",
        br_b_negative as "bNegative",
        br_ab_positive as "abPositive",
        br_ab_negative as "abNegative",
        br_others as others,
        br_o_positive_pct as "oPositivePct",
        br_o_negative_pct as "oNegativePct",
        br_a_positive_pct as "aPositivePct",
        br_a_negative_pct as "aNegativePct",
        br_b_positive_pct as "bPositivePct",
        br_b_negative_pct as "bNegativePct",
        br_ab_positive_pct as "abPositivePct",
        br_ab_negative_pct as "abNegativePct",
        br_others_pct as "othersPct",
        br_total_count as total,
        br_month1_data as "month1Data",
        br_month2_data as "month2Data",
        br_month3_data as "month3Data",
        br_created_by as "createdBy",
        TO_CHAR(br_created_at, 'MM/DD/YYYY') as "dateCreated"
      FROM blood_reports
      ORDER BY br_year DESC, br_month_start DESC
    `;

      const result = await pool.query(query);
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error fetching blood reports:", error);
      throw error;
    }
  },

  // Check if quarter has ended
  async canGenerateQuarterReport(quarter, year) {
    try {
      const query = `
      SELECT 
        CASE 
          WHEN $2 < EXTRACT(YEAR FROM CURRENT_DATE) THEN TRUE
          WHEN $2 = EXTRACT(YEAR FROM CURRENT_DATE) THEN
            CASE $1
              WHEN '1st Quarter' THEN EXTRACT(MONTH FROM CURRENT_DATE) > 3
              WHEN '2nd Quarter' THEN EXTRACT(MONTH FROM CURRENT_DATE) > 6
              WHEN '3rd Quarter' THEN EXTRACT(MONTH FROM CURRENT_DATE) > 9
              WHEN '4th Quarter' THEN EXTRACT(MONTH FROM CURRENT_DATE) > 12
              ELSE FALSE
            END
          ELSE FALSE
        END as can_generate
    `;

      const result = await pool.query(query, [quarter, year]);
      return result.rows[0].can_generate;
    } catch (error) {
      console.error("Error checking quarter status:", error);
      throw error;
    }
  },

  async generateQuarterlyReport(quarter, year) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Determine quarter months
      let monthStart, monthEnd, monthLabels;
      switch (quarter) {
        case "1st Quarter":
          monthStart = 1;
          monthEnd = 3;
          monthLabels = ["Jan", "Feb", "Mar"];
          break;
        case "2nd Quarter":
          monthStart = 4;
          monthEnd = 6;
          monthLabels = ["Apr", "May", "Jun"];
          break;
        case "3rd Quarter":
          monthStart = 7;
          monthEnd = 9;
          monthLabels = ["Jul", "Aug", "Sep"];
          break;
        case "4th Quarter":
          monthStart = 10;
          monthEnd = 12;
          monthLabels = ["Oct", "Nov", "Dec"];
          break;
        default:
          throw new Error("Invalid quarter");
      }

      const yearInt = parseInt(year);

      // Only check if trying to generate reports for future quarters
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      if (yearInt > currentYear) {
        throw new Error(`Cannot generate report for future year ${yearInt}`);
      }

      if (yearInt === currentYear && currentMonth <= monthEnd) {
        throw new Error(`Quarter ${quarter} of ${yearInt} has not ended yet`);
      }

      // Check if there's any data for this quarter
      const dataCheckQuery = `
        SELECT COUNT(*) as count
        FROM blood_stock_history
        WHERE 
          EXTRACT(YEAR FROM bsh_timestamp)::integer = $1::integer
          AND EXTRACT(MONTH FROM bsh_timestamp)::integer BETWEEN $2::integer AND $3::integer
          AND bsh_action = 'ADDED'
          AND bsh_category = 'Red Blood Cell'
      `;

      const dataCheckResult = await client.query(dataCheckQuery, [
        yearInt,
        monthStart,
        monthEnd,
      ]);
      const hasData = parseInt(dataCheckResult.rows[0].count) > 0;

      if (!hasData) {
        console.log(`No data found for ${quarter} ${yearInt}, skipping...`);
        await client.query("ROLLBACK");
        return {
          success: false,
          message: `No data available for ${quarter} ${yearInt}`,
        };
      }

      // Generate report ID
      const reportIdQuery = `
        SELECT COALESCE(
          'DOC-' || $1::text || '-' || 
          LPAD((
            SELECT COUNT(*) + 1 
            FROM blood_reports 
            WHERE br_year = $1::integer
          )::text, 3, '0'),
          'DOC-' || $1::text || '-001'
        ) as report_id
      `;
      const reportIdResult = await client.query(reportIdQuery, [yearInt]);
      const reportId = reportIdResult.rows[0].report_id;

      // Query to get data separated by source (Mobile vs Walk-In)
      const statsQuery = `
        WITH quarter_data AS (
          SELECT 
            bsh_blood_type,
            bsh_rh_factor,
            bsh_source,
            EXTRACT(MONTH FROM bsh_timestamp)::integer as month_num,
            COUNT(*)::integer as count
          FROM blood_stock_history
          WHERE 
            EXTRACT(YEAR FROM bsh_timestamp)::integer = $1::integer
            AND EXTRACT(MONTH FROM bsh_timestamp)::integer BETWEEN $2::integer AND $3::integer
            AND bsh_action = 'ADDED'
            AND bsh_category = 'Red Blood Cell'
          GROUP BY bsh_blood_type, bsh_rh_factor, bsh_source, EXTRACT(MONTH FROM bsh_timestamp)
        )
        SELECT 
          bsh_blood_type || bsh_rh_factor as blood_type,
          bsh_source as source,
          month_num,
          SUM(count)::integer as total
        FROM quarter_data
        GROUP BY bsh_blood_type, bsh_rh_factor, bsh_source, month_num
      `;

      const statsResult = await client.query(statsQuery, [
        yearInt,
        monthStart,
        monthEnd,
      ]);

      // Initialize counters for Mobile and Walk-In separately
      const bloodTypes = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

      // Mobile data
      const mobileMonthlyCounts = {
        [monthStart]: {},
        [monthStart + 1]: {},
        [monthStart + 2]: {},
      };
      const mobileQuarterTotals = {};

      // Walk-In data
      const walkInMonthlyCounts = {
        [monthStart]: {},
        [monthStart + 1]: {},
        [monthStart + 2]: {},
      };
      const walkInQuarterTotals = {};

      // Initialize all blood types to 0
      bloodTypes.forEach((type) => {
        // Mobile
        mobileQuarterTotals[type] = 0;
        mobileMonthlyCounts[monthStart][type] = 0;
        mobileMonthlyCounts[monthStart + 1][type] = 0;
        mobileMonthlyCounts[monthStart + 2][type] = 0;

        // Walk-In
        walkInQuarterTotals[type] = 0;
        walkInMonthlyCounts[monthStart][type] = 0;
        walkInMonthlyCounts[monthStart + 1][type] = 0;
        walkInMonthlyCounts[monthStart + 2][type] = 0;
      });

      // Process query results and separate by source
      statsResult.rows.forEach((row) => {
        const type = row.blood_type;
        const source = row.source;
        const month = parseInt(row.month_num);
        const count = parseInt(row.total);

        if (!bloodTypes.includes(type)) return;

        if (source === "Mobile") {
          if (mobileMonthlyCounts[month]) {
            mobileMonthlyCounts[month][type] = count;
            mobileQuarterTotals[type] += count;
          }
        } else if (source === "Walk-In") {
          if (walkInMonthlyCounts[month]) {
            walkInMonthlyCounts[month][type] = count;
            walkInQuarterTotals[type] += count;
          }
        }
      });

      // Calculate grand totals
      const mobileGrandTotal = Object.values(mobileQuarterTotals).reduce(
        (sum, val) => sum + val,
        0
      );
      const walkInGrandTotal = Object.values(walkInQuarterTotals).reduce(
        (sum, val) => sum + val,
        0
      );
      const combinedGrandTotal = mobileGrandTotal + walkInGrandTotal;

      // Calculate Mobile monthly percentages (relative to mobile grand total)
      const mobileMonthlyPercentages = {};
      Object.keys(mobileMonthlyCounts).forEach((month) => {
        mobileMonthlyPercentages[month] = {};
        bloodTypes.forEach((type) => {
          mobileMonthlyPercentages[month][type] =
            mobileGrandTotal > 0
              ? (
                  (mobileMonthlyCounts[month][type] / mobileGrandTotal) *
                  100
                ).toFixed(2)
              : "0.00";
        });
      });

      // Calculate Walk-In monthly percentages (relative to walk-in grand total)
      const walkInMonthlyPercentages = {};
      Object.keys(walkInMonthlyCounts).forEach((month) => {
        walkInMonthlyPercentages[month] = {};
        bloodTypes.forEach((type) => {
          walkInMonthlyPercentages[month][type] =
            walkInGrandTotal > 0
              ? (
                  (walkInMonthlyCounts[month][type] / walkInGrandTotal) *
                  100
                ).toFixed(2)
              : "0.00";
        });
      });

      // Prepare Mobile monthly data as JSONB
      const mobileMonth1Data = {
        counts: mobileMonthlyCounts[monthStart],
        percentages: mobileMonthlyPercentages[monthStart],
        total: Object.values(mobileMonthlyCounts[monthStart]).reduce(
          (sum, val) => sum + val,
          0
        ),
      };
      const mobileMonth2Data = {
        counts: mobileMonthlyCounts[monthStart + 1],
        percentages: mobileMonthlyPercentages[monthStart + 1],
        total: Object.values(mobileMonthlyCounts[monthStart + 1]).reduce(
          (sum, val) => sum + val,
          0
        ),
      };
      const mobileMonth3Data = {
        counts: mobileMonthlyCounts[monthStart + 2],
        percentages: mobileMonthlyPercentages[monthStart + 2],
        total: Object.values(mobileMonthlyCounts[monthStart + 2]).reduce(
          (sum, val) => sum + val,
          0
        ),
      };

      // Calculate mobile monthly total percentages
      mobileMonth1Data.totalPct =
        mobileGrandTotal > 0
          ? ((mobileMonth1Data.total / mobileGrandTotal) * 100).toFixed(1)
          : "0.0";
      mobileMonth2Data.totalPct =
        mobileGrandTotal > 0
          ? ((mobileMonth2Data.total / mobileGrandTotal) * 100).toFixed(1)
          : "0.0";
      mobileMonth3Data.totalPct =
        mobileGrandTotal > 0
          ? ((mobileMonth3Data.total / mobileGrandTotal) * 100).toFixed(1)
          : "0.0";

      // Prepare Walk-In monthly data as JSONB
      const walkInMonth1Data = {
        counts: walkInMonthlyCounts[monthStart],
        percentages: walkInMonthlyPercentages[monthStart],
        total: Object.values(walkInMonthlyCounts[monthStart]).reduce(
          (sum, val) => sum + val,
          0
        ),
      };
      const walkInMonth2Data = {
        counts: walkInMonthlyCounts[monthStart + 1],
        percentages: walkInMonthlyPercentages[monthStart + 1],
        total: Object.values(walkInMonthlyCounts[monthStart + 1]).reduce(
          (sum, val) => sum + val,
          0
        ),
      };
      const walkInMonth3Data = {
        counts: walkInMonthlyCounts[monthStart + 2],
        percentages: walkInMonthlyPercentages[monthStart + 2],
        total: Object.values(walkInMonthlyCounts[monthStart + 2]).reduce(
          (sum, val) => sum + val,
          0
        ),
      };

      // Calculate walk-in monthly total percentages
      walkInMonth1Data.totalPct =
        walkInGrandTotal > 0
          ? ((walkInMonth1Data.total / walkInGrandTotal) * 100).toFixed(1)
          : "0.0";
      walkInMonth2Data.totalPct =
        walkInGrandTotal > 0
          ? ((walkInMonth2Data.total / walkInGrandTotal) * 100).toFixed(1)
          : "0.0";
      walkInMonth3Data.totalPct =
        walkInGrandTotal > 0
          ? ((walkInMonth3Data.total / walkInGrandTotal) * 100).toFixed(1)
          : "0.0";

      // Combine monthly data with mobile and walkIn sections
      const month1Data = {
        mobile: mobileMonth1Data,
        walkIn: walkInMonth1Data,
      };
      const month2Data = {
        mobile: mobileMonth2Data,
        walkIn: walkInMonth2Data,
      };
      const month3Data = {
        mobile: mobileMonth3Data,
        walkIn: walkInMonth3Data,
      };

      // Calculate combined percentages (for backward compatibility if needed)
      const combinedTotals = {};
      const combinedPercentages = {};
      bloodTypes.forEach((type) => {
        combinedTotals[type] =
          mobileQuarterTotals[type] + walkInQuarterTotals[type];
        combinedPercentages[type] =
          combinedGrandTotal > 0
            ? ((combinedTotals[type] / combinedGrandTotal) * 100).toFixed(2)
            : "0.00";
      });

      // Insert or update report
      const insertQuery = `
        INSERT INTO blood_reports (
          br_report_id, br_quarter, br_year, br_month_start, br_month_end, br_month_labels,
          br_o_positive, br_o_negative, br_a_positive, br_a_negative,
          br_b_positive, br_b_negative, br_ab_positive, br_ab_negative,
          br_o_positive_pct, br_o_negative_pct, br_a_positive_pct, br_a_negative_pct,
          br_b_positive_pct, br_b_negative_pct, br_ab_positive_pct, br_ab_negative_pct,
          br_total_count, br_month1_data, br_month2_data, br_month3_data,
          br_created_by, br_created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6::text[],
          $7, $8, $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19, $20, $21, $22,
          $23, $24::jsonb, $25::jsonb, $26::jsonb, $27, NOW()
        )
        ON CONFLICT (br_quarter, br_year)
        DO UPDATE SET
          br_report_id = $1,
          br_month_start = $4,
          br_month_end = $5,
          br_month_labels = $6::text[],
          br_o_positive = $7, 
          br_o_negative = $8, 
          br_a_positive = $9, 
          br_a_negative = $10,
          br_b_positive = $11, 
          br_b_negative = $12, 
          br_ab_positive = $13, 
          br_ab_negative = $14,
          br_o_positive_pct = $15, 
          br_o_negative_pct = $16, 
          br_a_positive_pct = $17, 
          br_a_negative_pct = $18,
          br_b_positive_pct = $19, 
          br_b_negative_pct = $20, 
          br_ab_positive_pct = $21, 
          br_ab_negative_pct = $22,
          br_total_count = $23, 
          br_month1_data = $24::jsonb, 
          br_month2_data = $25::jsonb, 
          br_month3_data = $26::jsonb,
          br_modified_at = NOW()
        RETURNING br_id
      `;

      const values = [
        reportId, // $1
        quarter, // $2
        yearInt, // $3
        monthStart, // $4
        monthEnd, // $5
        monthLabels, // $6
        combinedTotals["O+"], // $7
        combinedTotals["O-"], // $8
        combinedTotals["A+"], // $9
        combinedTotals["A-"], // $10
        combinedTotals["B+"], // $11
        combinedTotals["B-"], // $12
        combinedTotals["AB+"], // $13
        combinedTotals["AB-"], // $14
        combinedPercentages["O+"], // $15
        combinedPercentages["O-"], // $16
        combinedPercentages["A+"], // $17
        combinedPercentages["A-"], // $18
        combinedPercentages["B+"], // $19
        combinedPercentages["B-"], // $20
        combinedPercentages["AB+"], // $21
        combinedPercentages["AB-"], // $22
        combinedGrandTotal, // $23
        JSON.stringify(month1Data), // $24
        JSON.stringify(month2Data), // $25
        JSON.stringify(month3Data), // $26
        "Auto-generated", // $27
      ];

      await client.query(insertQuery, values);
      await client.query("COMMIT");

      console.log(`✓ Generated report for ${quarter} ${yearInt}`);

      return {
        success: true,
        reportId,
        quarter,
        year: yearInt,
        total: combinedGrandTotal,
        mobileTotal: mobileGrandTotal,
        walkInTotal: walkInGrandTotal,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error generating quarterly report:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Get reports by year
  async getReportsByYear(year) {
    try {
      const query = `
      SELECT 
        br_id as id,
        br_report_id as "docId",
        br_quarter as quarter,
        br_year as year,
        br_month_start as "monthStart",
        br_month_end as "monthEnd",
        br_month_labels as "monthLabels",
        br_o_positive as "oPositive",
        br_o_negative as "oNegative",
        br_a_positive as "aPositive",
        br_a_negative as "aNegative",
        br_b_positive as "bPositive",
        br_b_negative as "bNegative",
        br_ab_positive as "abPositive",
        br_ab_negative as "abNegative",
        br_others as others,
        br_o_positive_pct as "oPositivePct",
        br_o_negative_pct as "oNegativePct",
        br_a_positive_pct as "aPositivePct",
        br_a_negative_pct as "aNegativePct",
        br_b_positive_pct as "bPositivePct",
        br_b_negative_pct as "bNegativePct",
        br_ab_positive_pct as "abPositivePct",
        br_ab_negative_pct as "abNegativePct",
        br_others_pct as "othersPct",
        br_total_count as total,
        br_month1_data as "month1Data",
        br_month2_data as "month2Data",
        br_month3_data as "month3Data",
        br_created_by as "createdBy",
        TO_CHAR(br_created_at, 'MM/DD/YYYY') as "dateCreated"
      FROM blood_reports
      WHERE br_year = $1
      ORDER BY br_month_start
    `;

      const result = await pool.query(query, [year]);
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error fetching reports by year:", error);
      throw error;
    }
  },

  // Get report by ID (updated to include new fields)
  async getReportById(reportId) {
    try {
      const query = `
      SELECT 
        br_id as id,
        br_report_id as "docId",
        br_quarter as quarter,
        br_year as year,
        br_month_start as "monthStart",
        br_month_end as "monthEnd",
        br_month_labels as "monthLabels",
        br_o_positive as "oPositive",
        br_o_negative as "oNegative",
        br_a_positive as "aPositive",
        br_a_negative as "aNegative",
        br_b_positive as "bPositive",
        br_b_negative as "bNegative",
        br_ab_positive as "abPositive",
        br_ab_negative as "abNegative",
        br_others as others,
        br_o_positive_pct as "oPositivePct",
        br_o_negative_pct as "oNegativePct",
        br_a_positive_pct as "aPositivePct",
        br_a_negative_pct as "aNegativePct",
        br_b_positive_pct as "bPositivePct",
        br_b_negative_pct as "bNegativePct",
        br_ab_positive_pct as "abPositivePct",
        br_ab_negative_pct as "abNegativePct",
        br_others_pct as "othersPct",
        br_total_count as total,
        br_month1_data as "month1Data",
        br_month2_data as "month2Data",
        br_month3_data as "month3Data",
        br_created_by as "createdBy",
        TO_CHAR(br_created_at, 'MM/DD/YYYY') as "dateCreated"
      FROM blood_reports
      WHERE br_id = $1
    `;

      const result = await pool.query(query, [reportId]);
      return result.rows[0];
    } catch (error) {
      console.error("Error fetching report by ID:", error);
      throw error;
    }
  },

  // Delete reports
  async deleteReports(reportIds) {
    try {
      const query = `DELETE FROM blood_reports WHERE br_id = ANY($1)`;
      await pool.query(query, [reportIds]);
      return { success: true };
    } catch (error) {
      console.error("Error deleting reports:", error);
      throw error;
    }
  },

  // Search reports
  async searchReports(searchTerm) {
    try {
      const query = `
      SELECT 
        br_id as id,
        br_report_id as "docId",
        br_quarter as quarter,
        br_year as year,
        br_month_start as "monthStart",
        br_month_end as "monthEnd",
        br_month_labels as "monthLabels",
        br_o_positive as "oPositive",
        br_o_negative as "oNegative",
        br_a_positive as "aPositive",
        br_a_negative as "aNegative",
        br_b_positive as "bPositive",
        br_b_negative as "bNegative",
        br_ab_positive as "abPositive",
        br_ab_negative as "abNegative",
        br_others as others,
        br_o_positive_pct as "oPositivePct",
        br_o_negative_pct as "oNegativePct",
        br_a_positive_pct as "aPositivePct",
        br_a_negative_pct as "aNegativePct",
        br_b_positive_pct as "bPositivePct",
        br_b_negative_pct as "bNegativePct",
        br_ab_positive_pct as "abPositivePct",
        br_ab_negative_pct as "abNegativePct",
        br_others_pct as "othersPct",
        br_total_count as total,
        br_month1_data as "month1Data",
        br_month2_data as "month2Data",
        br_month3_data as "month3Data",
        br_created_by as "createdBy",
        TO_CHAR(br_created_at, 'MM/DD/YYYY') as "dateCreated"
      FROM blood_reports
      WHERE 
        br_report_id ILIKE $1 OR
        br_quarter ILIKE $1 OR
        CAST(br_year AS TEXT) ILIKE $1 OR
        br_created_by ILIKE $1
      ORDER BY br_year DESC, br_month_start DESC
    `;

      const result = await pool.query(query, [`%${searchTerm}%`]);
      return result.rows.map((row) => ({
        ...row,
        selected: false,
      }));
    } catch (error) {
      console.error("Error searching reports:", error);
      throw error;
    }
  },

  // Refresh/regenerate reports for current year
  async refreshCurrentYearReports() {
    try {
      const currentYear = new Date().getFullYear();

      // Delete existing reports for current year
      await pool.query("DELETE FROM blood_reports WHERE br_year = $1", [
        currentYear,
      ]);

      // Generate all available quarters
      await this.generateAllQuarterlyReports(currentYear);

      return await this.getReportsByYear(currentYear);
    } catch (error) {
      console.error("Error refreshing current year reports:", error);
      throw error;
    }
  },

  async addToBloodStockHistory(
    stockData,
    action = "ADDED",
    originalStockId = null
  ) {
    try {
      const query = `
      INSERT INTO blood_stock_history (
        bsh_serial_id, bsh_blood_type, bsh_rh_factor, bsh_volume,
        bsh_timestamp, bsh_expiration_date, bsh_status, bsh_category,
        bsh_original_stock_id, bsh_action, bsh_action_timestamp, bsh_source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11)
      RETURNING bsh_id
    `;

      const values = [
        stockData.serial_id,
        stockData.type,
        stockData.rhFactor,
        parseInt(stockData.volume),
        new Date(stockData.collection),
        new Date(stockData.expiration),
        stockData.status || "Stored",
        stockData.category || "Red Blood Cell",
        originalStockId,
        action,
        stockData.source || "Walk-In",
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("Error adding to blood stock history:", error);
      throw error;
    }
  },

  // Generate all available quarterly reports for a year
  async generateAllQuarterlyReports(year) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    const quarters = [
      { name: "1st Quarter", endMonth: 3 },
      { name: "2nd Quarter", endMonth: 6 },
      { name: "3rd Quarter", endMonth: 9 },
      { name: "4th Quarter", endMonth: 12 },
    ];

    const generatedReports = [];

    for (const quarter of quarters) {
      try {
        // For past years, generate all quarters
        // For current year, only generate completed quarters
        if (
          year < currentYear ||
          (year === currentYear && currentMonth > quarter.endMonth)
        ) {
          const report = await this.generateQuarterlyReport(quarter.name, year);
          if (report.success) {
            generatedReports.push(report);
          }
        } else {
          console.log(
            `Skipping ${quarter.name} ${year}: Quarter not yet completed`
          );
        }
      } catch (error) {
        console.log(
          `Error generating ${quarter.name} ${year}: ${error.message}`
        );
      }
    }

    return generatedReports;
  },

  // ADD THIS NEW METHOD to get all years that have blood stock data:
  async getAllYearsWithData() {
    try {
      const query = `
      SELECT DISTINCT EXTRACT(YEAR FROM bsh_timestamp)::integer as year
      FROM blood_stock_history
      WHERE bsh_action = 'ADDED' AND bsh_category = 'Red Blood Cell'
      ORDER BY year DESC
    `;

      const result = await pool.query(query);
      return result.rows.map((row) => row.year);
    } catch (error) {
      console.error("Error fetching years with data:", error);
      throw error;
    }
  },

  // ADD THIS NEW METHOD to generate all historical reports:
  async generateAllHistoricalReports() {
    try {
      const years = await this.getAllYearsWithData();
      console.log("Found data for years:", years);

      const allGeneratedReports = [];

      for (const year of years) {
        console.log(`Generating reports for year ${year}...`);
        const yearReports = await this.generateAllQuarterlyReports(year);
        allGeneratedReports.push(...yearReports);
      }

      return allGeneratedReports;
    } catch (error) {
      console.error("Error generating all historical reports:", error);
      throw error;
    }
  },

  //=================== DASHBOARD DATA METHODS ===================
  async getReleasedBloodStockItems() {
    try {
      const query = `
        SELECT 
          rb_serial_id as "serialId",
          TO_CHAR(rb_date_of_release, 'YYYY-MM-DD') as "releasedAt",
          rb_blood_type as "bloodType",
          rb_rh_factor as "rhFactor"
        FROM released_blood
        WHERE rb_category = 'Red Blood Cell'
          AND rb_date_of_release IS NOT NULL
          AND rb_status = 'Released'
        ORDER BY rb_date_of_release DESC
      `;
  
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error fetching RBC released items:', error);
      throw error;
    }
  },
  
  async getReleasedPlasmaStockItems() {
    try {
      const query = `
        SELECT 
          rb_serial_id as "serialId",
          TO_CHAR(rb_date_of_release, 'YYYY-MM-DD') as "releasedAt",
          rb_blood_type as "bloodType",
          rb_rh_factor as "rhFactor"
        FROM released_blood
        WHERE rb_category = 'Plasma'
          AND rb_date_of_release IS NOT NULL
          AND rb_status = 'Released'
        ORDER BY rb_date_of_release DESC
      `;
  
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error fetching Plasma released items:', error);
      throw error;
    }
  },
  
  async getReleasedPlateletStockItems() {
    try {
      const query = `
        SELECT 
          rb_serial_id as "serialId",
          TO_CHAR(rb_date_of_release, 'YYYY-MM-DD') as "releasedAt",
          rb_blood_type as "bloodType",
          rb_rh_factor as "rhFactor"
        FROM released_blood
        WHERE rb_category = 'Platelet'
          AND rb_date_of_release IS NOT NULL
          AND rb_status = 'Released'
        ORDER BY rb_date_of_release DESC
      `;
  
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error fetching Platelet released items:', error);
      throw error;
    }
  },

    // Get blood stock history for a specific year
  async getBloodStockHistory(year) {
    try {
      const query = `
        SELECT 
          bsh_serial_id as serial_id,
          bsh_blood_type as type,
          bsh_rh_factor as "rhFactor",
          bsh_timestamp,
          bsh_category as category,
          bsh_source as source,
          bsh_action as action
        FROM blood_stock_history
        WHERE EXTRACT(YEAR FROM bsh_timestamp) = $1
          AND bsh_action = 'ADDED'
        ORDER BY bsh_timestamp DESC
      `;

      const result = await pool.query(query, [year]);
      return result.rows;
    } catch (error) {
      console.error("Error fetching blood stock history:", error);
      throw error;
    }
  },

// ========== USER AUTHENTICATION METHODS ==========

// Register new user
async registerUser(userData) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Check if email already exists
    const checkEmailQuery = `
      SELECT u_id FROM users WHERE u_email = $1
    `;
    const emailCheck = await client.query(checkEmailQuery, [userData.email]);

    if (emailCheck.rows.length > 0) {
      throw new Error("Email already registered");
    }

    // Generate DOH ID
    const dohIdQuery = `SELECT generate_doh_id() as doh_id`;
    const dohIdResult = await client.query(dohIdQuery);
    const dohId = dohIdResult.rows[0].doh_id;

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Hash password
    const hashedPassword = crypto.createHash('sha256').update(userData.password).digest('hex');

    // Insert new user
    const insertQuery = `
      INSERT INTO users (
        u_doh_id, u_full_name, u_role, u_email, u_password,
        u_verification_token, u_status, u_created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING u_id, u_doh_id, u_email, u_full_name, u_role
    `;

    const values = [
      dohId,
      userData.fullName,
      userData.role,
      userData.email,
      hashedPassword,
      verificationToken,
      'pending'
    ];

    const result = await client.query(insertQuery, values);
    const newUser = result.rows[0];

    const verificationUrl = `http://localhost:5173/verify-user?token=${verificationToken}`;

    const mailOptions = {
      from: 'bloodsync.doh@gmail.com',
      to: 'bloodsync.doh@gmail.com',
      subject: 'New User Registration - BloodSync',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #165c3c; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
            .user-info { background: white; padding: 15px; border-left: 4px solid #93c242; margin: 20px 0; }
            .token-box { background: #fff3cd; border: 2px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .token { font-family: monospace; font-size: 14px; word-break: break-all; color: #856404; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New User Registration</h1>
            </div>
            <div class="content">
              <h2>A new user has registered for BloodSync</h2>
              <div class="user-info">
                <p><strong>DOH ID:</strong> ${dohId}</p>
                <p><strong>Full Name:</strong> ${userData.fullName}</p>
                <p><strong>Role:</strong> ${userData.role}</p>
                <p><strong>Email:</strong> ${userData.email}</p>
                <p><strong>Registration Date:</strong> ${new Date().toLocaleString()}</p>
              </div>
              
              <h3>Verification Instructions:</h3>
              <ol>
                <li>Open the BloodSync application</li>
                <li>Go to Admin Dashboard → User Management</li>
                <li>Find the pending user: ${userData.email}</li>
                <li>Click "Verify" to approve their account</li>
              </ol>
              
              <div class="token-box">
                <p><strong>Or use this verification token:</strong></p>
                <p class="token">${verificationToken}</p>
                <p style="font-size: 12px; margin-top: 10px;">Copy this token and paste it in the app's verification form.</p>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated message from BloodSync System</p>
              <p>&copy; 2025 Code Red Corporation - BloodSync ver. 1.0</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await emailTransporter.sendMail(mailOptions);

    await client.query("COMMIT");

    return {
      success: true,
      message: 'Registration successful! Please wait for admin approval.',
      user: newUser
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error registering user:", error);
    throw error;
  } finally {
    client.release();
  }
},

// Verify user
async verifyUser(token) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const query = `
      UPDATE users 
      SET u_status = 'verified', 
          u_verified_at = NOW(),
          u_verification_token = NULL
      WHERE u_verification_token = $1
      RETURNING u_id, u_doh_id, u_email, u_full_name, u_role
    `;

    const result = await client.query(query, [token]);

    if (result.rows.length === 0) {
      throw new Error("Invalid or expired verification token");
    }

    const verifiedUser = result.rows[0];

    // Send confirmation email to user
    const mailOptions = {
      from: 'bloodsync.doh@gmail.com',
      to: verifiedUser.u_email,
      subject: 'Account Verified - BloodSync',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #165c3c; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
            .success-box { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Account Verified!</h1>
            </div>
            <div class="content">
              <div class="success-box">
                <h2>✓ Your account has been verified</h2>
              </div>
              <p>Hello ${verifiedUser.u_full_name},</p>
              <p>Your BloodSync account has been successfully verified by the administrator.</p>
              <p><strong>Your DOH ID:</strong> ${verifiedUser.u_doh_id}</p>
              <p>You can now log in to the system using your email and password.</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Code Red Corporation - BloodSync ver. 1.0</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await emailTransporter.sendMail(mailOptions);

    await client.query("COMMIT");

    return {
      success: true,
      message: 'User verified successfully',
      user: verifiedUser
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error verifying user:", error);
    throw error;
  } finally {
    client.release();
  }
},


  // Get pending users
async getPendingUsers() {
  try {
    const query = `
      SELECT 
        u_id as id,
        u_doh_id as "dohId",
        u_full_name as "fullName",
        u_role as role,
        u_email as email,
        u_status as status,
        TO_CHAR(u_created_at, 'MM/DD/YYYY HH24:MI') as "createdAt"
      FROM users
      WHERE u_status = 'pending'
      ORDER BY u_created_at DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("Error fetching pending users:", error);
    throw error;
  }
},

// Get verified users
async getVerifiedUsers() {
  try {
    const query = `
      SELECT 
        u_id as id,
        u_doh_id as "dohId",
        u_full_name as "fullName",
        u_role as role,
        u_email as email,
        u_status as status,
        TO_CHAR(u_verified_at, 'MM/DD/YYYY HH24:MI') as "verifiedAt"
      FROM users
      WHERE u_status = 'verified'
      ORDER BY u_verified_at DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("Error fetching verified users:", error);
    throw error;
  }
},

// Verify user by ID (instead of token)
async verifyUserById(userId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const query = `
      UPDATE users 
      SET u_status = 'verified', 
          u_verified_at = NOW(),
          u_verification_token = NULL
      WHERE u_id = $1
      RETURNING u_id, u_doh_id, u_email, u_full_name, u_role
    `;

    const result = await client.query(query, [userId]);

    if (result.rows.length === 0) {
      throw new Error("User not found");
    }

    const verifiedUser = result.rows[0];

    // Send confirmation email to user
    const mailOptions = {
      from: 'bloodsync.doh@gmail.com',
      to: verifiedUser.u_email,
      subject: 'Account Verified - BloodSync',
      html: `
        <h2>Your BloodSync account has been verified!</h2>
        <p>Hello ${verifiedUser.u_full_name},</p>
        <p>Your account has been approved. You can now log in to BloodSync.</p>
        <p><strong>Your DOH ID:</strong> ${verifiedUser.u_doh_id}</p>
      `
    };

    // Only send email if transporter is configured
    try {
      await emailTransporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error("Email sending failed (non-critical):", emailError);
    }

    await client.query("COMMIT");

    return {
      success: true,
      message: 'User verified successfully',
      user: verifiedUser
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error verifying user by ID:", error);
    throw error;
  } finally {
    client.release();
  }
},

// Reject user
async rejectUser(userId) {
  try {
    const query = `DELETE FROM users WHERE u_id = $1`;
    await pool.query(query, [userId]);
    return { success: true };
  } catch (error) {
    console.error("Error rejecting user:", error);
    throw error;
  }
},

// Update user role
async updateUserRole(userId, newRole) {
  try {
    const query = `
      UPDATE users 
      SET u_role = $1
      WHERE u_id = $2
      RETURNING u_id, u_doh_id, u_email, u_full_name, u_role
    `;

    const result = await pool.query(query, [newRole, userId]);

    if (result.rows.length === 0) {
      throw new Error("User not found");
    }

    return {
      success: true,
      message: 'User role updated successfully',
      user: result.rows[0]
    };
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
},

// Remove user (delete from database)
async removeUser(userId) {
  try {
    const query = `DELETE FROM users WHERE u_id = $1`;
    await pool.query(query, [userId]);
    return { success: true, message: 'User removed successfully' };
  } catch (error) {
    console.error("Error removing user:", error);
    throw error;
  }
},

async loginUser(email, password) {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    
    const query = `
      SELECT 
        u_id as id,
        u_doh_id as "dohId",
        u_full_name as "fullName",
        u_role as role,
        u_email as email,
        u_password as password,
        u_status as status
      FROM users
      WHERE LOWER(TRIM(u_email)) = $1
    `;

    const result = await pool.query(query, [normalizedEmail]);

    if (result.rows.length === 0) {
      throw new Error("Invalid email or password");
    }

    const user = result.rows[0];

    if (user.status !== 'verified') {
      throw new Error("Account pending verification. Please wait for admin approval.");
    }

    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    
    if (user.password !== hashedPassword) {
      throw new Error("Invalid email or password");
    }

    // Update last login
    await pool.query('UPDATE users SET u_last_login = NOW() WHERE u_id = $1', [user.id]);

    // Log the login activity
    await this.logUserActivity(
      user.id,
      'LOGIN',
      `User ${user.fullName} logged into the system`
    );

    delete user.password;

    return {
      success: true,
      user
    };
  } catch (error) {
    console.error("Error logging in user:", error);
    throw error;
  }
},

async getUserProfileById(userId) {
  try {
    const query = `
      SELECT 
        u_id as id,
        u_doh_id as "dohId",
        u_full_name as "fullName",
        u_role as role,
        u_email as email,
        u_gender as gender,
        TO_CHAR(u_date_of_birth, 'YYYY-MM-DD') as "dateOfBirth",
        u_nationality as nationality,
        u_civil_status as "civilStatus",
        u_barangay as barangay,
        u_phone_number as "phoneNumber",
        u_blood_type as "bloodType",
        u_rh_factor as "rhFactor",
        u_profile_image as "profileImage",
        u_status as status,
        u_last_login as "lastLogin",
        u_created_at as "createdAt"
      FROM public.users
      WHERE u_id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error in getUserProfileById:', error);
    throw error;
  }
},

async updateUserProfile(userId, data) {
  try {
    const query = `
      UPDATE public.users
      SET 
        u_full_name = $1,
        u_gender = $2,
        u_date_of_birth = $3,
        u_nationality = $4,
        u_civil_status = $5,
        u_barangay = $6,
        u_phone_number = $7,
        u_blood_type = $8,
        u_rh_factor = $9,
        u_profile_image = $10,
        u_modified_at = NOW()
      WHERE u_id = $11
      RETURNING 
        u_id as id,
        u_doh_id as "dohId",
        u_full_name as "fullName",
        u_role as role,
        u_email as email,
        u_gender as gender,
        u_date_of_birth as "dateOfBirth",
        u_nationality as nationality,
        u_civil_status as "civilStatus",
        u_barangay as barangay,
        u_phone_number as "phoneNumber",
        u_blood_type as "bloodType",
        u_rh_factor as "rhFactor",
        u_profile_image as "profileImage"
    `;
    
    const values = [
      data.fullName,
      data.gender,
      data.dateOfBirth,
      data.nationality,
      data.civilStatus,
      data.barangay,
      data.phoneNumber,
      data.bloodType,
      data.rhFactor,
      data.profileImage,
      userId
    ];
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return { success: false, message: 'User not found' };
    }
    
    const user = result.rows[0];
    return {
      success: true,
      user: {
        u_id: user.id,
        u_doh_id: user.dohId,
        u_full_name: user.fullName,
        u_role: user.role,
        u_email: user.email,
        u_gender: user.gender,
        u_date_of_birth: user.dateOfBirth,
        u_nationality: user.nationality,
        u_civil_status: user.civilStatus,
        u_barangay: user.barangay,
        u_phone_number: user.phoneNumber,
        u_blood_type: user.bloodType,
        u_rh_factor: user.rhFactor,
        u_profile_image: user.profileImage
      }
    };
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    throw error;
  }
},

async updateUserProfileImage(userId, imageData) {
  try {
    const query = `
      UPDATE public.users
      SET 
        u_profile_image = $1,
        u_modified_at = NOW()
      WHERE u_id = $2
      RETURNING 
        u_id as id,
        u_profile_image as "profileImage"
    `;
    
    const result = await pool.query(query, [imageData, userId]);
    
    if (result.rows.length === 0) {
      return { success: false, message: 'User not found' };
    }
    
    return {
      success: true,
      user: result.rows[0]
    };
  } catch (error) {
    console.error('Error in updateUserProfileImage:', error);
    throw error;
  }
},

// ========== USER ACTIVITY LOG METHODS ==========

// Log user activity
async logUserActivity(userId, action, description) {
  try {
    const query = `
      INSERT INTO user_activity_log (
        ual_user_id,
        ual_action,
        ual_description,
        ual_timestamp
      ) VALUES ($1, $2, $3, NOW())
      RETURNING ual_id
    `;

    const result = await pool.query(query, [userId, action, description]);
    return result.rows[0];
  } catch (error) {
    console.error("Error logging user activity:", error);
    throw error;
  }
},

// Get user activity log with pagination
async getUserActivityLog(userId, limit = 20, offset = 0) {
  try {
    const query = `
      SELECT 
        ual_id as id,
        ual_user_id as "userId",
        ual_action as action,
        ual_description as description,
        TO_CHAR(ual_timestamp, 'MM/DD/YYYY') as date,
        TO_CHAR(ual_timestamp, 'HH12:MI AM') as time,
        ual_timestamp as timestamp
      FROM user_activity_log
      WHERE ual_user_id = $1
      ORDER BY ual_timestamp DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  } catch (error) {
    console.error("Error fetching user activity log:", error);
    throw error;
  }
},

// Get total count for pagination
async getUserActivityLogCount(userId) {
  try {
    const query = `
      SELECT COUNT(*) as total
      FROM user_activity_log
      WHERE ual_user_id = $1
    `;

    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].total);
  } catch (error) {
    console.error("Error fetching user activity log count:", error);
    throw error;
  }
},

// Update user password (in USER AUTHENTICATION METHODS section)
async updateUserPassword(userId, currentPassword, newPassword) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    console.log('Updating password for user ID:', userId);
    
    // Hash the current password to compare
    const hashedCurrentPassword = crypto.createHash('sha256').update(currentPassword).digest('hex');
    
    // Verify current password - using the internal database ID (u_id)
    const verifyQuery = `
      SELECT u_id, u_password, u_email, u_full_name 
      FROM users 
      WHERE u_id = $1
    `;
    
    const verifyResult = await client.query(verifyQuery, [userId]);
    
    if (verifyResult.rows.length === 0) {
      await client.query("ROLLBACK");
      console.error('User not found with ID:', userId);
      return {
        success: false,
        message: "User not found"
      };
    }
    
    const user = verifyResult.rows[0];
    console.log('Found user:', user.u_email);
    
    // Compare hashed passwords
    if (user.u_password !== hashedCurrentPassword) {
      await client.query("ROLLBACK");
      console.log('Password mismatch for user:', user.u_email);
      return {
        success: false,
        message: "Current password is incorrect"
      };
    }
    
    console.log('Current password verified successfully');
    
    // Hash the new password
    const hashedNewPassword = crypto.createHash('sha256').update(newPassword).digest('hex');
    
    // Update password with the internal database ID
    const updateQuery = `
      UPDATE users 
      SET u_password = $1, u_modified_at = NOW()
      WHERE u_id = $2
      RETURNING u_id, u_email, u_full_name
    `;
    
    const result = await client.query(updateQuery, [hashedNewPassword, userId]);
    
    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      console.error('Update failed - no rows affected');
      return {
        success: false,
        message: "Failed to update password"
      };
    }
    
    console.log('Password updated successfully for:', result.rows[0].u_email);
    
    // Log the password change activity
    try {
      const logQuery = `
        INSERT INTO user_activity_log (
          ual_user_id,
          ual_action,
          ual_description,
          ual_timestamp
        ) VALUES ($1, $2, $3, NOW())
      `;
      
      await client.query(logQuery, [
        userId,
        'PASSWORD_CHANGE',
        `User ${user.u_full_name} changed their password`
      ]);
      console.log('Activity logged successfully');
    } catch (logError) {
      console.error('Failed to log activity (non-critical):', logError);
      // Don't fail the entire operation if logging fails
    }
    
    await client.query("COMMIT");
    
    return {
      success: true,
      message: 'Password updated successfully'
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating user password:", error);
    return {
      success: false,
      message: error.message || 'Failed to update password'
    };
  } finally {
    client.release();
  }
},


// ========== USER PERMISSIONS METHODS ==========

// Save user permissions
async saveUserPermissions(userId, permissions) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const query = `
      UPDATE users
      SET u_permissions = $1::jsonb, u_modified_at = NOW()
      WHERE u_id = $2
      RETURNING u_id, u_permissions
    `;

    const result = await client.query(query, [JSON.stringify(permissions), userId]);

    // Log the permission change
    await this.logUserActivity(
      userId,
      'PERMISSIONS_UPDATED',
      `User permissions were updated by administrator`
    );

    await client.query("COMMIT");

    return {
      success: true,
      user: result.rows[0]
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error saving user permissions:", error);
    throw error;
  } finally {
    client.release();
  }
},

// Get user permissions
async getUserPermissions(userId) {
  try {
    const query = `
      SELECT u_permissions
      FROM users
      WHERE u_id = $1
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].u_permissions || null;
  } catch (error) {
    console.error("Error getting user permissions:", error);
    throw error;
  }
},

// Get all verified users with permissions
async getVerifiedUsersWithPermissions() {
  try {
    const query = `
      SELECT 
        u_id as id,
        u_doh_id as "dohId",
        u_full_name as "fullName",
        u_role as role,
        u_email as email,
        u_status as status,
        u_permissions as permissions,
        TO_CHAR(u_verified_at, 'MM/DD/YYYY HH24:MI') as "verifiedAt"
      FROM users
      WHERE u_status = 'verified'
      ORDER BY u_verified_at DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("Error fetching verified users with permissions:", error);
    throw error;
  }
},

async getUserById(userId) {
  try {
    const query = `
      SELECT 
        u_id as id,
        u_doh_id as "dohId",
        u_full_name as "fullName",
        u_role as role,
        u_email as email,
        u_gender as gender,
        TO_CHAR(u_date_of_birth, 'YYYY-MM-DD') as "dateOfBirth",
        u_nationality as nationality,
        u_civil_status as "civilStatus",
        u_barangay as barangay,
        u_phone_number as "phoneNumber",
        u_blood_type as "bloodType",
        u_rh_factor as "rhFactor",
        u_permissions as permissions,
        u_profile_image as "profileImage",
        u_status as status,
        TO_CHAR(u_last_login, 'MM/DD/YYYY HH24:MI:SS') as "lastLogin",
        TO_CHAR(u_created_at, 'MM/DD/YYYY HH24:MI:SS') as "createdAt"
      FROM users
      WHERE u_id = $1
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    throw error;
  }
},


  
};

module.exports = dbService;
