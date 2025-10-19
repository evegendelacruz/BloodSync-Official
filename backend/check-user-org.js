const {Pool} = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres_org',
  password: 'bloodsync',
  port: 5432
});

async function checkUserOrg() {
  try {
    const result = await pool.query(
      "SELECT id, full_name, email, role, barangay, is_active, activation_token FROM user_org_doh WHERE email LIKE '%@%'"
    );
    console.log('Found organization users:', result.rows);
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

checkUserOrg();
