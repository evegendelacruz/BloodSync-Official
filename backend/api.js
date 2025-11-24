const express = require('express');
const dbService = require('./db.js');
const dbOrgService = require('./db_org.js');

const router = express.Router();

// Middleware to log requests
router.use((req, res, next) => {
  console.log(`[API] Received ${req.method} request for ${req.originalUrl}`);
  next();
});

// ==================================================================================
// ☁️ ONLINE-ONLY API ROUTES
// ==================================================================================

// --- SYNC REQUESTS ---
router.post('/org/sync-request', async (req, res) => {
  try {
    const { records, org, uid, uname } = req.body;
    const result = await dbService.requestDonorSync(records, org, uid, uname);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// This route is for the RBC to approve/decline a request
router.put('/rbc/sync-request/status', async (req, res) => {
  try {
    const { org, user, status, approver, reason } = req.body;
    const result = await dbService.updateSyncRequestStatus(org, user, status, approver, reason); // This function already handles mail-back
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/sync-requests/pending', async (req, res) => {
  try {
    const result = await dbService.getPendingSyncRequests();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- MAIL ---
router.get('/org/mail', async (req, res) => {
  try {
    const result = await dbOrgService.getAllMails();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/org/mail', async (req, res) => {
  try {
    const result = await dbOrgService.createMail(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/org/mail/:id/read', async (req, res) => {
  try {
    const result = await dbOrgService.markMailAsRead(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- NOTIFICATIONS ---
router.get('/notifications', async (req, res) => {
    try {
        const userId = req.query.userId;
        const result = await dbService.getAllNotifications(userId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/notifications/mark-all-read', async (req, res) => {
    try {
        const { userId } = req.body;
        const result = await dbService.markAllNotificationsAsRead(userId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- APPOINTMENTS / CALENDAR ---
router.get('/org/appointments', async (req, res) => {
    try {
        const orgName = req.query.organizationName;
        const result = await dbOrgService.getAllAppointments(orgName);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/org/appointments', async (req, res) => {
    try {
        const { appointmentData, user } = req.body;
        const result = await dbOrgService.addAppointment(appointmentData, user);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- AUTHENTICATION ---
router.post('/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const result = await dbService.forgotPassword(email);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'BloodSync API is running' });
});

module.exports = router;