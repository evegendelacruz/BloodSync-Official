const {Pool} = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'bloodsync',
  port: 5432
});

async function checkToken() {
  const token = 'e4db054f-af3d-4763-9c02-d4826397c3bf';
  try {
    const result = await pool.query(
      "SELECT user_id, email, is_active, activation_token FROM user_doh WHERE activation_token = $1",
      [token]
    );
    console.log('User with this token:', result.rows);
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

checkToken();
