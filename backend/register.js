const express = require('express');
const dbService = require('./db');
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { full_name, role, email, password } = req.body;
    if (!full_name || !role || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    const result = await dbService.registerUser({ full_name, role, email, password });
    res.status(200).json({ message: 'Registration Submitted. Your registered information has been sent into our servers, please be patient for activation.' });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Registration failed.' });
  }
});

module.exports = router;
