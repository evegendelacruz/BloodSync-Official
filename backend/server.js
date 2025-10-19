const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// Import database service
const dbService = require('./db');
const dbOrgService = require('./db_org');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: true, // Allow all origins for Electron app
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'BloodSync Server is running' });
});

// User Authentication Routes
app.post('/api/register', async (req, res) => {
  try {
    const { full_name, role, email, password } = req.body;

    if (!full_name || !role || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const result = await dbService.registerUser({
      full_name,
      role,
      email,
      password
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please wait for admin approval.',
      userId: result.userId
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await dbService.loginUser(email, password);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
});

app.post('/api/login-org', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await dbOrgService.loginOrgUser(email, password);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role,
        barangay: user.barangay,
        fullName: user.fullName
      }
    });
  } catch (error) {
    console.error('Organization login error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
});

// User activation routes
app.get('/api/activate', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Activation token is required'
      });
    }

    const success = await dbService.activateUserByToken(token);

    if (success) {
      res.json({
        success: true,
        message: 'User activated successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired activation token'
      });
    }
  } catch (error) {
    console.error('Activation error:', error);
    res.status(500).json({
      success: false,
      message: 'Activation failed'
    });
  }
});

app.get('/api/decline', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    const success = await dbService.declineUserByToken(token);

    if (success) {
      res.json({
        success: true,
        message: 'User registration declined'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    console.error('Decline error:', error);
    res.status(500).json({
      success: false,
      message: 'Decline operation failed'
    });
  }
});

// Organization user activation routes
app.get('/api/activate-org', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Activation token is required'
      });
    }

    const success = await dbOrgService.activateOrgUserByToken(token);

    if (success) {
      res.json({
        success: true,
        message: 'Partnered Organization user activated successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired activation token'
      });
    }
  } catch (error) {
    console.error('Organization activation error:', error);
    res.status(500).json({
      success: false,
      message: 'Activation failed'
    });
  }
});

app.get('/api/decline-org', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    const success = await dbOrgService.declineOrgUserByToken(token);

    if (success) {
      res.json({
        success: true,
        message: 'Organization user registration declined'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    console.error('Organization decline error:', error);
    res.status(500).json({
      success: false,
      message: 'Decline operation failed'
    });
  }
});

// Password reset routes
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const result = await dbService.generatePasswordResetToken(email);

    res.json({
      success: true,
      message: 'Password reset code sent to your email',
      resetToken: result.resetToken // For development/testing
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Password reset request failed'
    });
  }
});

app.post('/api/reset-password', async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, reset code, and new password are required'
      });
    }

    const result = await dbService.resetPassword(email, resetToken, newPassword);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Password reset failed'
    });
  }
});

// Blood Stock Management Routes
app.get('/api/blood-stock', async (req, res) => {
  try {
    const bloodStock = await dbService.getAllBloodStock();
    res.json({
      success: true,
      data: bloodStock
    });
  } catch (error) {
    console.error('Error fetching blood stock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blood stock data'
    });
  }
});

app.post('/api/blood-stock', async (req, res) => {
  try {
    const bloodData = req.body;
    const result = await dbService.addBloodStock(bloodData);

    res.status(201).json({
      success: true,
      message: 'Blood stock added successfully',
      data: result
    });
  } catch (error) {
    console.error('Error adding blood stock:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to add blood stock'
    });
  }
});

app.put('/api/blood-stock/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bloodData = req.body;

    await dbService.updateBloodStock(id, bloodData);

    res.json({
      success: true,
      message: 'Blood stock updated successfully'
    });
  } catch (error) {
    console.error('Error updating blood stock:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update blood stock'
    });
  }
});

app.delete('/api/blood-stock', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid IDs array is required'
      });
    }

    await dbService.deleteBloodStock(ids);

    res.json({
      success: true,
      message: 'Blood stock deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blood stock:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete blood stock'
    });
  }
});

app.get('/api/blood-stock/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search term is required'
      });
    }

    const results = await dbService.searchBloodStock(q);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error searching blood stock:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
});

// ========== ORGANIZATION USER PROFILE ROUTES ==========

// Get user profile
app.get('/api/org/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const profile = await dbOrgService.getUserProfile(userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
});

// Update user profile
app.put('/api/org/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { profilePhoto, gender, dateOfBirth, nationality, civilStatus, bloodType, userName } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const profileData = {
      profilePhoto,
      gender,
      dateOfBirth,
      nationality: nationality || 'Filipino',
      civilStatus,
      bloodType
    };

    const updatedProfile = await dbOrgService.updateUserProfile(userId, profileData, userName || 'System User');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update user profile'
    });
  }
});

// Get user activities/logs
app.get('/api/org/activities/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const activities = await dbOrgService.getUserActivities(userId, parseInt(limit), parseInt(offset));

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Error getting user activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user activities'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT. Graceful shutdown...');
  try {
    await dbService.closePool();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM. Graceful shutdown...');
  try {
    await dbService.closePool();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`BloodSync Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;