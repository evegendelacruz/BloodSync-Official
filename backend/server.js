const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Import database services
const dbService = require('./db');
const dbOrgService = require('./db_org');

// Initialize databases on startup
(async () => {
  try {
    await dbService.initializeDatabase?.();
    await dbOrgService.initializeDatabase?.();
    console.log('✅ Databases initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
})();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'BloodSync Online Services API',
    timestamp: new Date().toISOString(),
    services: {
      donorSync: 'active',
      partnerships: 'active',
      notifications: 'active',
      calendar: 'active'
    }
  });
});

// ========== PARTNERSHIP REQUEST API ROUTES ==========
app.post('/api/partnership-requests', async (req, res) => {
  try {
    const result = await dbService.createPartnershipRequest(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/partnership-requests', async (req, res) => {
  try {
    const result = await dbService.getAllPartnershipRequests(req.query.status);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/partnership-requests/:id', async (req, res) => {
  try {
    const result = await dbService.getPartnershipRequestById(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/partnership-requests/:id/status', async (req, res) => {
  try {
    const { status, approvedBy } = req.body;
    const result = await dbService.updatePartnershipRequestStatus(
      req.params.id, 
      status, 
      approvedBy
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/partnership-requests/:id', async (req, res) => {
  try {
    const result = await dbService.deletePartnershipRequest(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/partnership-requests/count/pending', async (req, res) => {
  try {
    const result = await dbService.getPendingPartnershipRequestsCount();
    res.json({ count: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== RED BLOOD CELL API ROUTES ==========
app.get('/api/blood-stock', async (req, res) => {
  try {
    const result = await dbService.getAllBloodStock();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/blood-stock', async (req, res) => {
  try {
    const result = await dbService.addBloodStock(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/blood-stock/:id', async (req, res) => {
  try {
    const result = await dbService.updateBloodStock(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/blood-stock', async (req, res) => {
  try {
    const result = await dbService.deleteBloodStock(req.body.ids);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/blood-stock/search', async (req, res) => {
  try {
    const result = await dbService.searchBloodStock(req.query.term);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/blood-stock/serial/:serialId', async (req, res) => {
  try {
    const result = await dbService.getBloodStockBySerialId(req.params.serialId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== RELEASE BLOOD STOCK API ROUTES ==========
app.post('/api/blood-stock/release', async (req, res) => {
  try {
    const result = await dbService.releaseBloodStock(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/blood-stock/released', async (req, res) => {
  try {
    const result = await dbService.getReleasedBloodStock();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/blood-stock/released/:id', async (req, res) => {
  try {
    const result = await dbService.updateReleasedBloodStock(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/blood-stock/released', async (req, res) => {
  try {
    const result = await dbService.deleteReleasedBloodStock(req.body.ids);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/blood-stock/restore', async (req, res) => {
  try {
    const result = await dbService.restoreBloodStock(req.body.serialIds);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== PLATELET API ROUTES ==========
app.get('/api/platelet-stock', async (req, res) => {
  try {
    const result = await dbService.getPlateletStock();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/platelet-stock', async (req, res) => {
  try {
    const result = await dbService.addPlateletStock(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/platelet-stock/:id', async (req, res) => {
  try {
    const result = await dbService.updatePlateletStock(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/platelet-stock', async (req, res) => {
  try {
    const result = await dbService.deletePlateletStock(req.body.ids);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== PLASMA API ROUTES ==========
app.get('/api/plasma-stock', async (req, res) => {
  try {
    const result = await dbService.getPlasmaStock();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/plasma-stock', async (req, res) => {
  try {
    const result = await dbService.addPlasmaStock(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== DONOR RECORDS API ROUTES ==========
app.get('/api/donor-records', async (req, res) => {
  try {
    const result = await dbService.getAllDonorRecords();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/donor-records', async (req, res) => {
  try {
    const result = await dbService.addDonorRecord(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/donor-records/generate-id', async (req, res) => {
  try {
    const result = await dbService.generateNextDonorId();
    res.json({ donorId: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== AUTHENTICATION API ROUTES ==========
app.post('/api/auth/register', async (req, res) => {
  try {
    const result = await dbService.registerUser(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await dbService.loginUser(email, password);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/verify', async (req, res) => {
  try {
    const result = await dbService.verifyUser(req.body.token);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/pending', async (req, res) => {
  try {
    const result = await dbService.getPendingUsers();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/verified', async (req, res) => {
  try {
    const result = await dbService.getVerifiedUsers();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users/:userId/verify', async (req, res) => {
  try {
    const result = await dbService.verifyUserById(req.params.userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:userId/profile', async (req, res) => {
  try {
    const result = await dbService.getUserProfileById(req.params.userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:userId/profile', async (req, res) => {
  try {
    const result = await dbService.updateUserProfile(req.params.userId, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== ORGANIZATION ROUTES ==========
app.post('/api/org/auth/register', async (req, res) => {
  try {
    const result = await dbOrgService.registerOrgUser(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/org/auth/login', async (req, res) => {
  try {
    const { emailOrDohId, password } = req.body;
    const result = await dbOrgService.loginOrgUser(emailOrDohId, password);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/org/donors', async (req, res) => {
  try {
    const result = await dbOrgService.getAllDonors();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/org/donors', async (req, res) => {
  try {
    const { donorData, userName } = req.body;
    const result = await dbOrgService.addDonor(donorData, userName);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/org/appointments', async (req, res) => {
  try {
    const result = await dbOrgService.getAllAppointments(req.query.organizationName);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/org/appointments', async (req, res) => {
  try {
    const { appointmentData, userName } = req.body;
    const result = await dbOrgService.addAppointment(appointmentData, userName);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== NOTIFICATIONS API ROUTES ==========
app.get('/api/notifications', async (req, res) => {
  try {
    const result = await dbService.getAllNotifications(req.query.userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/notifications/mark-all-read', async (req, res) => {
  try {
    const result = await dbService.markAllNotificationsAsRead(req.body.userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/org/notifications', async (req, res) => {
  try {
    const result = await dbOrgService.getAllNotificationsOrg();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== INVOICES API ROUTES ==========
app.get('/api/invoices', async (req, res) => {
  try {
    const result = await dbService.getAllInvoices();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/invoices/:id', async (req, res) => {
  try {
    const result = await dbService.getInvoiceDetails(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== REPORTS API ROUTES ==========
app.get('/api/reports', async (req, res) => {
  try {
    const result = await dbService.getAllBloodReports();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reports/generate', async (req, res) => {
  try {
    const { quarter, year } = req.body;
    const result = await dbService.generateQuarterlyReport(quarter, year);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 
// ADD ~100 MORE ROUTES HERE FOR ALL YOUR IPC HANDLERS
// I've shown the pattern - convert each ipcMain.handle to an API route
//

// Port configuration for DigitalOcean
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ BloodSync API Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
});