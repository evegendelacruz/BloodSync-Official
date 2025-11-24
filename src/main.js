import { app, BrowserWindow, ipcMain, net } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.commandLine.appendSwitch(
  "disable-features",
  "AutofillEnable,AutofillAddressEnabled,AutofillCreditCardEnabled"
);

// Create the browser window
const createWindow = () => {
  const mainWindow = new BrowserWindow({
    title: "Blood Sync",
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "../../public/assets/Icon.png"),
    autoHideMenuBar: true,
    backgroundColor: "#165c3c",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }
};

const setupIpcHandlers = () => {
  // ---------------------------------------------------------
  // 1. SETUP LOCAL DATABASE (Your Offline Storage)
  // ---------------------------------------------------------
  const dbService = require(path.join(__dirname, "..", "..", "backend", "db.js"));
  const dbOrgService = require(path.join(__dirname, "..", "..", "backend", "db_org.js"));

  // ---------------------------------------------------------
  // 2. CLOUD CONFIGURATION (For Online Features)
  // ---------------------------------------------------------
  const CLOUD_API_URL = "http://167.71.193.224:3000/api"; // DigitalOcean

   // Helper for Online Calls
  const cloudCall = async (endpoint, method = 'GET', body = null) => {
    // Reliable internet check for Electron's main process
    const isOnline = await new Promise(resolve => {
      const request = net.request('https://8.8.8.8'); // Ping Google's DNS
      request.on('response', () => resolve(true));
      request.on('error', () => resolve(false));
      request.end();
    });

    if (!isOnline) {
      throw new Error("OFFLINE: Internet connection required for this feature.");
    }

  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : null
    };
    
    console.log(`☁️ Cloud Request: ${endpoint}`);
    const response = await fetch(`${CLOUD_API_URL}${endpoint}`, options);
    
    if (!response.ok) {
      const txt = await response.text();
      throw new Error(`Cloud Error: ${txt}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Cloud Transaction Failed:", error);

    // Check for a fetch failure, which typically means the server is offline or unreachable.
    if (error.message.includes('fetch failed')) {
      throw new Error("OFFLINE: Server is Offline, Syncing Features are Restricted.");
    }
    throw error; // Re-throw other errors (like 404s) to be handled by the UI if needed.
  }
  };

  // ==================================================================================
  // 📦 GROUP A: STRICTLY OFFLINE TRANSACTIONS (Local Database Only)
  // (Stocks, Donors, Invoices, Profile, Logs, Login/Register)
  // ==================================================================================

  // --- BLOOD STOCK (Offline) --- (OK)
  ipcMain.handle("db:getAllBloodStock", async () => dbService.getAllBloodStock());
  ipcMain.handle("db:addBloodStock", async (_e, data) => dbService.addBloodStock(data));
  ipcMain.handle("db:updateBloodStock", async (_e, id, data) => dbService.updateBloodStock(id, data));
  ipcMain.handle("db:deleteBloodStock", async (_e, ids) => dbService.deleteBloodStock(ids));
  ipcMain.handle("db:searchBloodStock", async (_e, term) => dbService.searchBloodStock(term));
  ipcMain.handle("db:getBloodStockBySerialId", async (_e, id) => dbService.getBloodStockBySerialId(id));

  // --- RELEASED STOCK (Offline) --- (OK)
  ipcMain.handle("db:getReleasedBloodStock", async () => dbService.getReleasedBloodStock());
  ipcMain.handle("db:releaseBloodStock", async (_e, data) => dbService.releaseBloodStock(data));
  ipcMain.handle("db:updateReleasedBloodStock", async (_e, id, data) => dbService.updateReleasedBloodStock(id, data));
  ipcMain.handle("db:deleteReleasedBloodStock", async (_e, ids) => dbService.deleteReleasedBloodStock(ids));
  
  // --- PLASMA & PLATELET (Offline) --- (OK)
  ipcMain.handle("db:getPlasmaStock", async () => dbService.getPlasmaStock());
  ipcMain.handle("db:addPlasmaStock", async (_e, data) => dbService.addPlasmaStock(data));
  ipcMain.handle("db:updatePlasmaStock", async (_e, id, data) => dbService.updatePlasmaStock(id, data));
  ipcMain.handle("db:deletePlasmaStock", async (_e, ids) => dbService.deletePlasmaStock(ids));
  ipcMain.handle("db:getPlateletStock", async () => dbService.getPlateletStock());
  ipcMain.handle("db:addPlateletStock", async (_e, data) => dbService.addPlateletStock(data));
  ipcMain.handle("db:updatePlateletStock", async (_e, id, data) => dbService.updatePlateletStock(id, data));
  ipcMain.handle("db:deletePlateletStock", async (_e, ids) => dbService.deletePlateletStock(ids));

  // --- NON-CONFORMING (Offline) --- (OK)
  ipcMain.handle("db:getAllNonConforming", async () => dbService.getAllNonConforming());
  ipcMain.handle("db:transferToNonConforming", async (_e, ids) => dbService.transferToNonConforming(ids));
  ipcMain.handle("db:updateNonConforming", async (_e, id, data) => dbService.updateNonConforming(id, data));
  ipcMain.handle("db:deleteNonConforming", async (_e, ids) => dbService.deleteNonConforming(ids));
  ipcMain.handle("db:discardNonConformingStock", async (_e, data) => dbService.discardNonConformingStock(data));

  // --- DONOR RECORDS (Offline - Except Sync) ---
  ipcMain.handle("db:getAllDonorRecords", async () => dbService.getAllDonorRecords());
  ipcMain.handle("db:addDonorRecord", async (_e, data) => dbService.addDonorRecord(data));
  ipcMain.handle("db:updateDonorRecord", async (_e, id, data) => dbService.updateDonorRecord(id, data));
  ipcMain.handle("db:deleteDonorRecords", async (_e, ids) => dbService.deleteDonorRecords(ids));
  ipcMain.handle("db:searchDonorRecords", async (_e, term) => dbService.searchDonorRecords(term));
  ipcMain.handle("db:generateNextDonorId", async () => dbService.generateNextDonorId());

  // --- INVOICES & REPORTS (Offline) ---
  ipcMain.handle("get-all-invoices", async () => dbService.getAllInvoices());
  ipcMain.handle("get-invoice-details", async (_e, id) => dbService.getInvoiceDetails(id));
  ipcMain.handle("get-all-blood-reports", async () => dbService.getAllBloodReports());
  ipcMain.handle("generate-quarterly-report", async (_e, q, y, ms, me) => dbService.generateQuarterlyReport(q, y, ms, me));

  // --- AUTHENTICATION (Local/Offline) ---
  // You requested Login/Register to be offline. This authenticates against Local DB.
  ipcMain.handle("auth:login", async (_e, email, pass) => dbService.loginUser(email, pass));
  ipcMain.handle("auth:register", async (_e, data) => dbService.registerUser(data));
  
  // --- USER PROFILE & LOGS (Offline) ---
  ipcMain.handle("get-user-profile", async (_e, id) => dbService.getUserProfileById(id));
  ipcMain.handle("update-user-profile", async (_e, id, data) => dbService.updateUserProfile(id, data));
  ipcMain.handle("get-user-activity-log", async (_e, id, lim, off) => dbService.getUserActivityLog(id, lim, off));
  ipcMain.handle("log-user-activity", async (_e, id, act, desc) => dbService.logUserActivity(id, act, desc));

  // --- DASHBOARD (Offline) ---
  ipcMain.handle("getReleasedBloodStock", async () => dbService.getReleasedBloodStockItems());
  ipcMain.handle("db:getReleasedPlasmaStock", async () => dbService.getReleasedPlasmaStockItems());
  ipcMain.handle("db:getReleasedPlateletStock", async () => dbService.getReleasedPlateletStockItems());
  ipcMain.handle("db:getBloodStockHistory", async (_e, year) => dbService.getBloodStockHistory(year));


  // ==================================================================================
  // ☁️ GROUP B: STRICTLY ONLINE TRANSACTIONS (Cloud API Only)
  // (Mail, Calendar, Notifications, Sync Request, Forgot Password)
  // ==================================================================================

  // --- SYNC REQUESTS (Online Only) --- 
  ipcMain.handle("db:requestDonorSync", async (_e, records, org, uid, uname) => {
    // This must hit the cloud to reach other orgs
    return await cloudCall('/org/sync-request', 'POST', { records, org, uid, uname });
  });

  ipcMain.handle("db:updateSyncRequestStatus", async (_e, org, user, status, approver, reason) => {
    // This is an ONLINE action that must go through the cloud to notify the partner org.
    return await cloudCall('/rbc/sync-request/status', 'PUT', { org, user, status, approver, reason });
  });

  ipcMain.handle("db:getPendingSyncRequests", async () => {
    return await cloudCall('/sync-requests/pending', 'GET');
    try {
      return await dbService.getPendingSyncRequests();
    } catch (error) {
      console.error("IPC Error - getPendingSyncRequests:", error);
      throw error;
    }
  });

  // --- MAIL (Online Only) ---
  ipcMain.handle("db:getAllMails", async () => {
    return await cloudCall('/org/mail', 'GET');
  });
  
  ipcMain.handle("db:createMail", async (_e, data) => {
    return await cloudCall('/org/mail', 'POST', data);
  });

  ipcMain.handle("db:markMailAsRead", async (_e, id) => {
    return await cloudCall(`/org/mail/${id}/read`, 'PUT');
  });

  // --- FORGOT PASSWORD (Online Only) ---
  ipcMain.handle("auth:forgotPassword", async (_e, email) => {
    try {
      return await cloudCall('/auth/forgot-password', 'POST', { email });
    } catch (error) {
       console.error("IPC Error - auth:forgotPassword:", error);
       throw error;
    }
  });

  // ╔════════════════════════════════════════════════════════════════════════════╗
  // ║                    SECTION 1: NOTIFICATIONS                                ║
  // ╚════════════════════════════════════════════════════════════════════════════╝

  // ========== NOTIFICATION IPC HANDLERS (RBC - Regional Blood Center) ==========
  ipcMain.handle("db:getAllNotifications", async (_event, userId = null) => {
    try {
      // Fetch fresh notifications from the cloud
      return await cloudCall(`/notifications?userId=${userId || ''}`, 'GET');
    } catch (error) {
      console.error("IPC Error - getAllNotifications:", error);
      throw error;
    }
  });

  ipcMain.handle("db:markAllNotificationsAsRead", async (_event, userId = null) => {
    try {
      // This is an online-only action
      const result = await cloudCall('/notifications/mark-all-read', 'PUT', { userId });
      // Also update local notifications if any are stored (future-proofing)
      await dbService.markAllNotificationsAsRead(userId);
      return result;
    } catch (error) {
      console.error("IPC Error - markAllNotificationsAsRead:", error);
      throw error;
    }
  });

  // ========== NOTIFICATION IPC HANDLERS (ORG - Organization System) ==========
  ipcMain.handle("db:createNotificationOrg", async (_event, notificationData) => {
    try {
      return await dbOrgService.createNotification(notificationData);
    } catch (error) {
      console.error("IPC Error - createNotificationOrg:", error);
      throw error;
    }
  });

  ipcMain.handle("db:getAllNotificationsOrg", async () => {
    try {
      return await dbOrgService.getAllNotifications();
    } catch (error) {
      console.error("IPC Error - getAllNotificationsOrg:", error);
      throw error;
    }
  });

  ipcMain.handle("db:markNotificationAsReadOrg", async (_event, notificationId) => {
    try {
      return await dbOrgService.markNotificationAsRead(notificationId);
    } catch (error) {
      console.error("IPC Error - markNotificationAsReadOrg:", error);
      throw error;
    }
  });

  ipcMain.handle("db:markAllNotificationsAsReadOrg", async () => {
    try {
      return await dbOrgService.markAllNotificationsAsRead();
    } catch (error) {
      console.error("IPC Error - markAllNotificationsAsReadOrg:", error);
      throw error;
    }
  });

  ipcMain.handle("db:checkEventNotifications", async () => {
    try {
      return await dbOrgService.checkEventNotifications();
    } catch (error) {
      console.error("IPC Error - checkEventNotifications:", error);
      throw error;
    }
  });

  ipcMain.handle("org:getAllNotificationsOrg", async () => {
    try {
      return await dbOrgService.getAllNotificationsOrg();
    } catch (error) {
      console.error("IPC Error - org:getAllNotificationsOrg:", error);
      throw error;
    }
  });

  ipcMain.handle("org:getAllOrgNotifications", async () => {
    try {
      return await dbOrgService.getAllNotificationsOrg();
    } catch (error) {
      console.error("IPC Error - org:getAllOrgNotifications:", error);
      throw error;
    }
  });

  // ╔════════════════════════════════════════════════════════════════════════════╗
  // ║                         SECTION 2: MAIL                                    ║
  // ╚════════════════════════════════════════════════════════════════════════════╝

  // ========== MAIL IPC HANDLERS (ORG - Organization) ==========
  ipcMain.handle("db:toggleMailStar", async (_event, mailId) => {
    try {
      return await dbOrgService.toggleMailStar(mailId);
    } catch (error) {
      console.error("IPC Error - toggleMailStar:", error);
      throw error;
    }
  });

  ipcMain.handle("db:deleteMail", async (_event, mailId) => {
    try {
      return await dbOrgService.deleteMail(mailId);
    } catch (error) {
      console.error("IPC Error - deleteMail:", error);
      throw error;
    }
  });

  // ╔════════════════════════════════════════════════════════════════════════════╗
  // ║                   SECTION 3: CALENDAR / APPOINTMENTS                       ║
  // ╚════════════════════════════════════════════════════════════════════════════╝

  // ========== APPOINTMENT IPC HANDLERS (RBC + ORG) ==========
  ipcMain.handle('get-all-org-appointments', async () => {
    try {
      const appointments = await dbOrgService.getAllAppointments();
      return appointments;
    } catch (error) {
      console.error('Error fetching org appointments:', error);
      throw error;
    }
  });

  ipcMain.handle("db:getAllAppointments", async (_event, organizationName) => {
    // Assuming appointments involve external partners/donors and need cloud coordination
    try {
      // Fallback to local DB if offline
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        console.log("Offline: Fetching appointments from local DB.");
        return await dbOrgService.getAllAppointments(organizationName);
      }
      const query = organizationName ? `?organizationName=${encodeURIComponent(organizationName)}` : ''; // Corrected template literal
      return await cloudCall(`/org/appointments${query}`, 'GET');
    } catch (error) {
      console.error("IPC Error - getAllAppointments:", error);
      throw error;
    }
  });

  ipcMain.handle("db:addAppointment", async (_event, appointmentData, userName = 'Alaiza Rose Olores') => {
    try {
      // Fallback to local DB if offline
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        console.log("Offline: Adding appointment to local DB.");
        return await dbOrgService.addAppointment(appointmentData, userName);
      }
      return await cloudCall('/org/appointments', 'POST', appointmentData); // Corrected template literal
    } catch (error) {
      console.error("IPC Error - addAppointment:", error);
      throw error;
    }
  });

  ipcMain.handle("db:updateAppointment", async (_event, id, appointmentData, userName = 'Alaiza Rose Olores') => {
    try {
      return await dbOrgService.updateAppointment(id, appointmentData, userName);
    } catch (error) {
      console.error("IPC Error - updateAppointment:", error);
      throw error;
    }
  });

  ipcMain.handle("db:updateAppointmentStatus", async (_event, appointmentId, status, userName = 'Central System Admin') => {
    try {
      return await dbOrgService.updateAppointmentStatus(appointmentId, status, userName);
    } catch (error) {
      console.error("IPC Error - updateAppointmentStatus:", error);
      throw error;
    }
  });

  ipcMain.handle("db:cancelAppointmentWithReason", async (_event, appointmentId, reason, userName) => {
    try {
      return await dbOrgService.cancelAppointmentWithReason(appointmentId, reason, userName);
    } catch (error) {
      console.error("IPC Error - cancelAppointmentWithReason:", error);
      throw error;
    }
  });

  ipcMain.handle("db:deleteAppointments", async (_event, ids, userName = 'Alaiza Rose Olores') => {
    try {
      return await dbOrgService.deleteAppointments(ids, userName);
    } catch (error) {
      console.error("IPC Error - deleteAppointments:", error);
      throw error;
    }
  });

  ipcMain.handle("db:deleteAppointment", async (_event, id, userName = 'Alaiza Rose Olores') => {
    try {
      return await dbOrgService.deleteAppointment(id, userName);
    } catch (error) {
      console.error("IPC Error - deleteAppointment:", error);
      throw error;
    }
  });

  ipcMain.handle("db:searchAppointments", async (_event, searchTerm) => {
    try {
      return await dbOrgService.searchAppointments(searchTerm);
    } catch (error) {
      console.error("IPC Error - searchAppointments:", error);
      throw error;
    }
  });

  ipcMain.handle("db:getAppointmentsByDateRange", async (_event, startDate, endDate) => {
    try {
      return await dbOrgService.getAppointmentsByDateRange(startDate, endDate);
    } catch (error) {
      console.error("IPC Error - getAppointmentsByDateRange:", error);
      throw error;
    }
  });

  ipcMain.handle("db:getAppointmentById", async (_event, id) => {
    try {
      return await dbOrgService.getAppointmentById(id);
    } catch (error) {
      console.error("IPC Error - getAppointmentById:", error);
      throw error;
    }
  });

  ipcMain.handle("db:getAppointmentStatistics", async () => {
    try {
      return await dbOrgService.getAppointmentStatistics();
    } catch (error) {
      console.error("IPC Error - getAppointmentStatistics:", error);
      throw error;
    }
  });

  ipcMain.handle("org:getAllAppointments", async (_event, organizationName) => {
    try {
      return await dbOrgService.getAllAppointments(organizationName);
    } catch (error) {
      console.error("IPC Error - org:getAllAppointments:", error);
      throw error;
    }
  });

  // ╔════════════════════════════════════════════════════════════════════════════╗
  // ║                    SECTION 4: PARTNERSHIP REQUESTS                         ║
  // ╚════════════════════════════════════════════════════════════════════════════╝

  // ========== PARTNERSHIP REQUEST IPC HANDLERS ==========
  ipcMain.handle("db:createPartnershipRequest", async (_event, requestData) => {
    try {
      return await dbService.createPartnershipRequest(requestData);
    } catch (error) {
      console.error("IPC Error - createPartnershipRequest:", error);
      throw error;
    }
  });

  ipcMain.handle("db:getAllPartnershipRequests", async (_event, status) => {
    try {
      return await dbService.getAllPartnershipRequests(status);
    } catch (error) {
      console.error("IPC Error - getAllPartnershipRequests:", error);
      throw error;
    }
  });

  ipcMain.handle("db:getPartnershipRequestById", async (_event, requestId) => {
    try {
      return await dbService.getPartnershipRequestById(requestId);
    } catch (error) {
      console.error("IPC Error - getPartnershipRequestById:", error);
      throw error;
    }
  });

  ipcMain.handle("db:updatePartnershipRequestStatus", async (_event, requestId, status, approvedBy) => {
    try {
      return await dbService.updatePartnershipRequestStatus(requestId, status, approvedBy);
    } catch (error) {
      console.error("IPC Error - updatePartnershipRequestStatus:", error);
      throw error;
    }
  });

  ipcMain.handle("db:getPendingPartnershipRequestsCount", async () => {
    try {
      return await dbService.getPendingPartnershipRequestsCount();
    } catch (error) {
      console.error("IPC Error - getPendingPartnershipRequestsCount:", error);
      throw error;
    }
  });

  ipcMain.handle("db:deletePartnershipRequest", async (_event, requestId) => {
    try {
      return await dbService.deletePartnershipRequest(requestId);
    } catch (error) {
      console.error("IPC Error - deletePartnershipRequest:", error);
      throw error;
    }
  });

  // ╔════════════════════════════════════════════════════════════════════════════╗
  // ║                    SECTION 6: PLATELET STOCK                               ║
  // ╚════════════════════════════════════════════════════════════════════════════╝

  // ========== PLATELET IPC HANDLERS ==========
  ipcMain.handle("db:searchPlateletStock", async (_event, searchTerm) => {
    try {
      return await dbService.searchPlateletStock(searchTerm);
    } catch (error) {
      console.error("IPC Error - searchPlateletStock:", error);
      throw error;
    }
  });

  ipcMain.handle("db:getPlateletStockBySerialId", async (_event, serialId) => {
    try {
      return await dbService.getPlateletStockBySerialId(serialId);
    } catch (error) {
      console.error("IPC Error - getPlateletStockBySerialId:", error);
      throw error;
    }
  });

  ipcMain.handle("db:releasePlateletStock", async (_event, releaseData) => {
    try {
      return await dbService.releasePlateletStock(releaseData);
    } catch (error) {
      console.error("IPC Error - releasePlateletStock:", error);
      throw error;
    }
  });

  // ╔════════════════════════════════════════════════════════════════════════════╗
  // ║                    SECTION 7: PLASMA STOCK                                 ║
  // ╚════════════════════════════════════════════════════════════════════════════╝

  // ========== PLASMA IPC HANDLERS ==========
  ipcMain.handle("db:searchPlasmaStock", async (_event, searchTerm) => {
    try {
      return await dbService.searchPlasmaStock(searchTerm);
    } catch (error) {
      console.error("IPC Error - searchPlasmaStock:", error);
      throw error;
    }
  });

  ipcMain.handle("db:releasePlasmaStock", async (_event, releaseData) => {
    try {
      const result = await dbService.releasePlasmaStock(releaseData);
      return result;
    } catch (error) {
      console.error("IPC Error - releasePlasmaStock:", error);
      throw error;
    }
  });

  ipcMain.handle("db:getPlasmaStockBySerialId", async (_event, serialId) => {
    try {
      return await dbService.getPlasmaStockBySerialId(serialId);
    } catch (error) {
      console.error("IPC Error - getPlasmaStockBySerialId:", error);
      throw error;
    }
  });

  // ╔════════════════════════════════════════════════════════════════════════════╗
  // ║                    SECTION 8: DONOR RECORDS                                ║
  // ╚════════════════════════════════════════════════════════════════════════════╝

  ipcMain.handle("org:getAllDonors", async () => {
    try {
      return await dbOrgService.getAllDonors();
    } catch (error) {
      console.error("IPC Error - org:getAllDonors:", error);
      throw error;
    }
  });

  // ╔════════════════════════════════════════════════════════════════════════════╗
  // ║                    SECTION 9: RESTORE STOCK                                ║
  // ╚════════════════════════════════════════════════════════════════════════════╝

  // ========== RESTORE BLOOD STOCK IPC HANDLERS ==========
  ipcMain.handle("db:restoreBloodStock", async (_event, serialIds) => {
    try {
      return await dbService.restoreBloodStock(serialIds);
    } catch (error) {
      console.error("IPC Error - restoreBloodStock:", error);
      throw error;
    }
  });

  ipcMain.handle("db:restorePlasmaStock", async (_event, serialIds) => {
    try {
      return await dbService.restorePlasmaStock(serialIds);
    } catch (error) {
      console.error("IPC Error - restorePlasmaStock:", error);
      throw error;
    }
  });

  ipcMain.handle("db:restorePlateletStock", async (_event, serialIds) => {
    try {
      return await dbService.restorePlateletStock(serialIds);
    } catch (error) {
      console.error("IPC Error - restorePlateletStock:", error);
      throw error;
    }
  });

  // ╔════════════════════════════════════════════════════════════════════════════╗
  // ║                    SECTION 10: NON-CONFORMING STOCK                        ║
  // ╚════════════════════════════════════════════════════════════════════════════╝

  // ========== RED BLOOD CELL NON-CONFORMING IPC HANDLERS ==========
  ipcMain.handle(
    "db:getBloodStockBySerialIdForNC",
    async (_event, serialId) => {
      try {
        return await dbService.getBloodStockBySerialIdForNC(serialId);
      } catch (error) {
        console.error("IPC Error - getBloodStockBySerialIdForNC:", error);
        throw error;
      }
    }
  );

  ipcMain.handle("db:searchNonConforming", async (_event, searchTerm) => {
    try {
      return await dbService.searchNonConforming(searchTerm);
    } catch (error) {
      console.error("IPC Error - searchNonConforming:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "db:getNonConformingBySerialIdForDiscard",
    async (_event, serialId) => {
      try {
        return await dbService.getNonConformingBySerialIdForDiscard(serialId);
      } catch (error) {
        console.error(
          "IPC Error - getNonConformingBySerialIdForDiscard:",
          error
        );
        throw error;
      }
    }
  );

  // ========== PLATELET NON-CONFORMING IPC HANDLERS ==========
  ipcMain.handle("db:getAllPlateletNonConforming", async () => {
    try {
      return await dbService.getAllPlateletNonConforming();
    } catch (error) {
      console.error("Error in getAllPlateletNonConforming:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "db:getPlateletStockBySerialIdForNC",
    async (event, serialId) => {
      try {
        return await dbService.getPlateletStockBySerialIdForNC(serialId);
      } catch (error) {
        console.error("Error in getPlateletStockBySerialIdForNC:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "db:transferPlateletToNonConforming",
    async (event, serialIds) => {
      try {
        return await dbService.transferPlateletToNonConforming(serialIds);
      } catch (error) {
        console.error("Error in transferPlateletToNonConforming:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "db:updatePlateletNonConforming",
    async (event, id, ncData) => {
      try {
        return await dbService.updatePlateletNonConforming(id, ncData);
      } catch (error) {
        console.error("Error in updatePlateletNonConforming:", error);
        throw error;
      }
    }
  );

  ipcMain.handle("db:deletePlateletNonConforming", async (event, ids) => {
    try {
      return await dbService.deletePlateletNonConforming(ids);
    } catch (error) {
      console.error("Error in deletePlateletNonConforming:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "db:searchPlateletNonConforming",
    async (event, searchTerm) => {
      try {
        return await dbService.searchPlateletNonConforming(searchTerm);
      } catch (error) {
        console.error("Error in searchPlateletNonConforming:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "db:discardPlateletNonConformingStock",
    async (event, discardData) => {
      try {
        return await dbService.discardPlateletNonConformingStock(discardData);
      } catch (error) {
        console.error("Error in discardPlateletNonConformingStock:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "db:getPlateletNonConformingBySerialIdForDiscard",
    async (event, serialId) => {
      try {
        return await dbService.getPlateletNonConformingBySerialIdForDiscard(
          serialId
        );
      } catch (error) {
        console.error(
          "Error in getPlateletNonConformingBySerialIdForDiscard:",
          error
        );
        throw error;
      }
    }
  );

  // ========== PLASMA NON-CONFORMING IPC HANDLERS ==========
  ipcMain.handle("db:getAllPlasmaNonConforming", async () => {
    try {
      return await dbService.getAllPlasmaNonConforming();
    } catch (error) {
      console.error("Error in getAllPlasmaNonConforming:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "db:getPlasmaStockBySerialIdForNC",
    async (event, serialId) => {
      try {
        return await dbService.getPlasmaStockBySerialIdForNC(serialId);
      } catch (error) {
        console.error("Error in getPlasmaStockBySerialIdForNC:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "db:transferPlasmaToNonConforming",
    async (event, serialIds) => {
      try {
        return await dbService.transferPlasmaToNonConforming(serialIds);
      } catch (error) {
        console.error("Error in transferPlasmaToNonConforming:", error);
        throw error;
      }
    }
  );

  ipcMain.handle("db:updatePlasmaNonConforming", async (event, id, ncData) => {
    try {
      return await dbService.updatePlasmaNonConforming(id, ncData);
    } catch (error) {
      console.error("Error in updatePlasmaNonConforming:", error);
      throw error;
    }
  });

  ipcMain.handle("db:deletePlasmaNonConforming", async (event, ids) => {
    try {
      return await dbService.deletePlasmaNonConforming(ids);
    } catch (error) {
      console.error("Error in deletePlasmaNonConforming:", error);
      throw error;
    }
  });

  ipcMain.handle("db:searchPlasmaNonConforming", async (event, searchTerm) => {
    try {
      return await dbService.searchPlasmaNonConforming(searchTerm);
    } catch (error) {
      console.error("Error in searchPlasmaNonConforming:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "db:discardPlasmaNonConformingStock",
    async (event, discardData) => {
      try {
        return await dbService.discardPlasmaNonConformingStock(discardData);
      } catch (error) {
        console.error("Error in discardPlasmaNonConformingStock:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "db:getPlasmaNonConformingBySerialIdForDiscard",
    async (event, serialId) => {
      try {
        return await dbService.getPlasmaNonConformingBySerialIdForDiscard(
          serialId
        );
      } catch (error) {
        console.error(
          "Error in getPlNonConformingBySerialIdForDiscard:",
          error
        );
        throw error;
      }
    }
  );

  // ╔════════════════════════════════════════════════════════════════════════════╗
  // ║                    SECTION 11: INVOICES                                    ║
  // ╚════════════════════════════════════════════════════════════════════════════╝

  // ========== INVOICE IPC HANDLERS ==========
  ipcMain.handle("search-invoices", async (event, searchTerm) => {
    return await dbService.searchInvoices(searchTerm);
  });

  ipcMain.handle(
    "delete-released-blood-invoices",
    async (event, invoiceIds) => {
      return await dbService.deleteInvoices(invoiceIds);
    }
  );

  // Discarded Blood Invoice Handlers
  ipcMain.handle("getAllDiscardedBloodInvoices", async () => {
    return await dbService.getAllDiscardedBloodInvoices();
  });

  ipcMain.handle("viewDiscardedBloodInvoice", async (event, invoiceId) => {
    return await dbService.viewDiscardedBloodInvoice(invoiceId);
  });

  ipcMain.handle("searchDiscardedBloodInvoices", async (event, searchTerm) => {
    return await dbService.searchDiscardedBloodInvoices(searchTerm);
  });

  ipcMain.handle("deleteDiscardedBloodInvoices", async (event, invoiceIds) => {
    return await dbService.deleteDiscardedBloodInvoices(invoiceIds);
  });

  // ╔════════════════════════════════════════════════════════════════════════════╗
  // ║                    SECTION 12: REPORTS                                     ║
  // ╚════════════════════════════════════════════════════════════════════════════╝

  // ========== BLOOD REPORTS IPC HANDLERS ==========
  ipcMain.handle("delete-reports", async (event, reportIds) => {
    try {
      return await dbService.deleteReports(reportIds);
    } catch (error) {
      console.error("Error deleting reports:", error);
      throw error;
    }
  });

  ipcMain.handle("search-reports", async (event, searchTerm) => {
    try {
      return await dbService.searchReports(searchTerm);
    } catch (error) {
      console.error("Error searching reports:", error);
      throw error;
    }
  });

  ipcMain.handle("refresh-current-year-reports", async () => {
    try {
      return await dbService.refreshCurrentYearReports();
    } catch (error) {
      console.error("Error refreshing current year reports:", error);
      throw error;
    }
  });

  ipcMain.handle("generate-all-historical-reports", async () => {
    try {
      return await dbService.generateAllHistoricalReports();
    } catch (error) {
      console.error("Error generating all historical reports:", error);
      throw error;
    }
  });

  // ╔════════════════════════════════════════════════════════════════════════════╗
  // ║                    SECTION 13: DASHBOARD                                   ║
  // ╚════════════════════════════════════════════════════════════════════════════╝

  //==================DASHBOARD METHODS ==================

  ipcMain.handle("auth:verify", async (_event, token) => {
    try {
      console.log("Verifying token:", token);
      const result = await dbService.verifyUser(token);
      console.log("Verification result:", result);
      return result;
    } catch (error) {
      console.error("IPC Error - auth:verify:", error);
      throw error;
    }
  });

  // Get pending users
  ipcMain.handle("get-pending-users", async () => {
    try {
      return await dbService.getPendingUsers();
    } catch (error) {
      console.error("Error getting pending users:", error);
      throw error;
    }
  });

  // Get verified users
  ipcMain.handle("get-verified-users", async () => {
    try {
      return await dbService.getVerifiedUsers();
    } catch (error) {
      console.error("Error getting verified users:", error);
      throw error;
    }
  });

  // Verify user by ID
  ipcMain.handle("verify-user-by-id", async (event, userId) => {
    try {
      return await dbService.verifyUserById(userId);
    } catch (error) {
      console.error("Error verifying user:", error);
      throw error;
    }
  });

  // Reject user
  ipcMain.handle("reject-user", async (event, userId) => {
    try {
      return await dbService.rejectUser(userId);
    } catch (error) {
      console.error("Error rejecting user:", error);
      throw error;
    }
  });

  // Update user role
  ipcMain.handle("update-user-role", async (event, userId, newRole) => {
    try {
      return await dbService.updateUserRole(userId, newRole);
    } catch (error) {
      console.error("Error updating user role:", error);
      throw error;
    }
  });

  ipcMain.handle("remove-user", async (event, userId) => {
    try {
      return await dbService.removeUser(userId);
    } catch (error) {
      console.error("Error removing user:", error);
      throw error;
    }
  });

  ipcMain.handle('update-profile-image', async (event, userId, imageData) => {
    try {
      const dbService = require(path.join(__dirname, "..", "..", "backend", "db.js"));
      const result = await dbService.updateUserProfileImage(userId, imageData);
      return result;
    } catch (error) {
      console.error('Error updating profile image:', error);
      throw error;
    }
  });

  // ========== ORGANIZATION AUTHENTICATION IPC HANDLERS ==========
  ipcMain.handle("auth:registerOrg", async (_event, userData) => {
    try {
      return await dbOrgService.registerOrgUser(userData);
    } catch (error) {
      console.error("IPC Error - auth:registerOrg:", error);
      throw error;
    }
  });

  ipcMain.handle("auth:loginOrg", async (_event, emailOrDohId, password) => {
    try {
      const result = await dbOrgService.loginOrgUser(emailOrDohId, password);
      return result;
    } catch (error) {
      console.error("IPC Error - auth:loginOrg:", error.message);
      throw error;
    }
  });

  ipcMain.handle("auth:activateOrg", async (_event, token) => {
    try {
      return await dbOrgService.activateOrgUserByToken(token);
    } catch (error) {
      console.error("IPC Error - auth:activateOrg:", error);
      throw error;
    }
  });

  // ╔════════════════════════════════════════════════════════════════════════════╗
  // ║                    SECTION 15: SYNC REQUESTS                               ║
  // ╚════════════════════════════════════════════════════════════════════════════╝

  // ╔════════════════════════════════════════════════════════════════════════════╗
  // ║                    SECTION 16: ACTIVITY LOGGING                            ║
  // ╚════════════════════════════════════════════════════════════════════════════╝

  // ========== ACTIVITY LOGGING IPC HANDLERS ==========
  ipcMain.handle("db:getAllActivities", async (_event, limit = 100, offset = 0) => {
    try {
      return await dbOrgService.getAllActivities(limit, offset);
    } catch (error) {
      console.error("IPC Error - getAllActivities:", error);
      throw error;
    }
  });

  ipcMain.handle("db:searchActivities", async (_event, searchTerm, limit = 100) => {
    try {
      return await dbOrgService.searchActivities(searchTerm, limit);
    } catch (error) {
      console.error("IPC Error - searchActivities:", error);
      throw error;
    }
  });

  ipcMain.handle("db:logActivityRBC", async (_event, activityData) => {
    try {
      // Use logUserActivity with extracted parameters
      const userId = activityData.user_id || activityData.entity_id || 'system';
      const action = activityData.action_description || activityData.action_type || 'activity';
      const description = JSON.stringify(activityData.details || activityData);
      return await dbService.logUserActivity(userId, action, description);
    } catch (error) {
      console.error("IPC Error - logActivityRBC:", error);
      // Don't throw - activity logging is non-critical
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("org:logActivity", async (_event, activityData) => {
    try {
      return await dbOrgService.logActivity(activityData);
    } catch (error) {
      console.error("IPC Error - org:logActivity:", error);
      // Don't throw - activity logging is non-critical
      return { success: false, error: error.message };
    }
  });

  // ╔════════════════════════════════════════════════════════════════════════════╗
  // ║                    SECTION 17: USER ACTIVITY LOG                           ║
  // ╚════════════════════════════════════════════════════════════════════════════╝

  //=================USER LOG=========================
  ipcMain.handle('get-user-activity-log-count', async (event, userId) => {
    try {
      console.log('Getting activity log count for user:', userId);
      const count = await dbService.getUserActivityLogCount(userId);
      return count;
    } catch (error) {
      console.error('Error in get-user-activity-log-count:', error);
      throw error;
    }
  });

  // Update user password - simplified IPC handler
  ipcMain.handle('update-user-password', async (event, userId, currentPassword, newPassword) => {
    try {
      return await dbService.updateUserPassword(userId, currentPassword, newPassword);
    } catch (error) {
      console.error("IPC Error - update-user-password:", error);
      return {
        success: false,
        message: error.message || 'Failed to update password'
      };
    }
  });



};

// Electron app lifecycle
if (started) app.quit();

app.whenReady().then(async () => {
  setupIpcHandlers();
  createWindow();

  // Check for event notifications on startup and periodically
  const checkEvents = async () => {
    try {
      const result = await dbOrgService.checkEventNotifications();
      console.log('[Main] Event notifications check completed:', result);
    } catch (error) {
      console.error('[Main] Error checking event notifications:', error);
    }
  };

  // Initial check after a short delay to ensure everything is ready
  setTimeout(checkEvents, 5000);

  // Check every hour for event notifications
  setInterval(checkEvents, 60 * 60 * 1000);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
