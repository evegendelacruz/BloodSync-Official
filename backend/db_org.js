const { Pool } = require('pg');
const path = require('path');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres_org',
  password: 'bloodsync',
  port: 5432,
});

// Initialize database tables
const initializeDatabase = async () => {
  try {
    // Create donors table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS donors (
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create appointments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        appointment_id BIGINT UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        appointment_date DATE NOT NULL,
        appointment_time VARCHAR(10) NOT NULL,
        appointment_type VARCHAR(50) NOT NULL CHECK (appointment_type IN ('blood-donation', 'sync-request')),
        contact_type VARCHAR(20) NOT NULL CHECK (contact_type IN ('barangay', 'organization')),
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        address TEXT NOT NULL,
        message TEXT,
        notes TEXT,
        status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create activity logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_name VARCHAR(255) NOT NULL,
        action_type VARCHAR(50) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(100),
        action_description TEXT NOT NULL,
        details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create organization_user_profiles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS organization_user_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES user_org_doh(id) ON DELETE CASCADE,
        profile_photo TEXT,
        gender VARCHAR(50) CHECK (gender IN ('Male', 'Female', 'Non-Binary', 'Prefer Not to Say')),
        date_of_birth DATE,
        nationality VARCHAR(100) DEFAULT 'Filipino',
        civil_status VARCHAR(50) CHECK (civil_status IN ('Single', 'Married', 'Widowed', 'Divorced', 'Separated')),
        blood_type VARCHAR(3) CHECK (blood_type IN ('AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      )
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_name);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
    `);

    // Create trigger to update updated_at timestamp for donors
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS update_donors_updated_at ON donors;
      CREATE TRIGGER update_donors_updated_at
          BEFORE UPDATE ON donors
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `);

    // Create trigger to update updated_at timestamp for appointments
    await pool.query(`
      DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
      CREATE TRIGGER update_appointments_updated_at
          BEFORE UPDATE ON appointments
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// ========== ACTIVITY LOGGING FUNCTIONS ==========

const logActivity = async (activityData) => {
  try {
    const insertQuery = `
      INSERT INTO activity_logs (
        user_name, action_type, entity_type, entity_id, 
        action_description, details
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      activityData.userName,
      activityData.actionType,
      activityData.entityType,
      activityData.entityId,
      activityData.actionDescription,
      JSON.stringify(activityData.details || {})
    ];
    
    const result = await pool.query(insertQuery, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw error to prevent activity logging from breaking main operations
  }
};

const getAllActivities = async (limit = 100, offset = 0) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        user_name,
        action_type,
        entity_type,
        entity_id,
        action_description,
        details,
        created_at
      FROM activity_logs 
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    return result.rows.map(row => ({
      ...row,
      details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details
    }));
  } catch (error) {
    console.error('Error getting activities:', error);
    throw error;
  }
};

const searchActivities = async (searchTerm, limit = 100) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        user_name,
        action_type,
        entity_type,
        entity_id,
        action_description,
        details,
        created_at
      FROM activity_logs 
      WHERE 
        user_name ILIKE $1 OR
        action_description ILIKE $1 OR
        entity_type ILIKE $1 OR
        entity_id ILIKE $1
      ORDER BY created_at DESC
      LIMIT $2
    `, [`%${searchTerm}%`, limit]);
    
    return result.rows.map(row => ({
      ...row,
      details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details
    }));
  } catch (error) {
    console.error('Error searching activities:', error);
    throw error;
  }
};

const generateActivityDescription = (actionType, entityType, details) => {
  switch (actionType) {
    case 'add':
      if (entityType === 'donor') {
        return `Added new donor ${details.donorName || ''} (${details.donorId || ''}) with blood type ${details.bloodType || ''}${details.rhFactor || ''}`;
      } else if (entityType === 'appointment') {
        return `Scheduled new appointment "${details.appointmentTitle || ''}" for ${details.appointmentDate || ''} at ${details.appointmentTime || ''}`;
      }
      break;
    case 'update':
      if (entityType === 'donor') {
        return `Updated donor information for ${details.donorName || ''} (${details.donorId || ''})`;
      } else if (entityType === 'appointment') {
        return `Modified appointment "${details.appointmentTitle || ''}" scheduled for ${details.appointmentDate || ''}`;
      }
      break;
    case 'delete':
      if (entityType === 'donor') {
        const count = details.count || 1;
        return count > 1 
          ? `Deleted ${count} donor records from the system`
          : `Deleted donor ${details.donorName || ''} (${details.donorId || ''}) from the system`;
      } else if (entityType === 'appointment') {
        const count = details.count || 1;
        return count > 1
          ? `Cancelled ${count} appointments from the system`
          : `Cancelled appointment "${details.appointmentTitle || ''}" scheduled for ${details.appointmentDate || ''}`;
      }
      break;
    case 'complete':
      if (entityType === 'appointment') {
        return `Marked appointment "${details.appointmentTitle || ''}" as completed`;
      }
      break;
    default:
      return `Performed ${actionType} action on ${entityType}`;
  }
  return `Performed ${actionType} action on ${entityType}`;
};

// ========== DONOR CRUD OPERATIONS WITH ACTIVITY LOGGING ==========

// Get all donors
const getAllDonors = async () => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        donor_id,
        first_name,
        middle_name,
        last_name,
        gender,
        TO_CHAR(birthdate, 'MM/DD/YYYY') as birthdate,
        age,
        blood_type,
        rh_factor,
        contact_number,
        address,
        created_at,
        updated_at
      FROM donors 
      ORDER BY created_at DESC
    `);
    
    return result.rows.map(row => ({
      ...row,
      selected: false
    }));
  } catch (error) {
    console.error('Error getting all donors:', error);
    throw error;
  }
};

// Add a new donor with activity logging
const addDonor = async (donorData, userName = 'System User') => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Generate unique donor ID
    const donorIdResult = await client.query(`
      SELECT COALESCE(MAX(CAST(SUBSTRING(donor_id FROM 5 FOR 4) AS INTEGER)), 0) + 1 as next_id
      FROM donors 
      WHERE donor_id LIKE 'DNR-%'
    `);
    
    const nextId = donorIdResult.rows[0].next_id;
    const donorId = `DNR-${String(nextId).padStart(4, '0')}-ON`;
    
    // Insert donor
    const insertQuery = `
      INSERT INTO donors (
        donor_id, first_name, middle_name, last_name, gender, birthdate, age, 
        blood_type, rh_factor, contact_number, address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const values = [
      donorId,
      donorData.firstName,
      donorData.middleName || null,
      donorData.lastName,
      donorData.gender,
      donorData.birthdate,
      donorData.age,
      donorData.bloodType,
      donorData.rhFactor,
      donorData.contactNumber,
      donorData.address
    ];
    
    const result = await client.query(insertQuery, values);
    const donor = result.rows[0];
    
    // Log activity
    const donorName = `${donor.first_name} ${donor.middle_name ? donor.middle_name + ' ' : ''}${donor.last_name}`;
    const activityData = {
      userName: userName,
      actionType: 'add',
      entityType: 'donor',
      entityId: donor.donor_id,
      actionDescription: generateActivityDescription('add', 'donor', {
        donorName: donorName,
        donorId: donor.donor_id,
        bloodType: donor.blood_type,
        rhFactor: donor.rh_factor
      }),
      details: {
        donorName: donorName,
        donorId: donor.donor_id,
        bloodType: donor.blood_type,
        rhFactor: donor.rh_factor,
        gender: donor.gender,
        age: donor.age
      }
    };
    
    await logActivity(activityData);
    await client.query('COMMIT');
    
    // Format the returned data
    return {
      ...donor,
      birthdate: new Date(donor.birthdate).toLocaleDateString('en-US'),
      selected: false
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding donor:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Update a donor with activity logging
const updateDonor = async (id, donorData, userName = 'System User') => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get original donor data for comparison
    const originalResult = await client.query('SELECT * FROM donors WHERE id = $1', [id]);
    if (originalResult.rows.length === 0) {
      throw new Error('Donor not found');
    }
    const originalDonor = originalResult.rows[0];
    
    // Update donor
    const updateQuery = `
      UPDATE donors SET
        first_name = $2,
        middle_name = $3,
        last_name = $4,
        gender = $5,
        birthdate = $6,
        age = $7,
        blood_type = $8,
        rh_factor = $9,
        contact_number = $10,
        address = $11
      WHERE id = $1
      RETURNING *
    `;
    
    const values = [
      id,
      donorData.firstName,
      donorData.middleName || null,
      donorData.lastName,
      donorData.gender,
      donorData.birthdate,
      donorData.age,
      donorData.bloodType,
      donorData.rhFactor,
      donorData.contactNumber,
      donorData.address
    ];
    
    const result = await client.query(updateQuery, values);
    const updatedDonor = result.rows[0];
    
    // Log activity
    const donorName = `${updatedDonor.first_name} ${updatedDonor.middle_name ? updatedDonor.middle_name + ' ' : ''}${updatedDonor.last_name}`;
    const activityData = {
      userName: userName,
      actionType: 'update',
      entityType: 'donor',
      entityId: updatedDonor.donor_id,
      actionDescription: generateActivityDescription('update', 'donor', {
        donorName: donorName,
        donorId: updatedDonor.donor_id
      }),
      details: {
        donorName: donorName,
        donorId: updatedDonor.donor_id,
        changes: {
          from: {
            name: `${originalDonor.first_name} ${originalDonor.middle_name || ''} ${originalDonor.last_name}`,
            bloodType: `${originalDonor.blood_type}${originalDonor.rh_factor}`
          },
          to: {
            name: donorName,
            bloodType: `${updatedDonor.blood_type}${updatedDonor.rh_factor}`
          }
        }
      }
    };
    
    await logActivity(activityData);
    await client.query('COMMIT');
    
    return {
      ...updatedDonor,
      birthdate: new Date(updatedDonor.birthdate).toLocaleDateString('en-US'),
      selected: false
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating donor:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Delete donors with activity logging
const deleteDonors = async (ids, userName = 'System User') => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get donor details before deletion for logging
    const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
    const donorsResult = await client.query(
      `SELECT donor_id, first_name, middle_name, last_name, blood_type, rh_factor FROM donors WHERE donor_id IN (${placeholders})`,
      ids
    );
    const donorsToDelete = donorsResult.rows;
    
    // Delete donors
    const deleteQuery = `DELETE FROM donors WHERE donor_id IN (${placeholders})`;
    const result = await client.query(deleteQuery, ids);
    
    // Log activity
    if (donorsToDelete.length === 1) {
      const donor = donorsToDelete[0];
      const donorName = `${donor.first_name} ${donor.middle_name ? donor.middle_name + ' ' : ''}${donor.last_name}`;
      const activityData = {
        userName: userName,
        actionType: 'delete',
        entityType: 'donor',
        entityId: donor.donor_id,
        actionDescription: generateActivityDescription('delete', 'donor', {
          donorName: donorName,
          donorId: donor.donor_id
        }),
        details: {
          donorName: donorName,
          donorId: donor.donor_id,
          bloodType: `${donor.blood_type}${donor.rh_factor}`
        }
      };
      await logActivity(activityData);
    } else if (donorsToDelete.length > 1) {
      const activityData = {
        userName: userName,
        actionType: 'delete',
        entityType: 'donor',
        entityId: null,
        actionDescription: generateActivityDescription('delete', 'donor', {
          count: donorsToDelete.length
        }),
        details: {
          count: donorsToDelete.length,
          deletedDonors: donorsToDelete.map(d => ({
            donorId: d.donor_id,
            name: `${d.first_name} ${d.middle_name || ''} ${d.last_name}`,
            bloodType: `${d.blood_type}${d.rh_factor}`
          }))
        }
      };
      await logActivity(activityData);
    }
    
    await client.query('COMMIT');
    return { deletedCount: result.rowCount };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting donors:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Search donors
const searchDonors = async (searchTerm) => {
  try {
    const searchQuery = `
      SELECT 
        id,
        donor_id,
        first_name,
        middle_name,
        last_name,
        gender,
        TO_CHAR(birthdate, 'MM/DD/YYYY') as birthdate,
        age,
        blood_type,
        rh_factor,
        contact_number,
        address,
        created_at,
        updated_at
      FROM donors 
      WHERE 
        donor_id ILIKE $1 OR
        first_name ILIKE $1 OR
        middle_name ILIKE $1 OR
        last_name ILIKE $1 OR
        gender ILIKE $1 OR
        blood_type ILIKE $1 OR
        rh_factor ILIKE $1 OR
        contact_number ILIKE $1 OR
        address ILIKE $1
      ORDER BY created_at DESC
    `;
    
    const searchPattern = `%${searchTerm}%`;
    const result = await pool.query(searchQuery, [searchPattern]);
    
    return result.rows.map(row => ({
      ...row,
      selected: false
    }));
    
  } catch (error) {
    console.error('Error searching donors:', error);
    throw error;
  }
};

// Get donor by donor ID
const getDonorByDonorId = async (donorId) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        donor_id,
        first_name,
        middle_name,
        last_name,
        gender,
        TO_CHAR(birthdate, 'MM/DD/YYYY') as birthdate,
        age,
        blood_type,
        rh_factor,
        contact_number,
        address,
        created_at,
        updated_at
      FROM donors 
      WHERE donor_id = $1
    `, [donorId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return {
      ...result.rows[0],
      selected: false
    };
    
  } catch (error) {
    console.error('Error getting donor by ID:', error);
    throw error;
  }
};

// Get donors statistics
const getDonorStatistics = async () => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_donors,
        COUNT(CASE WHEN blood_type = 'A' THEN 1 END) as blood_type_a,
        COUNT(CASE WHEN blood_type = 'B' THEN 1 END) as blood_type_b,
        COUNT(CASE WHEN blood_type = 'AB' THEN 1 END) as blood_type_ab,
        COUNT(CASE WHEN blood_type = 'O' THEN 1 END) as blood_type_o,
        COUNT(CASE WHEN rh_factor = '+' THEN 1 END) as rh_positive,
        COUNT(CASE WHEN rh_factor = '-' THEN 1 END) as rh_negative,
        COUNT(CASE WHEN gender = 'Male' THEN 1 END) as male_donors,
        COUNT(CASE WHEN gender = 'Female' THEN 1 END) as female_donors,
        AVG(age) as average_age
      FROM donors
    `;
    
    const result = await pool.query(statsQuery);
    return result.rows[0];
    
  } catch (error) {
    console.error('Error getting donor statistics:', error);
    throw error;
  }
};

// ========== APPOINTMENT CRUD OPERATIONS WITH ACTIVITY LOGGING ==========

// Get all appointments
const getAllAppointments = async () => {
  try {
    const result = await pool.query(`
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
      ORDER BY appointment_date DESC, appointment_time DESC
    `);
    
    return result.rows.map(row => ({
      ...row,
      contactInfo: {
        lastName: row.last_name,
        email: row.email,
        phone: row.phone,
        address: row.address,
        message: row.message,
        type: row.contact_type
      }
    }));
  } catch (error) {
    console.error('Error getting all appointments:', error);
    throw error;
  }
};

// Add a new appointment with activity logging
const addAppointment = async (appointmentData, userName = 'System User') => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const insertQuery = `
      INSERT INTO appointments (
        appointment_id, title, appointment_date, appointment_time, 
        appointment_type, contact_type, last_name, email, phone, 
        address, message, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    
    const values = [
      appointmentData.id || Date.now(),
      appointmentData.title,
      appointmentData.date,
      appointmentData.time,
      appointmentData.type,
      appointmentData.contactInfo.type || 'organization',
      appointmentData.contactInfo.lastName,
      appointmentData.contactInfo.email,
      appointmentData.contactInfo.phone,
      appointmentData.contactInfo.address,
      appointmentData.contactInfo.message || null,
      appointmentData.notes || null
    ];
    
    const result = await client.query(insertQuery, values);
    const appointment = result.rows[0];
    
    // Log activity
    const activityData = {
      userName: userName,
      actionType: 'add',
      entityType: 'appointment',
      entityId: appointment.appointment_id.toString(),
      actionDescription: generateActivityDescription('add', 'appointment', {
        appointmentTitle: appointment.title,
        appointmentDate: new Date(appointment.appointment_date).toLocaleDateString('en-US'),
        appointmentTime: appointment.appointment_time
      }),
      details: {
        appointmentId: appointment.appointment_id,
        appointmentTitle: appointment.title,
        appointmentDate: new Date(appointment.appointment_date).toLocaleDateString('en-US'),
        appointmentTime: appointment.appointment_time,
        appointmentType: appointment.appointment_type,
        contactType: appointment.contact_type,
        contactName: appointment.last_name,
        contactEmail: appointment.email
      }
    };
    
    await logActivity(activityData);
    await client.query('COMMIT');
    
    return {
      id: appointment.appointment_id,
      title: appointment.title,
      date: appointment.appointment_date.toISOString().split('T')[0],
      time: appointment.appointment_time,
      type: appointment.appointment_type,
      notes: appointment.notes,
      contactInfo: {
        lastName: appointment.last_name,
        email: appointment.email,
        phone: appointment.phone,
        address: appointment.address,
        message: appointment.message,
        type: appointment.contact_type
      }
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding appointment:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Update an appointment with activity logging
const updateAppointment = async (id, appointmentData, userName = 'System User') => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get original appointment data for comparison
    const originalResult = await client.query('SELECT * FROM appointments WHERE appointment_id = $1', [id]);
    if (originalResult.rows.length === 0) {
      throw new Error('Appointment not found');
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
      appointmentData.status || 'scheduled'
    ];
    
    const result = await client.query(updateQuery, values);
    const updatedAppointment = result.rows[0];
    
    // Log activity
    const activityData = {
      userName: userName,
      actionType: 'update',
      entityType: 'appointment',
      entityId: updatedAppointment.appointment_id.toString(),
      actionDescription: generateActivityDescription('update', 'appointment', {
        appointmentTitle: updatedAppointment.title,
        appointmentDate: new Date(updatedAppointment.appointment_date).toLocaleDateString('en-US')
      }),
      details: {
        appointmentId: updatedAppointment.appointment_id,
        appointmentTitle: updatedAppointment.title,
        appointmentDate: new Date(updatedAppointment.appointment_date).toLocaleDateString('en-US'),
        appointmentTime: updatedAppointment.appointment_time,
        changes: {
          from: {
            title: originalAppointment.title,
            date: new Date(originalAppointment.appointment_date).toLocaleDateString('en-US'),
            time: originalAppointment.appointment_time
          },
          to: {
            title: updatedAppointment.title,
            date: new Date(updatedAppointment.appointment_date).toLocaleDateString('en-US'),
            time: updatedAppointment.appointment_time
          }
        }
      }
    };
    
    await logActivity(activityData);
    await client.query('COMMIT');
    
    return {
      id: updatedAppointment.appointment_id,
      title: updatedAppointment.title,
      date: updatedAppointment.appointment_date.toISOString().split('T')[0],
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
        type: updatedAppointment.contact_type
      }
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating appointment:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Delete appointments (multiple) with activity logging
const deleteAppointments = async (ids, userName = 'System User') => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get appointment details before deletion for logging
    const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
    const appointmentsResult = await client.query(
      `SELECT appointment_id, title, appointment_date, appointment_time, last_name FROM appointments WHERE appointment_id IN (${placeholders})`,
      ids
    );
    const appointmentsToDelete = appointmentsResult.rows;
    
    // Delete appointments
    const deleteQuery = `DELETE FROM appointments WHERE appointment_id IN (${placeholders})`;
    const result = await client.query(deleteQuery, ids);
    
    // Log activity
    if (appointmentsToDelete.length === 1) {
      const appointment = appointmentsToDelete[0];
      const activityData = {
        userName: userName,
        actionType: 'delete',
        entityType: 'appointment',
        entityId: appointment.appointment_id.toString(),
        actionDescription: generateActivityDescription('delete', 'appointment', {
          appointmentTitle: appointment.title,
          appointmentDate: new Date(appointment.appointment_date).toLocaleDateString('en-US')
        }),
        details: {
          appointmentId: appointment.appointment_id,
          appointmentTitle: appointment.title,
          appointmentDate: new Date(appointment.appointment_date).toLocaleDateString('en-US'),
          appointmentTime: appointment.appointment_time,
          contactName: appointment.last_name
        }
      };
      await logActivity(activityData);
    } else if (appointmentsToDelete.length > 1) {
      const activityData = {
        userName: userName,
        actionType: 'delete',
        entityType: 'appointment',
        entityId: null,
        actionDescription: generateActivityDescription('delete', 'appointment', {
          count: appointmentsToDelete.length
        }),
        details: {
          count: appointmentsToDelete.length,
          deletedAppointments: appointmentsToDelete.map(a => ({
            appointmentId: a.appointment_id,
            title: a.title,
            date: new Date(a.appointment_date).toLocaleDateString('en-US'),
            time: a.appointment_time
          }))
        }
      };
      await logActivity(activityData);
    }
    
    await client.query('COMMIT');
    return { deletedCount: result.rowCount };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting appointments:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Delete a single appointment with activity logging
const deleteAppointment = async (id, userName = 'System User') => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Attempting to delete appointment with ID:', id);
    
    // Get appointment details before deletion for logging
    // Try both appointment_id and id fields to handle different data sources
    let appointmentResult = await client.query(
      'SELECT appointment_id, title, appointment_date, appointment_time, last_name FROM appointments WHERE appointment_id = $1',
      [id]
    );
    
    // If not found by appointment_id, try by id field
    if (appointmentResult.rows.length === 0) {
      appointmentResult = await client.query(
        'SELECT appointment_id, title, appointment_date, appointment_time, last_name FROM appointments WHERE id = $1',
        [id]
      );
    }
    
    if (appointmentResult.rows.length === 0) {
      console.log('No appointment found with ID:', id);
      // Let's check what appointments exist
      const allAppointments = await client.query('SELECT appointment_id, id, title FROM appointments LIMIT 5');
      console.log('Available appointments:', allAppointments.rows);
      throw new Error('Appointment not found');
    }
    
    const appointment = appointmentResult.rows[0];
    console.log('Found appointment to delete:', appointment);
    
    // Delete appointment using the correct field
    const deleteQuery = `DELETE FROM appointments WHERE appointment_id = $1`;
    const result = await client.query(deleteQuery, [appointment.appointment_id]);
    
    console.log('Delete result:', result.rowCount, 'rows affected');
    
    // Log activity
    const activityData = {
      userName: userName,
      actionType: 'delete',
      entityType: 'appointment',
      entityId: appointment.appointment_id.toString(),
      actionDescription: generateActivityDescription('delete', 'appointment', {
        appointmentTitle: appointment.title,
        appointmentDate: new Date(appointment.appointment_date).toLocaleDateString('en-US')
      }),
      details: {
        appointmentId: appointment.appointment_id,
        appointmentTitle: appointment.title,
        appointmentDate: new Date(appointment.appointment_date).toLocaleDateString('en-US'),
        appointmentTime: appointment.appointment_time,
        contactName: appointment.last_name
      }
    };
    
    await logActivity(activityData);
    await client.query('COMMIT');
    
    return { deletedCount: result.rowCount };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting appointment:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Search appointments
const searchAppointments = async (searchTerm) => {
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
        address ILIKE $1 OR
        message ILIKE $1 OR
        notes ILIKE $1
      ORDER BY appointment_date DESC, appointment_time DESC
    `;
    
    const searchPattern = `%${searchTerm}%`;
    const result = await pool.query(searchQuery, [searchPattern]);
    
    return result.rows.map(row => ({
      ...row,
      contactInfo: {
        lastName: row.last_name,
        email: row.email,
        phone: row.phone,
        address: row.address,
        message: row.message,
        type: row.contact_type
      }
    }));
    
  } catch (error) {
    console.error('Error searching appointments:', error);
    throw error;
  }
};

// Get appointments by date range
const getAppointmentsByDateRange = async (startDate, endDate) => {
  try {
    const result = await pool.query(`
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
    `, [startDate, endDate]);
    
    return result.rows.map(row => ({
      ...row,
      contactInfo: {
        lastName: row.last_name,
        email: row.email,
        phone: row.phone,
        address: row.address,
        message: row.message,
        type: row.contact_type
      }
    }));
    
  } catch (error) {
    console.error('Error getting appointments by date range:', error);
    throw error;
  }
};

// Get appointment by ID
const getAppointmentById = async (id) => {
  try {
    const result = await pool.query(`
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
    `, [id]);
    
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
        type: row.contact_type
      }
    };
    
  } catch (error) {
    console.error('Error getting appointment by ID:', error);
    throw error;
  }
};

// Get appointment statistics
const getAppointmentStatistics = async () => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_appointments,
        COUNT(CASE WHEN appointment_type = 'blood-donation' THEN 1 END) as blood_drive_appointments,
        COUNT(CASE WHEN appointment_type = 'sync-request' THEN 1 END) as sync_appointments,
        COUNT(CASE WHEN contact_type = 'barangay' THEN 1 END) as barangay_contacts,
        COUNT(CASE WHEN contact_type = 'organization' THEN 1 END) as organization_contacts,
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
    console.error('Error getting appointment statistics:', error);
    throw error;
  }
};

// Test database connection
const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Database connection test successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
};

// Close database connection
const closeConnection = async () => {
  try {
    await pool.end();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
};

// ========== ORGANIZATION USER REGISTRATION ==========

// Email sending function for organization user approval
const sendOrgUserApprovalEmail = async (fullName, email, role, barangay, activationToken) => {
  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    console.log('Preparing to send organization user approval email...');
    console.log('SMTP_USER:', process.env.SMTP_USER);
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***hidden***' : 'NOT SET');

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('SMTP credentials (SMTP_USER/SMTP_PASS) not set. Skipping email sending.');
      console.log(`[EMAIL NOT CONFIGURED] Would send activation email for: ${fullName} (${email})`);
      console.log(`Activation Token: ${activationToken}`);
      return;
    }

    const to = 'bloodsync.doh@gmail.com';
    const subject = 'New Partnered Organization User Account Registration';

    let barangayInfo = '';
    if (role === 'Barangay' && barangay) {
      barangayInfo = `\nBarangay: ${barangay}`;
    }

    const activationLink = `http://localhost:5173/activate-org?token=${activationToken}`;

    const text = `New Partnered Organization User Account Registration

A new partnered organization user has registered and requires activation approval:

Full Name: ${fullName}
Role: ${role}${barangayInfo}
Email: ${email}

To activate this user, click the link below or paste the activation token in the BloodSync application:
${activationLink}

Activation Token: ${activationToken}

If this is not a verified user, please ignore this message.`;

    console.log('Sending email to:', to);
    console.log('Email subject:', subject);

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      text,
    });

    console.log('Partnered Organization user approval email sent successfully.');
  } catch (error) {
    console.error('Error sending partnered organization user approval email:', error);
  }
};

// Register organization user
const registerOrgUser = async (userData) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create user_org_doh table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_org_doh (
        id SERIAL PRIMARY KEY,
        doh_id TEXT,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(100) NOT NULL CHECK (role IN ('Barangay', 'Local Government Unit', 'Non-Profit Organization')),
        barangay VARCHAR(255),
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        is_active BOOLEAN DEFAULT FALSE,
        activation_token UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Validate input
    const full_name = (userData.full_name || '').trim();
    const role = (userData.role || '').trim();
    const barangay = (userData.barangay || '').trim();
    const email = (userData.email || '').trim();
    const password = userData.password || '';

    if (!full_name || !role || !email || !password) {
      throw new Error('Missing required fields');
    }

    // Validate role
    const allowedRoles = ['Barangay', 'Local Government Unit', 'Non-Profit Organization'];
    if (!allowedRoles.includes(role)) {
      throw new Error('Invalid role');
    }

    // Validate barangay is required when role is Barangay
    if (role === 'Barangay' && !barangay) {
      throw new Error('Please select your Barangay to complete registration.');
    }

    // Check if email already exists
    const existingUser = await client.query(
      'SELECT id FROM user_org_doh WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('Email is already registered');
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const crypto = require('crypto');
    const password_hash = await bcrypt.hash(password, 10);
    const activation_token = crypto.randomUUID();

    // Insert user
    const insertQuery = `
      INSERT INTO user_org_doh (
        full_name, role, barangay, email, password_hash,
        is_active, activation_token
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, activation_token
    `;

    const values = [
      full_name,
      role,
      role === 'Barangay' ? barangay : null,
      email,
      password_hash,
      false, // Not active until approved
      activation_token
    ];

    const result = await client.query(insertQuery, values);

    // Send approval email to bloodsync.doh@gmail.com
    await sendOrgUserApprovalEmail(full_name, email, role, barangay, activation_token);

    await client.query('COMMIT');

    console.log('Organization user registered successfully:');
    console.log(`Full Name: ${full_name}`);
    console.log(`Role: ${role}`);
    if (role === 'Barangay') {
      console.log(`Barangay: ${barangay}`);
    }
    console.log(`Email: ${email}`);


    return {
      userId: result.rows[0].id,
      activationToken: activation_token
    };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error registering organization user:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Activate organization user by token
const activateOrgUserByToken = async (token) => {
  try {
    // First, check if user exists and get current status
    const checkUser = await pool.query(
      `SELECT id, is_active FROM user_org_doh WHERE activation_token = $1`,
      [token]
    );

    console.log('[DB_ORG] User check result:', checkUser.rows[0]);

    if (checkUser.rowCount === 0) {
      console.log('[DB_ORG] No organization user found with token:', token);
      return false;
    }

    if (checkUser.rows[0].is_active) {
      console.log('[DB_ORG] Organization user already active');
      return true;
    }

    // Proceed with activation
    const result = await pool.query(
      `UPDATE user_org_doh SET is_active = TRUE WHERE activation_token = $1 AND is_active = FALSE RETURNING id, is_active`,
      [token]
    );

    console.log('[DB_ORG] Activation update result:', result.rows[0]);

    // Verify the update
    if (result.rowCount > 0) {
      const verify = await pool.query(
        `SELECT is_active FROM user_org_doh WHERE activation_token = $1`,
        [token]
      );
      console.log('[DB_ORG] Verification result:', verify.rows[0]);
      return verify.rows[0].is_active === true;
    }

    return false;
  } catch (error) {
    console.error('[DB_ORG] Error activating organization user:', error);
    throw error;
  }
};

// Decline organization user by token
const declineOrgUserByToken = async (token) => {
  try {
    const result = await pool.query(
      `DELETE FROM user_org_doh WHERE activation_token = $1 RETURNING id`,
      [token]
    );
    return result.rowCount > 0;
  } catch (error) {
    console.error('[DB_ORG] Error declining organization user:', error);
    throw error;
  }
};

// Login organization user
const loginOrgUser = async (emailOrDohId, password) => {
  try {
    const bcrypt = require('bcryptjs');

    // Check if input is DOH ID (format: DOH-XXXXXXXXX) or email
    const isDohId = /^DOH-\d+$/i.test(emailOrDohId.trim());

    let result;
    if (isDohId) {
      // Login with DOH ID
      result = await pool.query(
        `SELECT id, email, doh_id, password_hash, role, barangay, is_active, full_name FROM user_org_doh WHERE doh_id = $1`,
        [emailOrDohId.trim()]
      );
    } else {
      // Login with email
      result = await pool.query(
        `SELECT id, email, doh_id, password_hash, role, barangay, is_active, full_name FROM user_org_doh WHERE email = $1`,
        [emailOrDohId.trim()]
      );
    }

    if (result.rowCount === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw new Error('Account not activated. Please wait for admin approval.');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      barangay: user.barangay,
      fullName: user.full_name
    };
  } catch (error) {
    console.error('[DB_ORG] Error logging in organization user:', error);
    throw error;
  }
};

// ========== ORGANIZATION USER PROFILE MANAGEMENT ==========

// Generate DOH ID with random 9-digit number
const generateDohId = async (client = null) => {
  const dbClient = client || pool;

  try {
    let dohId;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 100; // Prevent infinite loop

    while (!isUnique && attempts < maxAttempts) {
      // Generate random 9-digit number (100000000 to 999999999)
      const randomNumber = Math.floor(Math.random() * 900000000) + 100000000;
      dohId = `DOH-${String(randomNumber).padStart(9, '0')}`;

      // Check if this DOH ID already exists
      const checkResult = await dbClient.query(`
        SELECT doh_id FROM user_org_doh WHERE doh_id = $1
      `, [dohId]);

      if (checkResult.rows.length === 0) {
        isUnique = true;
      }

      attempts++;
    }

    if (!isUnique) {
      throw new Error('Failed to generate unique DOH ID after maximum attempts');
    }

    return dohId;
  } catch (error) {
    console.error('Error generating DOH ID:', error);
    throw error;
  }
};

// Get user profile by user ID
const getUserProfile = async (userId) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // First, ensure the doh_id column exists with UNIQUE constraint
    await client.query(`
      ALTER TABLE user_org_doh
      ADD COLUMN IF NOT EXISTS doh_id VARCHAR(50) UNIQUE
    `);

    console.log('✓ DOH ID column verified/created in user_org_doh table');

    const result = await client.query(`
      SELECT
        u.id as user_id,
        u.doh_id,
        u.full_name,
        u.role,
        u.barangay,
        u.email,
        p.profile_photo,
        p.gender,
        TO_CHAR(p.date_of_birth, 'YYYY-MM-DD') as date_of_birth,
        p.nationality,
        p.civil_status,
        p.blood_type
      FROM user_org_doh u
      LEFT JOIN organization_user_profiles p ON u.id = p.user_id
      WHERE u.id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    let profile = result.rows[0];

    // If DOH ID doesn't exist, generate and save it
    if (!profile.doh_id) {
      console.log(`[DB-ORG] Generating new DOH ID for user ${userId}...`);
      const newDohId = await generateDohId(client);

      await client.query(`
        UPDATE user_org_doh
        SET doh_id = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [newDohId, userId]);

      profile.doh_id = newDohId;

      console.log(`[DB-ORG] ✓ New Organization DOH ID Generated Successfully! DOH ID: ${newDohId} for User ID: ${userId}`);
    }

    await client.query('COMMIT');
    return profile;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[DB-ORG] Error getting user profile:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Update or create user profile
const updateUserProfile = async (userId, profileData, userName = 'System User') => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Update barangay and doh_id in user_org_doh table if provided
    if (profileData.barangay !== undefined || profileData.dohId !== undefined) {
      const updates = [];
      const values = [];
      let paramCounter = 1;

      if (profileData.barangay !== undefined) {
        updates.push(`barangay = $${paramCounter++}`);
        values.push(profileData.barangay);
      }

      if (profileData.dohId !== undefined) {
        updates.push(`doh_id = $${paramCounter++}`);
        values.push(profileData.dohId);
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(userId);

      await client.query(
        `UPDATE user_org_doh SET ${updates.join(', ')} WHERE id = $${paramCounter}`,
        values
      );
    }

    // Check if profile exists
    const existingProfile = await client.query(
      'SELECT id FROM organization_user_profiles WHERE user_id = $1',
      [userId]
    );

    let result;
    if (existingProfile.rows.length > 0) {
      // Update existing profile
      const updateQuery = `
        UPDATE organization_user_profiles SET
          profile_photo = $2,
          gender = $3,
          date_of_birth = $4,
          nationality = $5,
          civil_status = $6,
          blood_type = $7,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING *
      `;

      result = await client.query(updateQuery, [
        userId,
        profileData.profilePhoto || null,
        profileData.gender || null,
        profileData.dateOfBirth || null,
        profileData.nationality || 'Filipino',
        profileData.civilStatus || null,
        profileData.bloodType || null
      ]);

      // Log activity
      await logActivity({
        userName: userName,
        actionType: 'update',
        entityType: 'profile',
        entityId: userId.toString(),
        actionDescription: `Updated profile information`,
        details: {
          userId: userId,
          updatedFields: Object.keys(profileData)
        }
      });
    } else {
      // Insert new profile
      const insertQuery = `
        INSERT INTO organization_user_profiles (
          user_id, profile_photo, gender, date_of_birth, nationality, civil_status, blood_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      result = await client.query(insertQuery, [
        userId,
        profileData.profilePhoto || null,
        profileData.gender || null,
        profileData.dateOfBirth || null,
        profileData.nationality || 'Filipino',
        profileData.civilStatus || null,
        profileData.bloodType || null
      ]);

      // Log activity
      await logActivity({
        userName: userName,
        actionType: 'add',
        entityType: 'profile',
        entityId: userId.toString(),
        actionDescription: `Created profile information`,
        details: {
          userId: userId
        }
      });
    }

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating user profile:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Get user activities by user ID
const getUserActivities = async (userId, limit = 100, offset = 0) => {
  try {
    // Get user's full name
    const userResult = await pool.query(
      'SELECT full_name FROM user_org_doh WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return [];
    }

    const userName = userResult.rows[0].full_name;

    const result = await pool.query(`
      SELECT
        id,
        user_name,
        action_type,
        entity_type,
        entity_id,
        action_description,
        details,
        created_at
      FROM activity_logs
      WHERE user_name = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [userName, limit, offset]);

    return result.rows.map(row => ({
      ...row,
      details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details
    }));
  } catch (error) {
    console.error('Error getting user activities:', error);
    throw error;
  }
};

module.exports = {
  initializeDatabase,
  // Activity logging methods
  logActivity,
  getAllActivities,
  searchActivities,
  generateActivityDescription,
  // Donor methods
  getAllDonors,
  addDonor,
  updateDonor,
  deleteDonors,
  searchDonors,
  getDonorByDonorId,
  getDonorStatistics,
  // Appointment methods
  getAllAppointments,
  addAppointment,
  updateAppointment,
  deleteAppointments,
  deleteAppointment,
  searchAppointments,
  getAppointmentsByDateRange,
  getAppointmentById,
  getAppointmentStatistics,
  // Organization user methods
  registerOrgUser,
  activateOrgUserByToken,
  declineOrgUserByToken,
  loginOrgUser,
  // Organization user profile methods
  getUserProfile,
  updateUserProfile,
  getUserActivities,
  // Utility methods
  testConnection,
  closeConnection
};