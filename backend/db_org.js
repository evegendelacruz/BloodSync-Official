const { Pool } = require("pg");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Database connection configuration - Organization DB
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "bloodsync_db",
  password: "bloodsync",
  port: 5432,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20,
});

// DOH Database connection - for shared partnership requests
const dohPool = new Pool({
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
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: "bloodsync.doh@gmail.com",
    pass: "ouks otjf ajgu yxfc",
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Get all partnership requests - use DOH database
const getAllPartnershipRequests = async (status = null) => {
  try {
    let query = `
      SELECT * FROM partnership_requests
    `;

    const params = [];
    if (status) {
      query += ` WHERE status = $1`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await dohPool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error("[DB_ORG] Error getting partnership requests:", error);
    throw error;
  }
};

// Database service functions
const dbOrgService = {
  // Helper function to generate activity description
  generateActivityDescription(actionType, entityType, details) {
    const actionMap = {
      add: "Added",
      update: "Updated",
      delete: "Deleted",
    };

    const entityMap = {
      appointment: "appointment",
    };

    const action = actionMap[actionType] || actionType;
    const entity = entityMap[entityType] || entityType;

    if (entityType === "appointment") {
      if (actionType === "add") {
        return `${action} ${entity} "${details.appointmentTitle}" scheduled for ${details.appointmentDate} at ${details.appointmentTime}`;
      } else if (actionType === "update") {
        return `${action} ${entity} "${details.appointmentTitle}" scheduled for ${details.appointmentDate}`;
      } else if (actionType === "delete") {
        return `${action} ${entity} "${details.appointmentTitle}" scheduled for ${details.appointmentDate}`;
      }
    }

    return `${action} ${entity}`;
  },

  // ========== APPOINTMENT METHODS ==========
  async getSystemUserId() {
    try {
      // Try to get a system user from your users table
      const result = await pool.query(
        "SELECT u_id FROM users WHERE u_role = 'system' OR u_email = 'system@bloodsync.org' LIMIT 1"
      );
      if (result.rows.length > 0) {
        return result.rows[0].u_id;
      }
      return 0; // Fallback system ID
    } catch (error) {
      console.error("Error getting system user ID:", error);
      return 0;
    }
  },
  async getAllAppointments(organizationName = null) {
  try {
    let query = `
      SELECT
        id,
        appointment_id,
        title,
        TO_CHAR(appointment_date, 'YYYY-MM-DD') as date,
        appointment_time as time,
        appointment_type as type,
        contact_type,
        last_name,
        email,
        phone,
        address,
        message,
        notes,
        status,
        created_at,
        updated_at
      FROM appointments
      WHERE status != 'cancelled'
    `;

    const values = [];
    if (organizationName) {
      query += " AND last_name = $1";
      values.push(organizationName);
    }

    query += " ORDER BY appointment_date DESC, appointment_time DESC";

    const result = await pool.query(query, values);

    return result.rows.map((row) => ({
      ...row,
      contactInfo: {
        lastName: row.last_name,
        email: row.email,
        phone: row.phone,
        address: row.address,
        message: row.message,
        type: row.contact_type,
      },
    }));
  } catch (error) {
    console.error("Error getting all appointments:", error);
    throw error;
  }
},

  async addAppointment(appointmentData, userId = null) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Get valid user ID - simplified approach
      let validUserId = null;

      if (userId && typeof userId === "number" && userId > 0) {
        // Verify the user exists
        const userCheckQuery = `SELECT u_id FROM user_org WHERE u_id = $1`;
        const userCheckResult = await client.query(userCheckQuery, [userId]);

        if (userCheckResult.rows.length > 0) {
          validUserId = userCheckResult.rows[0].u_id;
          console.log("Using provided user ID:", validUserId);
        }
      }

      // If no valid user ID, find or create system user
      if (!validUserId) {
        console.log(
          "No valid user ID provided, finding/creating system user..."
        );

        const systemUserQuery = `
        SELECT u_id 
        FROM user_org 
        WHERE u_email = 'system@bloodsync.org' 
        LIMIT 1
      `;
        const systemUserResult = await client.query(systemUserQuery);

        if (systemUserResult.rows.length > 0) {
          validUserId = systemUserResult.rows[0].u_id;
          console.log("Found system user:", validUserId);
        } else {
          // Create system user
          console.log("Creating system user...");
          const createSystemUserQuery = `
          INSERT INTO user_org (
            u_org_id, u_full_name, u_category, u_email, u_password, 
            u_status, u_verified_at, u_created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          RETURNING u_id
        `;

          const systemUserValues = [
            "SYS-0000001",
            "BloodSync System",
            "System",
            "system@bloodsync.org",
            crypto.createHash("sha256").update("system_password").digest("hex"),
            "verified",
          ];

          const createResult = await client.query(
            createSystemUserQuery,
            systemUserValues
          );
          validUserId = createResult.rows[0].u_id;
          console.log("Created system user:", validUserId);
        }
      }

      console.log("Final user ID for appointment:", validUserId);

      const insertQuery = `
      INSERT INTO appointments (
        appointment_id, title, appointment_date, appointment_time,
        appointment_type, contact_type, last_name, email, phone,
        address, message, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

      const values = [
        appointmentData.id || Date.now(),
        appointmentData.title,
        appointmentData.date,
        appointmentData.time,
        appointmentData.type,
        appointmentData.contactInfo.type || "organization",
        appointmentData.contactInfo.lastName,
        appointmentData.contactInfo.email,
        appointmentData.contactInfo.phone,
        appointmentData.contactInfo.address,
        appointmentData.contactInfo.message || null,
        appointmentData.notes || null,
        appointmentData.status || "pending",
      ];

      const result = await client.query(insertQuery, values);
      const appointment = result.rows[0];

      // Log activity with validated user ID
      try {
        await this.logUserActivity(
          validUserId,
          "ADD_APPOINTMENT",
          this.generateActivityDescription("add", "appointment", {
            appointmentTitle: appointment.title,
            appointmentDate: new Date(
              appointment.appointment_date
            ).toLocaleDateString("en-US"),
            appointmentTime: appointment.appointment_time,
          })
        );
      } catch (logError) {
        console.error("Failed to log activity (non-critical):", logError);
      }

      await client.query("COMMIT");

      return {
        id: appointment.appointment_id,
        title: appointment.title,
        date: appointment.appointment_date.toISOString().split("T")[0],
        time: appointment.appointment_time,
        type: appointment.appointment_type,
        notes: appointment.notes,
        contactInfo: {
          lastName: appointment.last_name,
          email: appointment.email,
          phone: appointment.phone,
          address: appointment.address,
          message: appointment.message,
          type: appointment.contact_type,
        },
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error adding appointment:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  // A3. Update appointment
  async updateAppointment(id, appointmentData, userName = "System User") {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Get original appointment data for comparison
      const originalResult = await client.query(
        "SELECT * FROM appointments WHERE appointment_id = $1",
        [id]
      );
      if (originalResult.rows.length === 0) {
        throw new Error("Appointment not found");
      }
      const originalAppointment = originalResult.rows[0];

      const updateQuery = `
        UPDATE appointments SET
          title = $2,
          appointment_date = $3,
          appointment_time = $4,
          appointment_type = $5,
          contact_type = $6,
          last_name = $7,
          email = $8,
          phone = $9,
          address = $10,
          message = $11,
          notes = $12,
          status = $13
        WHERE appointment_id = $1
        RETURNING *
      `;

      const values = [
        id,
        appointmentData.title,
        appointmentData.date,
        appointmentData.time,
        appointmentData.type,
        appointmentData.contactInfo.type,
        appointmentData.contactInfo.lastName,
        appointmentData.contactInfo.email,
        appointmentData.contactInfo.phone,
        appointmentData.contactInfo.address,
        appointmentData.contactInfo.message,
        appointmentData.notes,
        appointmentData.status || originalAppointment.status || "pending",
      ];

      const result = await client.query(updateQuery, values);
      const updatedAppointment = result.rows[0];

      // Log activity - use this.generateActivityDescription
      await this.logUserActivity(
        userName,
        "UPDATE_APPOINTMENT",
        this.generateActivityDescription("update", "appointment", {
          appointmentTitle: updatedAppointment.title,
          appointmentDate: new Date(
            updatedAppointment.appointment_date
          ).toLocaleDateString("en-US"),
        })
      );

      await client.query("COMMIT");

      return {
        id: updatedAppointment.appointment_id,
        title: updatedAppointment.title,
        date: updatedAppointment.appointment_date.toISOString().split("T")[0],
        time: updatedAppointment.appointment_time,
        type: updatedAppointment.appointment_type,
        notes: updatedAppointment.notes,
        status: updatedAppointment.status,
        contactInfo: {
          lastName: updatedAppointment.last_name,
          email: updatedAppointment.email,
          phone: updatedAppointment.phone,
          address: updatedAppointment.address,
          message: updatedAppointment.message,
          type: updatedAppointment.contact_type,
        },
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error updating appointment:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  // A4. Update appointment status
  // In db_org.js - updateAppointmentStatus function
  async updateAppointmentStatus(
    appointmentId,
    status,
    userName = "System User"
  ) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const query = `
      UPDATE appointments 
      SET status = $1, updated_at = NOW() 
      WHERE appointment_id = $2
      RETURNING *
    `;

      const values = [status, appointmentId];
      const result = await client.query(query, values);

      // Log activity
      await this.logUserActivity(
        userName,
        "APPOINTMENT_UPDATE",
        `Updated appointment ${appointmentId} status to ${status}`
      );

      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error updating appointment status:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  // A5. Cancel appointment with reason
  async cancelAppointmentWithReason(
  appointmentId,
  reason,
  userName = "System User"
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE appointments
      SET status = 'cancelled', cancellation_reason = $1, updated_at = CURRENT_TIMESTAMP
      WHERE appointment_id = $2 RETURNING *`,
      [reason, appointmentId]
    );

    if (result.rows.length === 0) {
      throw new Error("Appointment not found");
    }

    const appointment = result.rows[0];

    // Log this cancellation
    await this.logUserActivity(
      userName,
      "CANCEL_APPOINTMENT",
      `Cancelled appointment "${appointment.title}" with reason: ${reason}`
    );

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error cancelling appointment:", error);
    throw error;
  } finally {
    client.release();
  }
},
  // A6. Delete multiple appointments
  async deleteAppointments(ids, userName = "System User") {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const placeholders = ids.map((_, index) => `$${index + 1}`).join(",");
      const appointmentsResult = await client.query(
        `SELECT appointment_id, title, appointment_date, appointment_time, last_name FROM appointments WHERE appointment_id IN (${placeholders})`,
        ids
      );
      const appointmentsToDelete = appointmentsResult.rows;

      const deleteQuery = `DELETE FROM appointments WHERE appointment_id IN (${placeholders})`;
      const result = await client.query(deleteQuery, ids);

      // Log activity
      if (appointmentsToDelete.length > 0) {
        await this.logUserActivity(
          userName,
          "DELETE_APPOINTMENTS",
          `Deleted ${appointmentsToDelete.length} appointment(s)`
        );
      }

      await client.query("COMMIT");
      return { deletedCount: result.rowCount };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error deleting appointments:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  async deleteAppointment(id, userId = "System User") {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let appointmentResult = await client.query(
      "SELECT appointment_id, title, appointment_date, appointment_time, last_name, status FROM appointments WHERE appointment_id = $1",
      [id]
    );

    if (appointmentResult.rows.length === 0) {
      // Try with regular id if it's a valid integer
      if (/^\d+$/.test(id)) {
        appointmentResult = await client.query(
          "SELECT appointment_id, title, appointment_date, appointment_time, last_name, status FROM appointments WHERE id = $1",
          [id]
        );
      }
    }

    if (appointmentResult.rows.length === 0) {
      throw new Error("Appointment not found");
    }

    const appointment = appointmentResult.rows[0];

    // For declined status: Hard delete from database
    if (appointment.status === "declined") {
      const deleteQuery = `DELETE FROM appointments WHERE appointment_id = $1`;
      await client.query(deleteQuery, [appointment.appointment_id]);
      
      console.log("Hard deleted declined appointment:", appointment.appointment_id);
    } 
    // For cancelled status or any other: Also hard delete (as per requirement)
    else if (appointment.status === "cancelled") {
      const deleteQuery = `DELETE FROM appointments WHERE appointment_id = $1`;
      await client.query(deleteQuery, [appointment.appointment_id]);
      
      console.log("Hard deleted cancelled appointment:", appointment.appointment_id);
    }
    // For other statuses (pending, scheduled): Hard delete as well
    else {
      const deleteQuery = `DELETE FROM appointments WHERE appointment_id = $1`;
      await client.query(deleteQuery, [appointment.appointment_id]);
      
      console.log("Hard deleted appointment:", appointment.appointment_id);
    }

    // Log activity - use this.generateActivityDescription
    await this.logUserActivity(
      userId,
      "DELETE_APPOINTMENT",
      this.generateActivityDescription("delete", "appointment", {
        appointmentTitle: appointment.title,
        appointmentDate: new Date(
          appointment.appointment_date
        ).toLocaleDateString("en-US"),
      })
    );

    await client.query("COMMIT");
    return { deletedCount: 1 };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error deleting appointment:", error);
    throw error;
  } finally {
    client.release();
  }
},

  // A8. Search appointments
  async searchAppointments(searchTerm) {
    try {
      const searchQuery = `
        SELECT
          id,
          appointment_id,
          title,
          TO_CHAR(appointment_date, 'YYYY-MM-DD') as date,
          appointment_time as time,
          appointment_type as type,
          contact_type,
          last_name,
          email,
          phone,
          address,
          message,
          notes,
          status,
          created_at,
          updated_at
        FROM appointments
        WHERE
          title ILIKE $1 OR
          last_name ILIKE $1 OR
          email ILIKE $1 OR
          phone ILIKE $1 OR
          address ILIKE $1
        ORDER BY appointment_date DESC, appointment_time DESC
      `;

      const searchPattern = `%${searchTerm}%`;
      const result = await pool.query(searchQuery, [searchPattern]);

      return result.rows.map((row) => ({
        ...row,
        contactInfo: {
          lastName: row.last_name,
          email: row.email,
          phone: row.phone,
          address: row.address,
          message: row.message,
          type: row.contact_type,
        },
      }));
    } catch (error) {
      console.error("Error searching appointments:", error);
      throw error;
    }
  },

  // A9. Get appointments by date range
  async getAppointmentsByDateRange(startDate, endDate) {
    try {
      const result = await pool.query(
        `
        SELECT
          id,
          appointment_id,
          title,
          TO_CHAR(appointment_date, 'YYYY-MM-DD') as date,
          appointment_time as time,
          appointment_type as type,
          contact_type,
          last_name,
          email,
          phone,
          address,
          message,
          notes,
          status,
          created_at,
          updated_at
        FROM appointments
        WHERE appointment_date BETWEEN $1 AND $2
        ORDER BY appointment_date ASC, appointment_time ASC
      `,
        [startDate, endDate]
      );

      return result.rows.map((row) => ({
        ...row,
        contactInfo: {
          lastName: row.last_name,
          email: row.email,
          phone: row.phone,
          address: row.address,
          message: row.message,
          type: row.contact_type,
        },
      }));
    } catch (error) {
      console.error("Error getting appointments by date range:", error);
      throw error;
    }
  },

  // A10. Get appointment by ID
  async getAppointmentById(id) {
    try {
      const result = await pool.query(
        `
        SELECT
          id,
          appointment_id,
          title,
          TO_CHAR(appointment_date, 'YYYY-MM-DD') as date,
          appointment_time as time,
          appointment_type as type,
          contact_type,
          last_name,
          email,
          phone,
          address,
          message,
          notes,
          status,
          created_at,
          updated_at
        FROM appointments
        WHERE appointment_id = $1
      `,
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        ...row,
        contactInfo: {
          lastName: row.last_name,
          email: row.email,
          phone: row.phone,
          address: row.address,
          message: row.message,
          type: row.contact_type,
        },
      };
    } catch (error) {
      console.error("Error getting appointment by ID:", error);
      throw error;
    }
  },

  // A11. Get appointment statistics
  async getAppointmentStatistics() {
    try {
      const statsQuery = `
        SELECT
          COUNT(*) as total_appointments,
          COUNT(CASE WHEN appointment_type = 'blood-donation' THEN 1 END) as blood_drive_appointments,
          COUNT(CASE WHEN appointment_type = 'sync-request' THEN 1 END) as sync_appointments,
          COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_appointments,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments,
          COUNT(CASE WHEN appointment_date >= CURRENT_DATE THEN 1 END) as upcoming_appointments,
          COUNT(CASE WHEN appointment_date < CURRENT_DATE THEN 1 END) as past_appointments
        FROM appointments
      `;

      const result = await pool.query(statsQuery);
      return result.rows[0];
    } catch (error) {
      console.error("Error getting appointment statistics:", error);
      throw error;
    }
  },

  // [Rest of your existing functions continue here...]
  // ========== DONOR RECORD ORG METHODS ==========
  // ========== DONOR RECORD ORG METHODS ==========
async getAllDonorRecordsOrg(sourceOrganization) {
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
      TO_CHAR(dr_created_at, 'MM/DD/YYYY HH24:MI:SS') as created,
      CASE 
        WHEN dr_modified_at IS NOT NULL 
        THEN TO_CHAR(dr_modified_at, 'MM/DD/YYYY HH24:MI:SS')
        ELSE '-'
      END as modified,
      -- FIX: Use COALESCE to handle null values and format properly
      CASE 
        WHEN dr_recent_donation IS NOT NULL 
        THEN TO_CHAR(dr_recent_donation, 'MM/DD/YYYY')
        ELSE 'No donations'
      END as "recentDonation",
      COALESCE(dr_donation_count, 0) as "donationCount",
      COALESCE(dr_times_donated, 1) as "timesDonated",
      dr_source_organization as "sourceOrganization"
    FROM donor_record_org 
    WHERE dr_source_organization = $1
    ORDER BY dr_created_at DESC
  `;
    const result = await pool.query(query, [sourceOrganization]);
    return result.rows.map((row) => ({ ...row, selected: false }));
  } catch (error) {
    console.error("Error fetching donor records org:", error);
    throw error;
  }
},

  async getPartnershipRequestById(requestId) {
    try {
      const query = `
      SELECT *
      FROM partnership_requests
      WHERE id = $1
    `;

      const result = await dohPool.query(query, [requestId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("[DB] Error getting partnership request by ID:", error);
      throw error;
    }
  },

  async updatePartnershipRequestStatus(requestId, status, approvedBy = null) {
    const client = await dohPool.connect();
    try {
      await client.query("BEGIN");

      const query = `
      UPDATE partnership_requests
      SET
        status = $1,
        approved_by = $2,
        approved_at = CASE WHEN $1 = 'approved' THEN NOW() ELSE NULL END,
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;

      const result = await client.query(query, [status, approvedBy, requestId]);

      // Update associated appointment status
      if (result.rows.length > 0 && result.rows[0].appointment_id) {
        const appointmentStatus = status === "approved" ? "scheduled" : status;
        await client.query(
          `UPDATE appointments SET status = $1 WHERE appointment_id = $2`,
          [appointmentStatus, result.rows[0].appointment_id]
        );
      }

      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("[DB] Error updating partnership request status:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  async getPendingPartnershipRequestsCount() {
    try {
      const query = `
      SELECT COUNT(*) as count
      FROM partnership_requests
      WHERE status = 'pending'
    `;

      const result = await dohPool.query(query);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error("[DB] Error getting pending requests count:", error);
      throw error;
    }
  },

  async deletePartnershipRequest(requestId) {
    const client = await dohPool.connect();
    try {
      await client.query("BEGIN");

      const query = `DELETE FROM partnership_requests WHERE id = $1 RETURNING *`;
      const result = await client.query(query, [requestId]);

      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("[DB] Error deleting partnership request:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  //================DONOR RECORD ORG====================
  // Add new donor record for organization
async addDonorRecordOrg(donorData, sourceOrganization) {
  try {
    const query = `
    INSERT INTO donor_record_org (
      dr_donor_id, dr_first_name, dr_middle_name, dr_last_name,
      dr_gender, dr_birthdate, dr_age, dr_blood_type, dr_rh_factor,
      dr_contact_number, dr_address, dr_recent_donation, dr_donation_count,
      dr_times_donated, dr_source_organization, dr_created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
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
      // FIX: Ensure we're storing the actual donation date, not null
      donorData.recentDonation ? new Date(donorData.recentDonation) : null,
      parseInt(donorData.donationCount) || 0,
      parseInt(donorData.timesDonated) || 1,
      sourceOrganization,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error("Error adding donor record org:", error);
    throw error;
  }
},

  // Search donor records for organization
  async searchDonorRecordsOrg(searchTerm, sourceOrganization) {
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
        dr_source_organization as "sourceOrganization"
      FROM donor_record_org 
      WHERE dr_source_organization = $2
        AND (
          dr_donor_id ILIKE $1 OR 
          dr_first_name ILIKE $1 OR 
          dr_middle_name ILIKE $1 OR
          dr_last_name ILIKE $1 OR
          dr_blood_type ILIKE $1 OR
          dr_contact_number ILIKE $1 OR
          dr_address ILIKE $1
        )
      ORDER BY dr_created_at DESC
    `;
      const result = await pool.query(query, [
        `%${searchTerm}%`,
        sourceOrganization,
      ]);
      return result.rows.map((row) => ({ ...row, selected: false }));
    } catch (error) {
      console.error("Error searching donor records org:", error);
      throw error;
    }
  },

  async generateNextDonorIdOrg() {
    try {
      // Query for all donor IDs starting with 'DNR-' and extract the numeric part
      const query = `
      SELECT dr_donor_id FROM donor_record_org 
      WHERE dr_donor_id LIKE 'DNR-%'
      ORDER BY 
        CAST(
          SUBSTRING(dr_donor_id FROM 5) AS INTEGER
        ) DESC 
      LIMIT 1
    `;
      const result = await pool.query(query);

      if (result.rows.length === 0) {
        return "DNR-0000001";
      }

      const lastId = result.rows[0].dr_donor_id;
      console.log("Last donor ID found:", lastId);

      const parts = lastId.split("-");
      const numberPart = parseInt(parts[1]);

      if (isNaN(numberPart)) {
        console.error("Invalid donor ID format:", lastId);
        throw new Error("Invalid donor ID format in database");
      }

      const nextNumber = (numberPart + 1).toString().padStart(7, "0");
      const newId = `DNR-${nextNumber}`;
      console.log("Generated new donor ID:", newId);

      return newId;
    } catch (error) {
      console.error("Error generating donor ID org:", error);
      throw error;
    }
  },

  // Update donor record for organization
  async updateDonorRecordOrg(id, donorData, sourceOrganization) {
    try {
      const query = `
      UPDATE donor_record_org SET
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
        dr_recent_donation = $13,
        dr_donation_count = $14,
        dr_times_donated = $15,
        dr_donation_dates = $16,
        dr_modified_at = NOW()
      WHERE dr_id = $1 AND dr_source_organization = $17
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
        donorData.recentDonation ? new Date(donorData.recentDonation) : null,
        parseInt(donorData.donationCount) || 0,
        parseInt(donorData.timesDonated) || 1,
        JSON.stringify(donorData.donationDates || []),
        sourceOrganization,
      ];

      await pool.query(query, values);
      return true;
    } catch (error) {
      console.error("Error updating donor record org:", error);
      throw error;
    }
  },

  //=================ORGANIZATION AUTHENTICATION=================
  // Register new organization/barangay user
  async registerOrg(userData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Check if email already exists
      const checkEmailQuery = `SELECT u_id FROM user_org WHERE u_email = $1`;
      const emailCheck = await client.query(checkEmailQuery, [userData.email]);

      if (emailCheck.rows.length > 0) {
        throw new Error("Email already registered");
      }

      // Generate ORG ID
      const generateOrgId = async (client) => {
        let orgId;
        let exists = true;

        while (exists) {
          // Generate ID: ORG-YYYYMMDD-XXXX
          const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
          const random = Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, "0");
          orgId = `ORG-${date}-${random}`;

          // Check if ID exists
          const checkQuery = `SELECT EXISTS(SELECT 1 FROM user_org WHERE u_org_id = $1)`;
          const result = await client.query(checkQuery, [orgId]);
          exists = result.rows[0].exists;
        }

        return orgId;
      };

      const orgId = await generateOrgId(client);

      // Hash password
      const hashedPassword = crypto
        .createHash("sha256")
        .update(userData.password)
        .digest("hex");

      // Determine organization_name and barangay based on category
      const organizationName =
        userData.category === "Organization" ? userData.entityName : null;
      const barangay =
        userData.category === "Barangay" ? userData.entityName : null;

      // Insert new user with 'verified' status (no verification needed)
      const insertQuery = `
        INSERT INTO user_org (
          u_org_id, 
          u_full_name, 
          u_category, 
          u_organization_name,
          u_barangay,
          u_email, 
          u_password,
          u_status, 
          u_verified_at,
          u_created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING u_id, u_org_id, u_email, u_full_name, u_category, u_organization_name, u_barangay
      `;

      const values = [
        orgId,
        userData.fullName,
        userData.category,
        organizationName,
        barangay,
        userData.email,
        hashedPassword,
        "verified", // Auto-verify the account
      ];

      const result = await client.query(insertQuery, values);
      const newUser = result.rows[0];

      // Determine display name for email
      const entityDisplay =
        userData.category === "Organization" ? organizationName : barangay;

      // Send notification email to admin (bloodsync.doh@gmail.com)
      const adminMailOptions = {
        from: "bloodsync.doh@gmail.com",
        to: "bloodsync.doh@gmail.com",
        subject: "New User Registration - BloodSync",
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
              .user-info p { margin: 8px 0; }
              .user-info strong { color: #165c3c; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>New User Registration</h1>
              </div>
              <div class="content">
                <h2>A new user has registered on BloodSync</h2>
                <p>Registration details:</p>
                
                <div class="user-info">
                  <p><strong>DOH ID:</strong> ${orgId}</p>
                  <p><strong>Full Name:</strong> ${userData.fullName}</p>
                  <p><strong>Category:</strong> ${userData.category}</p>
                  <p><strong>${userData.category === "Organization" ? "Organization" : "Barangay"}:</strong> ${entityDisplay}</p>
                  <p><strong>Email:</strong> ${userData.email}</p>
                  <p><strong>Registration Date:</strong> ${new Date().toLocaleString()}</p>
                </div>
                
                <p><strong>Status:</strong> Account automatically verified and active</p>
              </div>
              <div class="footer">
                <p>&copy; 2025 Code Red Corporation - BloodSync ver. 1.0</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      // Send welcome email to user
      const userMailOptions = {
        from: "bloodsync.doh@gmail.com",
        to: userData.email,
        subject: "Welcome to BloodSync!",
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
              .success-box { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; }
              .login-btn { display: inline-block; background: #93c242; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to BloodSync!</h1>
              </div>
              <div class="content">
                <div class="success-box">
                  <h2>✓ Registration Successful!</h2>
                </div>
                <p>Hello ${userData.fullName},</p>
                <p>Your BloodSync account has been successfully created and is ready to use.</p>
                
                <div class="user-info">
                  <p><strong>Your ORG ID:</strong> ${orgId}</p>
                  <p><strong>Category:</strong> ${userData.category}</p>
                  <p><strong>${userData.category === "Organization" ? "Organization" : "Barangay"}:</strong> ${entityDisplay}</p>
                  <p><strong>Email:</strong> ${userData.email}</p>
                </div>
                
                <p>You can now log in to the system using your email and password.</p>
              </div>
              <div class="footer">
                <p>&copy; 2025 Code Red Corporation - BloodSync ver. 1.0</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      // Send both emails
      try {
        await emailTransporter.sendMail(adminMailOptions);
        await emailTransporter.sendMail(userMailOptions);
      } catch (emailError) {
        console.error("Email sending failed (non-critical):", emailError);
        // Don't fail registration if email fails
      }

      await client.query("COMMIT");

      return {
        success: true,
        message: "Registration successful! You can now login to your account.",
        user: newUser,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error registering organization:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Verify user via email link
  async verifyEmailToken(token) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Find user with valid token
      const findQuery = `
        SELECT u_id, u_org_id, u_email, u_full_name, u_category, 
               u_organization_name, u_barangay, u_token_expiry
        FROM user_org 
        WHERE u_verification_token = $1 AND u_status = 'pending'
      `;
      const findResult = await client.query(findQuery, [token]);

      if (findResult.rows.length === 0) {
        throw new Error("Invalid or expired verification token");
      }

      const user = findResult.rows[0];

      // Check if token has expired
      if (new Date() > new Date(user.u_token_expiry)) {
        throw new Error(
          "Verification link has expired. Please register again."
        );
      }

      // Update user status to verified
      const updateQuery = `
        UPDATE user_org 
        SET u_status = 'verified', 
            u_verified_at = NOW(),
            u_verification_token = NULL,
            u_token_expiry = NULL
        WHERE u_verification_token = $1
        RETURNING u_id, u_org_id, u_email, u_full_name, u_category, u_organization_name, u_barangay
      `;

      const updateResult = await client.query(updateQuery, [token]);
      const verifiedUser = updateResult.rows[0];

      // Determine entity display for email
      const entityDisplay =
        verifiedUser.u_category === "Organization"
          ? verifiedUser.u_organization_name
          : verifiedUser.u_barangay;

      // Send confirmation email
      const mailOptions = {
        from: "bloodsync.doh@gmail.com",
        to: verifiedUser.u_email,
        subject: "Account Verified - BloodSync",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #165c3c; color: white; padding: 20px; text-align: center; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
              .success-box { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; }
              .login-btn { display: inline-block; background: #93c242; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; }
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
                <p>Your BloodSync account has been successfully verified.</p>
                <p><strong>Your DOH ID:</strong> ${verifiedUser.u_org_id}</p>
                <p><strong>Category:</strong> ${verifiedUser.u_category}</p>
                <p><strong>${verifiedUser.u_category === "Organization" ? "Organization" : "Barangay"}:</strong> ${entityDisplay}</p>
                <p>You can now log in to the system using your email and password.</p>
                <center>
                  <a href="${process.env.APP_URL || "http://localhost:5173"}/login" class="login-btn">Login Now</a>
                </center>
              </div>
              <div class="footer">
                <p>&copy; 2025 Code Red Corporation - BloodSync ver. 1.0</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      await emailTransporter.sendMail(mailOptions);
      await client.query("COMMIT");

      return {
        success: true,
        message: "Email verified successfully! You can now login.",
        user: verifiedUser,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error verifying email:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Resend verification email
  async resendVerification(email) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const findQuery = `
        SELECT u_id, u_org_id, u_full_name, u_category, u_organization_name, u_barangay
        FROM user_org WHERE u_email = $1 AND u_status = 'pending'
      `;
      const findResult = await client.query(findQuery, [email]);

      if (findResult.rows.length === 0) {
        throw new Error("No pending account found with this email");
      }

      const user = findResult.rows[0];
      const newToken = crypto.randomBytes(32).toString("hex");
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const updateQuery = `
        UPDATE user_org SET u_verification_token = $1, u_token_expiry = $2
        WHERE u_email = $3
      `;
      await client.query(updateQuery, [newToken, tokenExpiry, email]);

      const verificationUrl = `${process.env.APP_URL || "http://localhost:5173"}/verify-email?token=${newToken}`;

      const entityDisplay =
        user.u_category === "Organization"
          ? user.u_organization_name
          : user.u_barangay;

      const mailOptions = {
        from: "bloodsync.doh@gmail.com",
        to: email,
        subject: "Verify Your Account - BloodSync (Resent)",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #165c3c; color: white; padding: 20px; text-align: center; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
              .verify-btn { display: inline-block; background: #93c242; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header"><h1>Verify Your Account</h1></div>
              <div class="content">
                <p>Hello ${user.u_full_name},</p>
                <p>Here's your new verification link:</p>
                <center><a href="${verificationUrl}" class="verify-btn">Verify My Account</a></center>
                <p>This link expires in 24 hours.</p>
              </div>
              <div class="footer"><p>&copy; 2025 Code Red Corporation - BloodSync ver. 1.0</p></div>
            </div>
          </body>
          </html>
        `,
      };

      await emailTransporter.sendMail(mailOptions);
      await client.query("COMMIT");

      return {
        success: true,
        message: "Verification email resent successfully",
      };
    } catch (error) {
      await client.query("ROLLBACK");
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
        u_org_id as "orgId",
        u_full_name as "fullName",
        u_category as category,
        u_email as email,
        u_status as status,
        TO_CHAR(u_created_at, 'MM/DD/YYYY HH24:MI') as "createdAt"
      FROM user_org
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
        u_org_id as "orgId",
        u_full_name as "fullName",
        u_category as category,
        u_email as email,
        u_status as status,
        TO_CHAR(u_verified_at, 'MM/DD/YYYY HH24:MI') as "verifiedAt"
      FROM user_org
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
      UPDATE user_org 
      SET u_status = 'verified', 
          u_verified_at = NOW(),
          u_verification_token = NULL
      WHERE u_id = $1
      RETURNING u_id, u_org_id, u_email, u_full_name, u_category
    `;

      const result = await client.query(query, [userId]);

      if (result.rows.length === 0) {
        throw new Error("User not found");
      }

      const verifiedUser = result.rows[0];

      // Send confirmation email to user
      const mailOptions = {
        from: "bloodsync.doh@gmail.com",
        to: verifiedUser.u_email,
        subject: "Account Verified - BloodSync",
        html: `
        <h2>Your BloodSync account has been verified!</h2>
        <p>Hello ${verifiedUser.u_full_name},</p>
        <p>Your account has been approved. You can now log in to BloodSync.</p>
        <p><strong>Your DOH ID:</strong> ${verifiedUser.u_org_id}</p>
      `,
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
        message: "User verified successfully",
        user: verifiedUser,
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
      const query = `DELETE FROM user_org WHERE u_id = $1`;
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
      UPDATE user_org 
      SET u_category = $1
      WHERE u_id = $2
      RETURNING u_id, u_org_id, u_email, u_full_name, u_category
    `;

      const result = await pool.query(query, [newRole, userId]);

      if (result.rows.length === 0) {
        throw new Error("User not found");
      }

      return {
        success: true,
        message: "User category updated successfully",
        user: result.rows[0],
      };
    } catch (error) {
      console.error("Error updating user category:", error);
      throw error;
    }
  },

  // Remove user (delete from database)
  async removeUser(userId) {
    try {
      const query = `DELETE FROM user_org WHERE u_id = $1`;
      await pool.query(query, [userId]);
      return { success: true, message: "User removed successfully" };
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
          u_org_id as "orgId",
          u_full_name as "fullName",
          u_category as category,
          u_organization_name as "organizationName",
          u_barangay as barangay,
          u_email as email,
          u_password as password,
          u_gender as gender,
          TO_CHAR(u_date_of_birth, 'YYYY-MM-DD') as "dateOfBirth",
          u_nationality as nationality,
          u_civil_status as "civilStatus",
          u_phone_number as "phoneNumber",
          u_blood_type as "bloodType",
          u_rh_factor as "rhFactor",
          u_profile_image as "profileImage",
          u_status as status,
          u_permissions as permissions,
          TO_CHAR(u_created_at, 'MM/DD/YYYY HH24:MI:SS') as "createdAt",
          TO_CHAR(u_last_login, 'MM/DD/YYYY HH24:MI:SS') as "lastLogin"
        FROM user_org
        WHERE LOWER(TRIM(u_email)) = $1
      `;

      const result = await pool.query(query, [normalizedEmail]);

      if (result.rows.length === 0) {
        console.log("ERROR: No user found with email:", normalizedEmail);
        throw new Error("Invalid email or password");
      }

      const user = result.rows[0];

      if (user.status !== "verified") {
        console.log("ERROR: User status is not verified. Status:", user.status);
        throw new Error(
          "Account pending verification. Please contact administrator."
        );
      }

      const hashedPassword = crypto
        .createHash("sha256")
        .update(password)
        .digest("hex");

      if (user.password !== hashedPassword) {
        console.log("ERROR: Password mismatch!");
        throw new Error("Invalid email or password");
      }

      console.log("Login successful! Updating last login...");

      // Update last login
      await pool.query(
        "UPDATE user_org SET u_last_login = NOW() WHERE u_id = $1",
        [user.id]
      );
      console.log("✅ Last login updated");

      // FIXED: Log the login activity to user_org_log
      try {
        await this.logUserActivity(
          user.id,
          "LOGIN",
          `User ${user.fullName} logged into the system`
        );
        console.log('✅ Login activity logged to user_org_log for:', user.fullName);
      } catch (logError) {
        console.error("⚠️ Failed to log login activity (non-critical):", logError);
      }

      // Remove password from user object before returning
      delete user.password;

      return {
        success: true,
        user: {
          id: user.id,
          orgId: user.orgId,
          fullName: user.fullName,
          category: user.category,
          organizationName: user.organizationName,
          barangay: user.barangay,
          email: user.email,
          gender: user.gender,
          dateOfBirth: user.dateOfBirth,
          nationality: user.nationality,
          civilStatus: user.civilStatus,
          phoneNumber: user.phoneNumber,
          bloodType: user.bloodType,
          rhFactor: user.rhFactor,
          profileImage: user.profileImage,
          status: user.status,
          permissions: user.permissions,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
        },
      };
    } catch (error) {
      throw error;
    }
  },

  async getUserProfileByIdOrg(userId) {
    try {
      const query = `
      SELECT 
        u_id as id,
        u_org_id as "orgId",
        u_full_name as "fullName",
        u_category as category,
        u_organization_name as "organizationName",
        u_barangay as barangay,
        u_email as email,
        u_gender as gender,
        TO_CHAR(u_date_of_birth, 'YYYY-MM-DD') as "dateOfBirth",
        u_nationality as nationality,
        u_civil_status as "civilStatus",
        u_phone_number as "phoneNumber",
        u_blood_type as "bloodType",
        u_rh_factor as "rhFactor",
        u_profile_image as "profileImage",
        u_status as status,
        u_permissions as permissions,
        TO_CHAR(u_created_at, 'MM/DD/YYYY HH24:MI:SS') as "createdAt",
        TO_CHAR(u_last_login, 'MM/DD/YYYY HH24:MI:SS') as "lastLogin"
      FROM user_org
      WHERE u_id = $1
    `;

      const result = await pool.query(query, [userId]);

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error("Error fetching user profile by ID:", error);
      throw error;
    }
  },

  async updateUserProfileOrg(userId, data) {
    try {
      const query = `
      UPDATE user_org
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
        u_modified_at = NOW()
      WHERE u_id = $10
      RETURNING 
        u_id as id,
        u_org_id as "orgId",
        u_full_name as "fullName",
        u_category as category,
        u_organization_name as "organizationName",
        u_barangay as barangay,
        u_email as email,
        u_gender as gender,
        TO_CHAR(u_date_of_birth, 'YYYY-MM-DD') as "dateOfBirth",
        u_nationality as nationality,
        u_civil_status as "civilStatus",
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
        userId,
      ];

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return { success: false, message: "User not found" };
      }

      return {
        success: true,
        user: result.rows[0],
      };
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  },

  async updateUserProfileImageOrg(userId, imageData) {
    try {
      const query = `
      UPDATE user_org
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
        return { success: false, message: "User not found" };
      }

      return {
        success: true,
        profileImage: result.rows[0].profileImage,
      };
    } catch (error) {
      console.error("Error updating profile image:", error);
      throw error;
    }
  },

  // ========== USER ACTIVITY LOG METHODS ==========

    async logUserActivity(userId, action, description) {
    try {
      // Ensure userId is a valid integer
      let parsedUserId = userId;

      // If userId is a string that represents a role instead of an ID
      if (typeof userId === "string" && isNaN(parseInt(userId))) {
        console.warn(`⚠️ User ID "${userId}" is not a number, fetching system user...`);
        
        // Get or create system user
        const systemUserQuery = `
          SELECT u_id FROM user_org 
          WHERE u_email = 'system@bloodsync.org' 
          LIMIT 1
        `;
        const systemUserResult = await pool.query(systemUserQuery);
        
        if (systemUserResult.rows.length > 0) {
          parsedUserId = systemUserResult.rows[0].u_id;
          console.log('✓ Using existing system user ID:', parsedUserId);
        } else {
          // Create system user if doesn't exist
          console.log('Creating new system user...');
          const createSystemQuery = `
            INSERT INTO user_org (
              u_org_id, u_full_name, u_category, u_email, u_password, 
              u_status, u_verified_at, u_created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            RETURNING u_id
          `;
          const crypto = require('crypto');
          const systemUserValues = [
            'SYS-0000001',
            'BloodSync System',
            'System',
            'system@bloodsync.org',
            crypto.createHash("sha256").update("system_password").digest("hex"),
            'verified'
          ];
          const createResult = await pool.query(createSystemQuery, systemUserValues);
          parsedUserId = createResult.rows[0].u_id;
          console.log('✓ Created new system user ID:', parsedUserId);
        }
      } else {
        parsedUserId = parseInt(userId);
      }

      // Verify user exists before logging
      const verifyUserQuery = `SELECT u_id FROM user_org WHERE u_id = $1`;
      const verifyResult = await pool.query(verifyUserQuery, [parsedUserId]);
      
      if (verifyResult.rows.length === 0) {
        console.warn(`⚠️ User ID ${parsedUserId} not found in user_org, skipping log`);
        return null;
      }

      // Insert into user_org_log table
      const query = `
        INSERT INTO user_org_log (
          ual_user_id,
          ual_action,
          ual_description,
          ual_timestamp
        ) VALUES ($1, $2, $3, NOW())
        RETURNING ual_id, ual_timestamp
      `;

      const result = await pool.query(query, [
        parsedUserId,
        action,
        description,
      ]);
      
      console.log('✅ Activity logged to user_org_log:', {
        logId: result.rows[0].ual_id,
        userId: parsedUserId,
        action: action,
        timestamp: result.rows[0].ual_timestamp
      });
      
      return result.rows[0];
    } catch (error) {
      console.error("❌ Error logging user activity to user_org_log:", error);
      console.error("Details:", {
        userId: userId,
        action: action,
        description: description,
        errorMessage: error.message,
        errorCode: error.code,
      });
      // Return null instead of throwing to prevent breaking the main operation
      return null;
    }
  },

  async getUserActivityLogOrg(userId, limit = 20, offset = 0) {
  try {
    console.log(`📋 Fetching activity log for user ${userId}, limit: ${limit}, offset: ${offset}`);
    
    const query = `
      SELECT
        ual_id as id,
        ual_user_id as "userId",
        ual_action as action,
        ual_description as description,
        TO_CHAR(ual_timestamp, 'MM/DD/YYYY') as date,
        TO_CHAR(ual_timestamp, 'HH12:MI AM') as time,
        ual_timestamp as timestamp
      FROM user_org_log
      WHERE ual_user_id = $1
      ORDER BY ual_timestamp DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [userId, limit, offset]);
    console.log(`✅ Fetched ${result.rows.length} activity logs for user ${userId}`);
    
    return result.rows;
  } catch (error) {
    console.error("❌ Error fetching user activity log from user_org_log:", error);
    throw error;
  }
},

  async getUserActivityLogCountOrg(userId) {
  try {
    const query = `
      SELECT COUNT(*) as total
      FROM user_org_log
      WHERE ual_user_id = $1
    `;

    const result = await pool.query(query, [userId]);
    const count = parseInt(result.rows[0].total);
    console.log(`✅ Total activity count for user ${userId}: ${count}`);
    return count;
  } catch (error) {
    console.error("❌ Error fetching user activity log count from user_org_log:", error);
    throw error;
  }
},

  async updateUserPasswordOrg(userId, currentPassword, newPassword) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Hash the current password input to compare with database
      const hashedCurrentPassword = crypto
        .createHash("sha256")
        .update(currentPassword)
        .digest("hex");

      // Get user data including current password
      const verifyQuery = `
      SELECT u_id, u_password, u_email, u_full_name 
      FROM user_org 
      WHERE u_id = $1 AND u_status = 'verified'
    `;

      const verifyResult = await client.query(verifyQuery, [userId]);

      if (verifyResult.rows.length === 0) {
        await client.query("ROLLBACK");
        throw new Error("User not found");
      }

      const user = verifyResult.rows[0];

      // Compare the hashed current password with the one in database
      if (user.u_password !== hashedCurrentPassword) {
        await client.query("ROLLBACK");
        throw new Error("Current password is incorrect");
      }

      // Hash the new password
      const hashedNewPassword = crypto
        .createHash("sha256")
        .update(newPassword)
        .digest("hex");

      // Update to the new password
      const updateQuery = `
      UPDATE user_org 
      SET u_password = $1, u_modified_at = NOW()
      WHERE u_id = $2
      RETURNING u_id
    `;

      const result = await client.query(updateQuery, [
        hashedNewPassword,
        user.u_id,
      ]);

      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        throw new Error("Failed to update password");
      }

      // Log the password change activity
      try {
        await this.logUserActivity(
          user.u_id,
          "PASSWORD_CHANGE",
          `User ${user.u_full_name} changed their password`
        );
      } catch (logError) {
        console.error("Failed to log activity (non-critical):", logError);
      }

      await client.query("COMMIT");

      return {
        success: true,
        message: "Password updated successfully",
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error updating password:", error);
      return {
        success: false,
        message: error.message,
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
      UPDATE user_org
      SET u_permissions = $1::jsonb, u_modified_at = NOW()
      WHERE u_id = $2
      RETURNING u_id, u_permissions
    `;

      const result = await client.query(query, [
        JSON.stringify(permissions),
        userId,
      ]);

      // Log the permission change
      await this.logUserActivity(
        userId,
        "PERMISSIONS_UPDATED",
        `User permissions were updated by administrator`
      );

      await client.query("COMMIT");

      return {
        success: true,
        user: result.rows[0],
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
      FROM user_org
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
        u_org_id as "orgId",
        u_full_name as "fullName",
        u_category as category,
        u_email as email,
        u_status as status,
        u_permissions as permissions,
        TO_CHAR(u_verified_at, 'MM/DD/YYYY HH24:MI') as "verifiedAt"
      FROM user_org
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
        u_org_id as "orgId",
        u_full_name as "fullName",
        u_category as category,
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
      FROM user_org
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

  //====================== RESET PASSWORD METHODS ======================
  // Send recovery code via email - ORGANIZATION
  async sendRecoveryCodeOrg(email) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Normalize email input - remove all whitespace and convert to lowercase
      const normalizedEmail = email.trim().toLowerCase().replace(/\s+/g, "");
      console.log("Normalized email:", normalizedEmail);

      // Check if email exists - using multiple strategies to find the user
      const checkEmailQuery = `
      SELECT u_id, u_full_name, u_email, u_status
      FROM user_org 
      WHERE LOWER(TRIM(BOTH FROM u_email)) = $1
         OR LOWER(REPLACE(u_email, ' ', '')) = $1
    `;
      const emailCheck = await client.query(checkEmailQuery, [normalizedEmail]);

      console.log(
        "Email check result:",
        emailCheck.rows.length > 0 ? "Found" : "Not found"
      );

      if (emailCheck.rows.length === 0) {
        await client.query("ROLLBACK");

        // Additional debug query to see all emails in the database
        const debugQuery = `SELECT u_email FROM user_org LIMIT 5`;
        const debugResult = await pool.query(debugQuery);
        console.log("Sample emails in database:", debugResult.rows);

        throw new Error(
          "Email not found. Please check your email address and try again."
        );
      }

      const user = emailCheck.rows[0];
      console.log("Found user:", user.u_email, "Status:", user.u_status);

      // Check if account is verified
      if (user.u_status !== "verified") {
        await client.query("ROLLBACK");
        throw new Error(
          "Account is not verified. Please contact administrator."
        );
      }

      // Generate 6-digit recovery code
      const recoveryCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();
      console.log("Generated recovery code:", recoveryCode);

      // Set expiration time (15 minutes from now)
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // Store recovery code in database
      const updateQuery = `
      UPDATE user_org 
      SET u_recovery_code = $1,
          u_recovery_code_expires = $2,
          u_modified_at = NOW()
      WHERE u_id = $3
      RETURNING u_email
    `;
      const updateResult = await client.query(updateQuery, [
        recoveryCode,
        expiresAt,
        user.u_id,
      ]);
      console.log("Recovery code stored for:", updateResult.rows[0].u_email);

      // Send email with recovery code
      const mailOptions = {
        from: "bloodsync.doh@gmail.com",
        to: user.u_email, // Use the email from database, not the input
        subject: "Password Reset Code - BloodSync",
        html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #165c3c; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
            .code-box { background: #fff3cd; border: 2px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 5px; text-align: center; }
            .code { font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #856404; }
            .warning { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello ${user.u_full_name},</p>
              <p>We received a request to reset your BloodSync account password. Use the code below to proceed:</p>
              
              <div class="code-box">
                <p style="margin: 0; font-size: 14px; color: #666;">Your Recovery Code:</p>
                <p class="code">${recoveryCode}</p>
              </div>

              <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>This code will expire in 15 minutes</li>
                  <li>Do not share this code with anyone</li>
                  <li>If you didn't request this, please ignore this email</li>
                </ul>
              </div>

              <p><strong>Password Requirements:</strong></p>
              <ul>
                <li>At least 8 characters long</li>
                <li>At least one uppercase letter (A-Z)</li>
                <li>At least one lowercase letter (a-z)</li>
                <li>At least one number (0-9)</li>
                <li>At least one special character (@$!%*?&)</li>
              </ul>
            </div>
            <div class="footer">
              <p>&copy; 2025 Code Red Corporation - BloodSync ver. 1.0</p>
            </div>
          </div>
        </body>
        </html>
      `,
      };

      try {
        await emailTransporter.sendMail(mailOptions);
        console.log("Recovery email sent successfully to:", user.u_email);
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        await client.query("ROLLBACK");
        throw new Error(
          "Failed to send recovery email. Please try again later."
        );
      }

      await client.query("COMMIT");

      return {
        success: true,
        message: "Recovery code sent to your email",
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error sending recovery code:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Reset password with recovery code - ORGANIZATION
  async resetPasswordOrg(email, recoveryCode, newPassword) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Normalize email - use same strategy as sendRecoveryCodeOrg
      const normalizedEmail = email.trim().toLowerCase().replace(/\s+/g, "");
      console.log("Resetting password for:", normalizedEmail);

      // Verify recovery code - use same email matching strategy
      const verifyQuery = `
      SELECT u_id, u_full_name, u_recovery_code, u_recovery_code_expires, u_status, u_email
      FROM user_org
      WHERE LOWER(TRIM(BOTH FROM u_email)) = $1
         OR LOWER(REPLACE(u_email, ' ', '')) = $1
    `;
      const result = await client.query(verifyQuery, [normalizedEmail]);

      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        throw new Error("Email not found");
      }

      const user = result.rows[0];

      if (user.u_status !== "verified") {
        await client.query("ROLLBACK");
        throw new Error("Account is not verified");
      }

      // Check if recovery code exists
      if (!user.u_recovery_code) {
        await client.query("ROLLBACK");
        throw new Error("No recovery code found. Please request a new one.");
      }

      // Check if recovery code matches
      if (user.u_recovery_code !== recoveryCode) {
        await client.query("ROLLBACK");
        throw new Error("Invalid recovery code");
      }

      // Check if recovery code has expired
      if (new Date() > new Date(user.u_recovery_code_expires)) {
        await client.query("ROLLBACK");
        throw new Error("Recovery code has expired. Please request a new one.");
      }

      // Validate password strength
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        await client.query("ROLLBACK");
        throw new Error(
          "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        );
      }

      // Hash new password
      const hashedPassword = crypto
        .createHash("sha256")
        .update(newPassword)
        .digest("hex");

      // Update password and clear recovery code
      const updateQuery = `
      UPDATE user_org
      SET u_password = $1,
          u_recovery_code = NULL,
          u_recovery_code_expires = NULL,
          u_modified_at = NOW()
      WHERE u_id = $2
    `;
      await client.query(updateQuery, [hashedPassword, user.u_id]);

      console.log("Password reset successfully for user:", user.u_full_name);

      // Log the password reset activity
      try {
        await this.logUserActivity(
          user.u_id,
          "PASSWORD_RESET",
          `User ${user.u_full_name} reset their password via recovery code`
        );
      } catch (logError) {
        console.error("Failed to log activity (non-critical):", logError);
      }

      // Send confirmation email - use email from database
      const mailOptions = {
        from: "bloodsync.doh@gmail.com",
        to: user.u_email, // Use database email, not input email
        subject: "Password Successfully Reset - BloodSync",
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
              <h1>Password Reset Successful</h1>
            </div>
            <div class="content">
              <div class="success-box">
                <h2>✓ Your password has been reset</h2>
              </div>
              <p>Hello ${user.u_full_name},</p>
              <p>Your BloodSync account password has been successfully reset.</p>
              <p>You can now log in with your new password.</p>
              <p>If you did not make this change, please contact your administrator immediately.</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Code Red Corporation - BloodSync ver. 1.0</p>
            </div>
          </div>
        </body>
        </html>
      `,
      };

      try {
        await emailTransporter.sendMail(mailOptions);
        console.log("Confirmation email sent successfully");
      } catch (emailError) {
        console.error(
          "Failed to send confirmation email (non-critical):",
          emailError
        );
      }

      await client.query("COMMIT");

      return {
        success: true,
        message: "Password reset successfully",
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error resetting password:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  // ========== ACTIVITY LOG METHODS FOR PROFILE ==========

  // Get user activity log with pagination and date grouping
  async getUserActivityLogOrg(userId, page = 1, limit = 6) {
    try {
      const offset = (page - 1) * limit;

      const query = `
      SELECT 
        ual_id as id,
        ual_user_id as "userId",
        ual_action as action,
        ual_description as description,
        TO_CHAR(ual_timestamp, 'Month DD, YYYY') as date,
        TO_CHAR(ual_timestamp, 'HH12:MI AM') as time,
        ual_timestamp as timestamp
      FROM user_org_log
      WHERE ual_user_id = $1
      ORDER BY ual_timestamp DESC
      LIMIT $2 OFFSET $3
    `;

      const result = await pool.query(query, [userId, limit, offset]);

      // Group activities by date
      const groupedActivities = result.rows.reduce((acc, activity) => {
        const date = activity.date;
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push({
          id: activity.id,
          text: activity.description,
          time: activity.time,
          action: activity.action,
        });
        return acc;
      }, {});

      return groupedActivities;
    } catch (error) {
      console.error("Error fetching user activity log org:", error);
      throw error;
    }
  },

  // Get total count for pagination
  async getUserActivityLogCountOrg(userId) {
    try {
      const query = `
      SELECT COUNT(*) as total
      FROM user_org_log
      WHERE ual_user_id = $1
    `;

      const result = await pool.query(query, [userId]);
      return parseInt(result.rows[0].total);
    } catch (error) {
      console.error("Error fetching user activity log count org:", error);
      throw error;
    }
  },

  // Get activity log with date range filter
  async getUserActivityLogWithFilterOrg(
    userId,
    startDate,
    endDate,
    page = 1,
    limit = 6
  ) {
    try {
      const offset = (page - 1) * limit;

      const query = `
      SELECT 
        ual_id as id,
        ual_user_id as "userId",
        ual_action as action,
        ual_description as description,
        TO_CHAR(ual_timestamp, 'Month DD, YYYY') as date,
        TO_CHAR(ual_timestamp, 'HH12:MI AM') as time,
        ual_timestamp as timestamp
      FROM user_org_log
      WHERE ual_user_id = $1
        AND ual_timestamp >= $2
        AND ual_timestamp <= $3
      ORDER BY ual_timestamp DESC
      LIMIT $4 OFFSET $5
    `;

      const result = await pool.query(query, [
        userId,
        startDate,
        endDate,
        limit,
        offset,
      ]);

      // Group activities by date
      const groupedActivities = result.rows.reduce((acc, activity) => {
        const date = activity.date;
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push({
          id: activity.id,
          text: activity.description,
          time: activity.time,
          action: activity.action,
        });
        return acc;
      }, {});

      return groupedActivities;
    } catch (error) {
      console.error("Error fetching filtered activity log org:", error);
      throw error;
    }
  },

  // ========== SYNC REQUEST METHODS ==========
async createSyncRequest(
  sourceOrganization,
  sourceUserName,
  sourceUserId,
  donorIds
) {
  const orgClient = await pool.connect();
  const dohClient = await dohPool.connect();
  
  try {
    await orgClient.query("BEGIN");
    await dohClient.query("BEGIN");

    // ✅ FIXED: Get donor records with ACTUAL recent_donation dates
    const getDonorsQuery = `
      SELECT 
        dr_donor_id,
        dr_first_name,
        dr_middle_name,
        dr_last_name,
        dr_gender,
        dr_birthdate,
        dr_age,
        dr_blood_type,
        dr_rh_factor,
        dr_contact_number,
        dr_address,
        -- IMPORTANT: Make sure we're getting the actual donation date
        dr_recent_donation
      FROM donor_record_org
      WHERE dr_id = ANY($1) AND dr_source_organization = $2
    `;
    const donorsResult = await orgClient.query(getDonorsQuery, [
      donorIds,
      sourceOrganization,
    ]);

    if (donorsResult.rows.length === 0) {
      throw new Error("No donor records found to sync");
    }

    // Insert into temp_donor_records
    const insertPromises = donorsResult.rows.map((donor) => {
      const insertQuery = `
        INSERT INTO temp_donor_records (
          tdr_donor_id,
          tdr_first_name,
          tdr_middle_name,
          tdr_last_name,
          tdr_gender,
          tdr_birthdate,
          tdr_age,
          tdr_blood_type,
          tdr_rh_factor,
          tdr_contact_number,
          tdr_address,
          tdr_source_organization,
          tdr_source_user_id,
          tdr_source_user_name,
          tdr_sync_status,
          tdr_recent_donation,  -- Store the actual donation date
          tdr_created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'pending', $15, NOW())
        RETURNING *
      `;

      const values = [
        donor.dr_donor_id,
        donor.dr_first_name,
        donor.dr_middle_name,
        donor.dr_last_name,
        donor.dr_gender,
        donor.dr_birthdate,
        donor.dr_age,
        donor.dr_blood_type,
        donor.dr_rh_factor,
        donor.dr_contact_number,
        donor.dr_address,
        sourceOrganization,
        sourceUserId,
        sourceUserName,
        donor.dr_recent_donation || null,  // ⭐ KEY FIX: Use actual donation date, not null or created_at
      ];

      return dohClient.query(insertQuery, values);
    });

    await Promise.all(insertPromises);

    // Log activity
    try {
      await this.logUserActivity(
        sourceUserId,
        "SYNC_REQUEST",
        `User ${sourceUserName} requested to sync ${donorIds.length} donor record(s) to Regional Blood Center`
      );
    } catch (logError) {
      console.error("Failed to log activity (non-critical):", logError);
    }

    await orgClient.query("COMMIT");
    await dohClient.query("COMMIT");

    console.log(`✅ Created ${donorsResult.rows.length} temp_donor_records for sync request`);

    return {
      success: true,
      message: `Sync request sent for ${donorsResult.rows.length} donor(s)`,
      count: donorsResult.rows.length,
    };
  } catch (error) {
    await orgClient.query("ROLLBACK");
    await dohClient.query("ROLLBACK");
    console.error("Error creating sync request:", error);
    throw error;
  } finally {
    orgClient.release();
    dohClient.release();
  }
},
// Get pending temp donor records from DOH database
async getPendingTempDonorRecords() {
  try {
    const query = `
      SELECT 
        tdr_id,
        tdr_donor_id as donor_id,
        tdr_first_name as first_name,
        tdr_middle_name as middle_name,
        tdr_last_name as last_name,
        tdr_gender as gender,
        tdr_birthdate as birthdate,
        tdr_age as age,
        tdr_blood_type as blood_type,
        tdr_rh_factor as rh_factor,
        tdr_contact_number as contact_number,
        tdr_address as address,
        tdr_source_organization,
        tdr_source_user_id,
        tdr_source_user_name,
        tdr_sync_status,
        tdr_recent_donation
      FROM temp_donor_records
      WHERE tdr_sync_status = 'pending'
      ORDER BY tdr_created_at DESC
    `;

    const result = await dohPool.query(query);
    return result.rows;
  } catch (error) {
    console.error("Error getting pending temp donor records:", error);
    throw error;
  }
},

// BACKEND FIX - Replace your approveTempDonorRecords function
async approveTempDonorRecords(tdrIds, approvedBy) {
  const dohClient = await dohPool.connect();
  
  try {
    await dohClient.query("BEGIN");

    // Get temp donor records
    const getTempQuery = `
      SELECT * FROM temp_donor_records
      WHERE tdr_id = ANY($1) AND tdr_sync_status = 'pending'
    `;
    const tempResult = await dohClient.query(getTempQuery, [tdrIds]);

    if (tempResult.rows.length === 0) {
      throw new Error("No pending temp donor records found");
    }

    // Store organization info for mail notification
    const sourceOrganization = tempResult.rows[0].tdr_source_organization;
    const sourceUserName = tempResult.rows[0].tdr_source_user_name;
    const submittedDate = tempResult.rows[0].tdr_created_at; // IMPORTANT: Store this!

    let insertedCount = 0;
    let updatedCount = 0;

    // Process each temp donor record
    for (const tempDonor of tempResult.rows) {
      // Check if donor already exists (match by first name, middle name, last name)
      const checkExistingQuery = `
        SELECT dr_id, dr_donor_id, dr_recent_donation, dr_donation_count
        FROM donor_records
        WHERE LOWER(TRIM(dr_first_name)) = LOWER(TRIM($1))
          AND LOWER(TRIM(COALESCE(dr_middle_name, ''))) = LOWER(TRIM(COALESCE($2, '')))
          AND LOWER(TRIM(dr_last_name)) = LOWER(TRIM($3))
        LIMIT 1
      `;
      
      const existingResult = await dohClient.query(checkExistingQuery, [
        tempDonor.tdr_first_name,
        tempDonor.tdr_middle_name || '',
        tempDonor.tdr_last_name,
      ]);

      if (existingResult.rows.length > 0) {
        // Donor exists - ONLY update recent_donation and donation_count
        const existingRecord = existingResult.rows[0];
        const recentDonationDate = tempDonor.tdr_recent_donation || new Date();
        
        const updateQuery = `
          UPDATE donor_records
          SET dr_recent_donation = $2,
              dr_donation_count = COALESCE(dr_donation_count, 0) + 1,
              dr_modified_at = NOW()
          WHERE dr_id = $1
          RETURNING dr_id, dr_donor_id, dr_first_name, dr_last_name
        `;
        
        const updateResult = await dohClient.query(updateQuery, [existingRecord.dr_id, recentDonationDate]);
        updatedCount++;
        
        console.log(`[SYNC] Updated existing donor: ${updateResult.rows[0].dr_donor_id} - ${updateResult.rows[0].dr_first_name} ${updateResult.rows[0].dr_last_name}`);
      } else {
        // No duplicate - insert new record with DOH-generated ID
        const generateIdQuery = `SELECT generate_doh_donor_id() as new_id`;
        const idResult = await dohClient.query(generateIdQuery);
        const newDohDonorId = idResult.rows[0].new_id;

        const insertQuery = `
        INSERT INTO donor_records (
          dr_donor_id,
          dr_first_name,
          dr_middle_name,
          dr_last_name,
          dr_gender,
          dr_birthdate,
          dr_age,
          dr_blood_type,
          dr_rh_factor,
          dr_contact_number,
          dr_address,
          dr_status,
          dr_recent_donation,
          dr_donation_count,
          dr_created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 1, NOW())
        RETURNING dr_id, dr_donor_id, dr_first_name, dr_last_name
      `;

        const values = [
          newDohDonorId,
          tempDonor.tdr_first_name,
          tempDonor.tdr_middle_name,
          tempDonor.tdr_last_name,
          tempDonor.tdr_gender,
          tempDonor.tdr_birthdate,
          tempDonor.tdr_age,
          tempDonor.tdr_blood_type,
          tempDonor.tdr_rh_factor,
          tempDonor.tdr_contact_number,
          tempDonor.tdr_address,
          'Non-Reactive',
          tempDonor.tdr_recent_donation || new Date()
        ];

        const insertResult = await dohClient.query(insertQuery, values);
        insertedCount++;
        
        console.log(`[SYNC] Inserted new donor: ${insertResult.rows[0].dr_donor_id} - ${insertResult.rows[0].dr_first_name} ${insertResult.rows[0].dr_last_name}`);
      }
    }

    // Update temp_donor_records status to 'approved'
    const updateTempQuery = `
      UPDATE temp_donor_records
      SET 
        tdr_sync_status = 'approved',
        tdr_approved_by = $1,
        tdr_approved_at = NOW()
      WHERE tdr_id = ANY($2)
    `;
    
    await dohClient.query(updateTempQuery, [approvedBy, tdrIds]);

    // FIX: Create mail notification for the organization (APPROVAL)
    try {
      const mailId = `MAIL-SYNC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const subject = `Donor Record Sync Approved - ${tempResult.rows.length} Record(s)`;
      const preview = `Your sync request for ${tempResult.rows.length} donor record(s) has been approved.`;
      const body = `Dear ${sourceOrganization},\n\nWe are pleased to inform you that your donor record sync request has been APPROVED by the Regional Blood Center.\n\nSync Details:\n- Organization: ${sourceOrganization}\n- Requestor: ${sourceUserName}\n- Records Approved: ${tempResult.rows.length}\n- New Donors Added: ${insertedCount}\n- Existing Donors Updated: ${updatedCount}\n- Approved By: ${approvedBy}\n- Date: ${new Date().toLocaleDateString()}\n\nThank you for your contribution to our blood donation program.\n\nBest regards,\nRegional Blood Center Team`;

      const insertMailQuery = `
        INSERT INTO mails (
          mail_id, from_name, from_email, subject, preview, body,
          status, request_title, requestor, request_organization,
          date_submitted, organization_type, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      `;

      // Use organization database pool for mails
      const orgClient = await orgPool.connect();
      try {
        await orgClient.query(insertMailQuery, [
          mailId,
          'Regional Blood Center',
          'admin@regionalbloodcenter.org',
          subject,
          preview,
          body,
          'approved',
          `Donor Record Sync - ${sourceOrganization}`,
          approvedBy,
          sourceOrganization,
          submittedDate, // FIX: Use the actual submission date
          'organization'
        ]);
        console.log(`📧 Approval mail sent to ${sourceOrganization}`);
      } finally {
        orgClient.release();
      }
    } catch (mailError) {
      console.error('⚠️ Error creating approval mail (non-critical):', mailError);
      // Don't fail the transaction if mail creation fails
    }

    await dohClient.query("COMMIT");

    console.log(`[SYNC] Approved ${tempResult.rows.length} donor records from sync request`);
    console.log(`[SYNC] - New donors inserted: ${insertedCount}`);
    console.log(`[SYNC] - Existing donors updated: ${updatedCount}`);

    return {
      success: true,
      message: `Successfully synced ${tempResult.rows.length} donor record(s)`,
      count: tempResult.rows.length,
      insertedCount: insertedCount,
      updatedCount: updatedCount,
    };
  } catch (error) {
    await dohClient.query("ROLLBACK");
    console.error("Error approving temp donor records:", error);
    throw error;
  } finally {
    dohClient.release();
  }
},

  // ========== MAIL METHODS ==========
  async getAllMails() {
    try {
      // Assuming you have a 'mails' table. If not, we can mock it or join partnership_requests
      // This query fetches mails and joins with appointments/requests if needed
      const query = `
        SELECT 
          id, mail_id, from_name, from_email, subject, preview, body, 
          created_at, is_read as read, is_starred as starred, category,
          status, appointment_id
        FROM mails
        ORDER BY created_at DESC
      `;

      // Fallback: If table doesn't exist, return partnership requests formatted as mail
      // You can remove this try/catch block once you create the 'mails' table
      try {
        const result = await pool.query(query);
        return result.rows;
      } catch (err) {
        console.warn(
          "Mails table not found, returning empty array or mock data"
        );
        return [];
      }
    } catch (error) {
      console.error("Error fetching mails:", error);
      throw error;
    }
  },

  async markMailAsRead(mailId) {
    try {
      const query = `UPDATE mails SET is_read = true WHERE id = $1 OR mail_id = $2`;
      await pool.query(query, [mailId, mailId]); // Try both ID types
      return { success: true };
    } catch (error) {
      console.error("Error marking mail read:", error);
      return { success: false };
    }
  },

  async toggleMailStar(mailId) {
    try {
      const query = `UPDATE mails SET is_starred = NOT is_starred WHERE id = $1 OR mail_id = $2`;
      await pool.query(query, [mailId, mailId]);
      return { success: true };
    } catch (error) {
      console.error("Error toggling mail star:", error);
      return { success: false };
    }
  },

  async deleteMail(mailId) {
    try {
      const query = `DELETE FROM mails WHERE id = $1 OR mail_id = $2`;
      await pool.query(query, [mailId, mailId]);
      return { success: true };
    } catch (error) {
      console.error("Error deleting mail:", error);
      return { success: false };
    }
  },

  // ========== NOTIFICATION METHODS ==========
  async getAllNotificationsOrg() {
    try {
      // Attempts to fetch from notifications_org
      const query = `
        SELECT * FROM notifications_org 
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error("Error fetching org notifications:", error);
      return [];
    }
  },

  async getUnreadNotificationCount() {
    try {
      const query = `SELECT COUNT(*) as count FROM notifications_org WHERE is_read = false`;
      const result = await pool.query(query);
      return parseInt(result.rows[0].count);
    } catch (error) {
      return 0;
    }
  },

  async markOrgNotificationAsRead(id) {
    try {
      const query = `UPDATE notifications_org SET is_read = true WHERE id = $1`;
      await pool.query(query, [id]);
      return { success: true };
    } catch (error) {
      console.error("Error marking notification:", error);
      return { success: false };
    }
  },

  async markAllOrgNotificationsAsRead() {
    try {
      const query = `UPDATE notifications_org SET is_read = true`;
      await pool.query(query);
      return { success: true };
    } catch (error) {
      console.error("Error marking all notifications:", error);
      return { success: false };
    }
  },

  async createOrgNotification(notificationData) {
    try {
      const { userId, title, message, type } = notificationData;
      // Prepend title to message if it exists, to not lose the information
      const fullMessage = title ? `${title}: ${message}` : message;

      const query = `
        INSERT INTO notifications_org (user_id, message, type, created_at, is_read)
        VALUES ($1, $2, $3, NOW(), false)
        RETURNING *
      `;
      const result = await pool.query(query, [userId, fullMessage, type]);
      return result.rows[0];
    } catch (error) {
      console.error("Error creating org notification:", error);
      throw error;
    }
  },

  async createMail(mailData) {
    try {
      const { from_name, from_email, subject, body, category, status, appointment_id } = mailData;
      const query = `
        INSERT INTO mails (mail_id, from_name, from_email, subject, preview, body, created_at, is_read, is_starred, category, status, appointment_id)
        VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, NOW(), false, false, $6, $7, $8)
        RETURNING *
      `;
      const preview = body.substring(0, 100);
      const result = await pool.query(query, [from_name, from_email, subject, preview, body, category, status, appointment_id]);
      return result.rows[0];
    } catch (error) {
      console.error("Error creating mail:", error);
      throw error;
    }
  },

  async getUnsyncedDonorCount(sourceOrganization) {
    const result = await db.get(
      `SELECT COUNT(*) as count FROM donor_records_org 
      WHERE source_organization = ? AND (synced = 0 OR synced IS NULL)`,
      [sourceOrganization]
    );
    return result.count || 0;
  },

  //==================USER LOG============================
  async logUserActivity(userId, action, description) {
  try {
    // Ensure userId is a valid integer
    let parsedUserId = userId;

    // If userId is a string that represents a role instead of an ID
    if (typeof userId === "string" && isNaN(parseInt(userId))) {
      console.warn(`User ID "${userId}" is not a number, fetching system user...`);
      
      // Get or create system user
      const systemUserQuery = `
        SELECT u_id FROM user_org 
        WHERE u_email = 'system@bloodsync.org' 
        LIMIT 1
      `;
      const systemUserResult = await pool.query(systemUserQuery);
      
      if (systemUserResult.rows.length > 0) {
        parsedUserId = systemUserResult.rows[0].u_id;
      } else {
        parsedUserId = 0; // Fallback
      }
    } else {
      parsedUserId = parseInt(userId);
    }

    // FIXED: Insert into user_org_log table
    const query = `
      INSERT INTO user_org_log (
        ual_user_id,
        ual_action,
        ual_description,
        ual_timestamp
      ) VALUES ($1, $2, $3, NOW())
      RETURNING ual_id
    `;

    const result = await pool.query(query, [
      parsedUserId,
      action,
      description,
    ]);
    
    console.log('✓ Activity logged successfully to user_org_log:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error("Error logging user activity to user_org_log:", error);
    console.error("Error details:", {
      userId: userId,
      action: action,
      description: description,
      message: error.message,
      code: error.code,
    });
    return null;
  }
},

// FIXED: Get user activity log from user_org_log table
async getUserActivityLogOrg(userId, limit = 20, offset = 0) {
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
      FROM user_org_log
      WHERE ual_user_id = $1
      ORDER BY ual_timestamp DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [userId, limit, offset]);
    console.log(`✓ Fetched ${result.rows.length} activity logs for user ${userId}`);
    return result.rows;
  } catch (error) {
    console.error("Error fetching user activity log from user_org_log:", error);
    throw error;
  }
},

// FIXED: Get total count from user_org_log table
async getUserActivityLogCountOrg(userId) {
  try {
    const query = `
      SELECT COUNT(*) as total
      FROM user_org_log
      WHERE ual_user_id = $1
    `;

    const result = await pool.query(query, [userId]);
    const count = parseInt(result.rows[0].total);
    console.log(`✓ Total activity count for user ${userId}: ${count}`);
    return count;
  } catch (error) {
    console.error("Error fetching user activity log count from user_org_log:", error);
    throw error;
  }
},
};

module.exports = dbOrgService;
