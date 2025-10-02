const { Pool } = require('pg');
const path = require('path');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'bloodsync_org',
  password: 'Itsjk117',
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
  // Utility methods
  testConnection,
  closeConnection
};