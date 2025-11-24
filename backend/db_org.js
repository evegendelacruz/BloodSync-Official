const { Pool } = require("pg");
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Database connection configuration
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "root",
  port: 5433,
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
    pass: 'ouks otjf ajgu yxfc' 
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Database service functions
const dbOrgService = {
// ========== DONOR RECORD ORG METHODS ==========

// Get all donor records for a specific organization/barangay
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
        COALESCE(TO_CHAR(dr_recent_donation, 'MM/DD/YYYY'), 'No donations') as "recentDonation",
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

// Delete donor records for organization
async deleteDonorRecordsOrg(ids, sourceOrganization) {
  try {
    const query = "DELETE FROM donor_record_org WHERE dr_id = ANY($1) AND dr_source_organization = $2";
    await pool.query(query, [ids, sourceOrganization]);
    return true;
  } catch (error) {
    console.error("Error deleting donor records org:", error);
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
    const result = await pool.query(query, [`%${searchTerm}%`, sourceOrganization]);
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
    console.log('Last donor ID found:', lastId);
    
    const parts = lastId.split("-");
    const numberPart = parseInt(parts[1]);
    
    if (isNaN(numberPart)) {
      console.error('Invalid donor ID format:', lastId);
      throw new Error('Invalid donor ID format in database');
    }
    
    const nextNumber = (numberPart + 1).toString().padStart(7, "0");
    const newId = `DNR-${nextNumber}`;
    console.log('Generated new donor ID:', newId);
    
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
          const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
          const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
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
      const hashedPassword = crypto.createHash('sha256').update(userData.password).digest('hex');

      // Determine organization_name and barangay based on category
      const organizationName = userData.category === 'Organization' ? userData.entityName : null;
      const barangay = userData.category === 'Barangay' ? userData.entityName : null;

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
        'verified' // Auto-verify the account
      ];

      const result = await client.query(insertQuery, values);
      const newUser = result.rows[0];

      // Determine display name for email
      const entityDisplay = userData.category === 'Organization' 
        ? organizationName 
        : barangay;

      // Send notification email to admin (bloodsync.doh@gmail.com)
      const adminMailOptions = {
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
                  <p><strong>${userData.category === 'Organization' ? 'Organization' : 'Barangay'}:</strong> ${entityDisplay}</p>
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
        `
      };

      // Send welcome email to user
      const userMailOptions = {
        from: 'bloodsync.doh@gmail.com',
        to: userData.email,
        subject: 'Welcome to BloodSync!',
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
                  <p><strong>${userData.category === 'Organization' ? 'Organization' : 'Barangay'}:</strong> ${entityDisplay}</p>
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
        `
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
        message: 'Registration successful! You can now login to your account.',
        user: newUser
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
        throw new Error("Verification link has expired. Please register again.");
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
      const entityDisplay = verifiedUser.u_category === 'Organization'
        ? verifiedUser.u_organization_name
        : verifiedUser.u_barangay;

      // Send confirmation email
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
                <p><strong>${verifiedUser.u_category === 'Organization' ? 'Organization' : 'Barangay'}:</strong> ${entityDisplay}</p>
                <p>You can now log in to the system using your email and password.</p>
                <center>
                  <a href="${process.env.APP_URL || 'http://localhost:5173'}/login" class="login-btn">Login Now</a>
                </center>
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
        message: 'Email verified successfully! You can now login.',
        user: verifiedUser
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
      const newToken = crypto.randomBytes(32).toString('hex');
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const updateQuery = `
        UPDATE user_org SET u_verification_token = $1, u_token_expiry = $2
        WHERE u_email = $3
      `;
      await client.query(updateQuery, [newToken, tokenExpiry, email]);

      const verificationUrl = `${process.env.APP_URL || 'http://localhost:5173'}/verify-email?token=${newToken}`;

      const entityDisplay = user.u_category === 'Organization'
        ? user.u_organization_name
        : user.u_barangay;

      const mailOptions = {
        from: 'bloodsync.doh@gmail.com',
        to: email,
        subject: 'Verify Your Account - BloodSync (Resent)',
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
        `
      };

      await emailTransporter.sendMail(mailOptions);
      await client.query("COMMIT");

      return { success: true, message: 'Verification email resent successfully' };
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
      from: 'bloodsync.doh@gmail.com',
      to: verifiedUser.u_email,
      subject: 'Account Verified - BloodSync',
      html: `
        <h2>Your BloodSync account has been verified!</h2>
        <p>Hello ${verifiedUser.u_full_name},</p>
        <p>Your account has been approved. You can now log in to BloodSync.</p>
        <p><strong>Your DOH ID:</strong> ${verifiedUser.u_org_id}</p>
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
      message: 'User category updated successfully',
      user: result.rows[0]
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
  
      if (user.status !== 'verified') {
        console.log("ERROR: User status is not verified. Status:", user.status);
        throw new Error("Account pending verification. Please contact administrator.");
      }
  
      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      
      if (user.password !== hashedPassword) {
        console.log("ERROR: Password mismatch!");
        throw new Error("Invalid email or password");
      }
  
      console.log("Login successful! Updating last login...");
      
      // Update last login
      await pool.query('UPDATE user_org SET u_last_login = NOW() WHERE u_id = $1', [user.id]);
      console.log("Last login updated");
  
      // Log the login activity
      try {
        await this.logUserActivity(
          user.id,
          'LOGIN',
          `User ${user.fullName} logged into the system`
        );
      } catch (logError) {
        console.error("Failed to log activity (non-critical):", logError);
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
          lastLogin: user.lastLogin
        }
      };
    } catch (error) {
      
      throw error;
    }
  },

async getUserProfileById(userId) {
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
        u_profile_image as "profileImage",
        u_status as status,
        u_last_login as "lastLogin",
        u_created_at as "createdAt"
      FROM public.user_org
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
      UPDATE public.user_org
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
        u_org_id as "orgId",
        u_full_name as "fullName",
        u_category as catergory,
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
        u_org_id: user.orgId,
        u_full_name: user.fullName,
        u_category: user.category,
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
      UPDATE public.user_org
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
      FROM user_org 
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
      UPDATE user_org 
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
      UPDATE user_org
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
    const normalizedEmail = email.trim().toLowerCase().replace(/\s+/g, '');
    console.log('Normalized email:', normalizedEmail);

    // Check if email exists - using multiple strategies to find the user
    const checkEmailQuery = `
      SELECT u_id, u_full_name, u_email, u_status
      FROM user_org 
      WHERE LOWER(TRIM(BOTH FROM u_email)) = $1
         OR LOWER(REPLACE(u_email, ' ', '')) = $1
    `;
    const emailCheck = await client.query(checkEmailQuery, [normalizedEmail]);

    console.log('Email check result:', emailCheck.rows.length > 0 ? 'Found' : 'Not found');
    
    if (emailCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      
      // Additional debug query to see all emails in the database
      const debugQuery = `SELECT u_email FROM user_org LIMIT 5`;
      const debugResult = await pool.query(debugQuery);
      console.log('Sample emails in database:', debugResult.rows);
      
      throw new Error("Email not found. Please check your email address and try again.");
    }

    const user = emailCheck.rows[0];
    console.log('Found user:', user.u_email, 'Status:', user.u_status);

    // Check if account is verified
    if (user.u_status !== 'verified') {
      await client.query("ROLLBACK");
      throw new Error("Account is not verified. Please contact administrator.");
    }

    // Generate 6-digit recovery code
    const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Generated recovery code:', recoveryCode);
    
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
    const updateResult = await client.query(updateQuery, [recoveryCode, expiresAt, user.u_id]);
    console.log('Recovery code stored for:', updateResult.rows[0].u_email);

    // Send email with recovery code
    const mailOptions = {
      from: 'bloodsync.doh@gmail.com',
      to: user.u_email, // Use the email from database, not the input
      subject: 'Password Reset Code - BloodSync',
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
      `
    };

    try {
      await emailTransporter.sendMail(mailOptions);
      console.log('Recovery email sent successfully to:', user.u_email);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      await client.query("ROLLBACK");
      throw new Error("Failed to send recovery email. Please try again later.");
    }

    await client.query("COMMIT");

    return {
      success: true,
      message: 'Recovery code sent to your email'
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
    const normalizedEmail = email.trim().toLowerCase().replace(/\s+/g, '');
    console.log('Resetting password for:', normalizedEmail);

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

    if (user.u_status !== 'verified') {
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
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      await client.query("ROLLBACK");
      throw new Error("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character");
    }

    // Hash new password
    const hashedPassword = crypto.createHash('sha256').update(newPassword).digest('hex');

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

    console.log('Password reset successfully for user:', user.u_full_name);

    // Log the password reset activity
    try {
      await this.logUserActivity(
        user.u_id,
        'PASSWORD_RESET',
        `User ${user.u_full_name} reset their password via recovery code`
      );
    } catch (logError) {
      console.error('Failed to log activity (non-critical):', logError);
    }

    // Send confirmation email - use email from database
    const mailOptions = {
      from: 'bloodsync.doh@gmail.com',
      to: user.u_email, // Use database email, not input email
      subject: 'Password Successfully Reset - BloodSync',
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
      `
    };

    try {
      await emailTransporter.sendMail(mailOptions);
      console.log('Confirmation email sent successfully');
    } catch (emailError) {
      console.error("Failed to send confirmation email (non-critical):", emailError);
    }

    await client.query("COMMIT");

    return {
      success: true,
      message: 'Password reset successfully'
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error resetting password:", error);
    throw error;
  } finally {
    client.release();
  }
},

  
};

module.exports = dbOrgService;
