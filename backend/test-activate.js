const dbService = require('./db');

async function testActivation() {
  const token = '0874c1de-945b-4623-8a59-90ef03174335';

  try {
    console.log('Testing activation with token:', token);
    const result = await dbService.activateUserByToken(token);
    console.log('Activation result:', result);
    process.exit(0);
  } catch (error) {
    console.error('Activation error:', error);
    process.exit(1);
  }
}

testActivation();
