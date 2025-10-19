const {Pool} = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres_org',
  password: 'bloodsync',
  port: 5432
});

async function checkTokenOrg() {
  const token = 'YOUR_TOKEN_HERE'; // Replace with actual token from email
  try {
    const result = await pool.query(
      "SELECT id, full_name, email, role, barangay, is_active, activation_token FROM user_org_doh WHERE activation_token = $1",
      [token]
    );
    console.log('Organization user with this token:', result.rows);
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

checkTokenOrg();
