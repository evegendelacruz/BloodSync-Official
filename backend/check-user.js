const {Pool} = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'bloodsync',
  port: 5432
});

async function checkUser() {
  try {
    const result = await pool.query(
      "SELECT user_id, email, is_active, activation_token FROM user_doh WHERE email LIKE '%paasa%'"
    );
    console.log('Found users:', result.rows);
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

checkUser();
