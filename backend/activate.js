const express = require('express');
const dbService = require('./db');
const router = express.Router();

router.get('/activate', async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).send('Activation token is missing.');
  }
  try {
    const result = await dbService.activateUser(token);
    if (result) {
      res.send('Your Account Has Now Activated! You may now log in.');
    } else {
      res.status(404).send('Invalid or expired activation token.');
    }
  } catch (error) {
    res.status(500).send('Server error during activation.');
  }
});

module.exports = router;
