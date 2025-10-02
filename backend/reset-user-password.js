const {Pool} = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'bloodsync',
  port: 5432
});

async function resetPassword() {
  try {
    const email = 'paasa.christianharry2003@gmail.com';
    const newPassword = 'Admin123!';

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    const result = await pool.query(
      'UPDATE user_doh SET password_hash = $1 WHERE email = $2 RETURNING email',
      [passwordHash, email]
    );

    if (result.rowCount > 0) {
      console.log('✓ Password reset successfully!');
      console.log('Email:', email);
      console.log('New Password:', newPassword);
      console.log('\nYou can now login with these credentials.');
    } else {
      console.log('✗ User not found!');
    }

    pool.end();
  } catch (error) {
    console.error('Error:', error);
    pool.end();
  }
}

resetPassword();
