require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const registerRoute = require('./register');
const activateRoute = require('./activate');
const { sendPasswordResetEmail, ...dbService } = require('./db');

const app = express();
app.use(cors());
app.use(bodyParser.json());



app.use('/api', registerRoute);
app.use('/api', activateRoute);

// Activate user (set is_active to TRUE)
app.post('/api/activate-user', async (req, res) => {
  const token = req.body.token;
  console.log('[ACTIVATE] Received activation request with token:', token);
  
  if (!token) {
    console.log('[ACTIVATE] No token provided in request');
    return res.status(400).json({ success: false, message: 'Missing token.' });
  }

  try {
    console.log('[ACTIVATE] Attempting to activate user...');
    const success = await dbService.activateUserByToken(token);
    
    if (success) {
      console.log('[ACTIVATE] User successfully activated');
      res.json({ 
        success: true, 
        message: 'User activated successfully.'
      });
    } else {
      console.log('[ACTIVATE] Activation failed - user not found or already active');
      res.status(404).json({ 
        success: false, 
        message: 'User not found or already activated.' 
      });
    }
  } catch (err) {
    console.error('[ACTIVATE] Error during activation:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Activation failed due to server error.' 
    });
  }
});

// Login user
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Missing email or password.' });
  }

  try {
    const user = await dbService.loginUser(email, password);
    res.json({ success: true, message: 'Login successful.', user });
  } catch (err) {
    if (err.message === 'Invalid credentials' || err.message === 'Account not activated') {
      res.status(401).json({ success: false, message: err.message });
    } else {
      res.status(500).json({ success: false, message: 'Login failed.' });
    }
  }
});

// Decline user (delete user)
app.post('/api/decline-user', async (req, res) => {
  const token = req.body.token;
  if (!token) return res.status(400).json({ success: false, message: 'Missing token.' });
  try {
    const success = await dbService.declineUserByToken(token);
    if (success) {
      res.json({ success: true, message: 'User declined and deleted.' });
    } else {
      res.status(404).json({ success: false, message: 'User not found.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Decline failed.' });
  }
});

// Default route for GET /
app.get('/', (req, res) => {
  res.send('BloodSync Backend API is running.');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Send reset code to email
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email is required.' 
    });
  }

  try {
    console.log('Processing password reset for email:', email);
    const result = await dbService.generatePasswordResetToken(email);
    console.log('Password reset token generated successfully');

    res.json({
      success: true,
      message: 'Reset code sent to your email.'
    });
  } catch (err) {
    console.error('Error in forgot-password endpoint:', err);

    if (err.message === 'Email not found') {
      return res.status(404).json({
        success: false,
        message: 'Email not found.'
      });
    }

    if (err.message === 'Account not activated') {
      return res.status(400).json({
        success: false,
        message: 'Account not activated. Please check your email for activation instructions.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Something went wrong while sending reset code.'
    });
  }
});

// Reset password with code
app.post('/api/reset-password', async (req, res) => {
  const { email, resetToken, newPassword } = req.body;

  if (!email || !resetToken || !newPassword) {
    return res.status(400).json({ 
      success: false, 
      message: 'All fields required.' 
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ 
      success: false, 
      message: 'Password must be at least 6 characters.' 
    });
  }

  try {
    await dbService.resetPassword(email, resetToken, newPassword);
    
    res.json({ 
      success: true, 
      message: 'Password reset successfully.' 
    });
  } catch (err) {
    if (err.message.includes('Invalid') || err.message.includes('expired') || err.message.includes('used')) {
      return res.status(400).json({ 
        success: false, 
        message: err.message 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Reset failed.' 
    });
  }
});