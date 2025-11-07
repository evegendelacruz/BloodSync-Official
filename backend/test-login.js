const {Pool} = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'bloodsync',
  port: 5432
});

async function testLogin() {
  try {
    // Get user from database
    const result = await pool.query(
      'SELECT email, password_hash, is_active FROM user_doh WHERE email = $1',
      ['paasa.christianharry2003@gmail.com']
    );

    if (result.rows.length === 0) {
      console.log('User not found!');
      pool.end();
      return;
    }

    const user = result.rows[0];
    console.log('User found:');
    console.log('Email:', user.email);
    console.log('Active:', user.is_active);
    console.log('Password hash:', user.password_hash.substring(0, 30) + '...');

    // Test different passwords
    const testPasswords = ['Test123!', 'test123', 'password', 'admin123', 'Admin123!'];

    console.log('\nTesting passwords:');
    for (const pwd of testPasswords) {
      const match = await bcrypt.compare(pwd, user.password_hash);
      console.log(`  "${pwd}": ${match ? 'MATCH ✓' : 'no match'}`);
    }

    pool.end();
  } catch (error) {
    console.error('Error:', error);
    pool.end();
  }
}

testLogin();
