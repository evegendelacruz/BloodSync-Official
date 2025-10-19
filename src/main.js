import { app, BrowserWindow, ipcMain } from "electron";
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
  const dbService = require(
    path.join(__dirname, "..", "..", "backend", "db.js")
  );

  // Import donor and appointment database service with activity logging
  const dbOrgService = require(
    path.join(__dirname, "..", "..", "backend", "db_org.js")
  );
  

  // Initialize donor database on startup
  dbOrgService.initializeDatabase().catch(console.error);

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

  ipcMain.handle("db:logActivity", async (_event, activityData) => {
    try {
      return await dbOrgService.logActivity(activityData);
    } catch (error) {
      console.error("IPC Error - logActivity:", error);
      throw error;
    }
  });

  // ========== DONOR IPC HANDLERS WITH ACTIVITY LOGGING ==========
  ipcMain.handle("db:getAllDonors", async () => {
    try {
      return await dbOrgService.getAllDonors();
    } catch (error) {
      console.error("IPC Error - getAllDonors:", error);
      throw error;
    }
  });

  ipcMain.handle("db:addDonor", async (_event, donorData, userName = 'Alaiza Rose Olores') => {
    try {
      return await dbOrgService.addDonor(donorData, userName);
    } catch (error) {
      console.error("IPC Error - addDonor:", error);
      throw error;
    }
  });

  ipcMain.handle("db:updateDonor", async (_event, id, donorData, userName = 'Alaiza Rose Olores') => {
    try {
      return await dbOrgService.updateDonor(id, donorData, userName);
    } catch (error) {
      console.error("IPC Error - updateDonor:", error);
      throw error;
    }
  });

  ipcMain.handle("db:deleteDonors", async (_event, ids, userName = 'Alaiza Rose Olores') => {
    try {
      return await dbOrgService.deleteDonors(ids, userName);
    } catch (error) {
      console.error("IPC Error - deleteDonors:", error);
      throw error;
    }
  });

  ipcMain.handle("db:searchDonors", async (_event, searchTerm) => {
    try {
      return await dbOrgService.searchDonors(searchTerm);
    } catch (error) {
      console.error("IPC Error - searchDonors:", error);
      throw error;
    }
  });

  ipcMain.handle("db:getDonorByDonorId", async (_event, donorId) => {
    try {
      return await dbOrgService.getDonorByDonorId(donorId);
    } catch (error) {
      console.error("IPC Error - getDonorByDonorId:", error);
      throw error;
    }
  });

  ipcMain.handle("db:getDonorStatistics", async () => {
    try {
      return await dbOrgService.getDonorStatistics();
    } catch (error) {
      console.error("IPC Error - getDonorStatistics:", error);
      throw error;
    }
  });

  ipcMain.handle("db:testDonorConnection", async () => {
    try {
      return await dbOrgService.testConnection();
    } catch (error) {
      console.error("IPC Error - testDonorConnection:", error);
      throw error;
    }
  });

  // ========== APPOINTMENT IPC HANDLERS WITH ACTIVITY LOGGING ==========
  ipcMain.handle("db:getAllAppointments", async () => {
    try {
      return await dbOrgService.getAllAppointments();
    } catch (error) {
      console.error("IPC Error - getAllAppointments:", error);
      throw error;
    }
  });

  ipcMain.handle("db:addAppointment", async (_event, appointmentData, userName = 'Alaiza Rose Olores') => {
    try {
      return await dbOrgService.addAppointment(appointmentData, userName);
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

  // ========== RED BLOOD CELL IPC HANDLERS ==========
  ipcMain.handle("db:getAllBloodStock", async () => {
    try {
      return await dbService.getAllBloodStock();
    } catch (error) {
      console.error("IPC Error - getAllBloodStock:", error);
      throw error;
    }
  });

  ipcMain.handle("db:addBloodStock", async (_event, bloodData) => {
    try {
      return await dbService.addBloodStock(bloodData);
    } catch (error) {
      console.error("IPC Error - addBloodStock:", error);
      throw error;
    }
  });

  ipcMain.handle("db:updateBloodStock", async (_event, id, bloodData) => {
    try {
      return await dbService.updateBloodStock(id, bloodData);
    } catch (error) {
      console.error("IPC Error - updateBloodStock:", error);
      throw error;
    }
  });

  ipcMain.handle("db:deleteBloodStock", async (_event, ids) => {
    try {
      return await dbService.deleteBloodStock(ids);
    } catch (error) {
      console.error("IPC Error - deleteBloodStock:", error);
      throw error;
    }
  });

  ipcMain.handle("db:searchBloodStock", async (_event, searchTerm) => {
    try {
      return await dbService.searchBloodStock(searchTerm);
    } catch (error) {
      console.error("IPC Error - searchBloodStock:", error);
      throw error;
    }
  });

  ipcMain.handle("db:getBloodStockBySerialId", async (_event, serialId) => {
    try {
      return await dbService.getBloodStockBySerialId(serialId);
    } catch (error) {
      console.error("IPC Error - getBloodStockBySerialId:", error);
      throw error;
    }
  });

  // ========== RELEASE STOCK IPC HANDLERS ==========
  ipcMain.handle("db:releaseBloodStock", async (_event, releaseData) => {
    try {
      const result = await dbService.releaseBloodStock(releaseData);
      return result;
    } catch (error) {
      console.error("IPC Error - releaseBloodStock:", error);
      throw error;
    }
  });

  ipcMain.handle("db:getReleasedBloodStock", async () => {
    try {
      return await dbService.getReleasedBloodStock();
    } catch (error) {
      console.error("IPC Error - getReleasedBloodStock:", error);
      throw error;
    }
  });

  // ========== PLATELET IPC HANDLERS ==========
  ipcMain.handle("db:getPlateletStock", async () => {
    try {
      return await dbService.getPlateletStock();
    } catch (error) {
      console.error("IPC Error - getPlateletStock:", error);
      throw error;
    }
  });

  ipcMain.handle("db:addPlateletStock", async (_event, plateletData) => {
    try {
      return await dbService.addPlateletStock(plateletData);
    } catch (error) {
      console.error("IPC Error - addPlateletStock:", error);
      throw error;
    }
  });

  ipcMain.handle("db:updatePlateletStock", async (_event, id, plateletData) => {
    try {
      return await dbService.updatePlateletStock(id, plateletData);
    } catch (error) {
      console.error("IPC Error - updatePlateletStock:", error);
      throw error;
    }
  });

  ipcMain.handle("db:deletePlateletStock", async (_event, ids) => {
    try {
      return await dbService.deletePlateletStock(ids);
    } catch (error) {
      console.error("IPC Error - deletePlateletStock:", error);
      throw error;
    }
  });

  ipcMain.handle("db:searchPlateletStock", async (_event, searchTerm) => {
    try {
      return await dbService.searchPlateletStock(searchTerm);
    } catch (error) {
      console.error("IPC Error - searchPlateletStock:", error);
      throw error;
    }
  });

  ipcMain.handle('db:getPlateletStockBySerialId', async (event, serialId) => {
    try {
      return await dbService.getPlateletStockBySerialId(serialId);
    } catch (error) {
      throw error;
    }
  });

  ipcMain.handle('db:releasePlateletStock', async (event, releaseData) => {
    try {
      return await dbService.releasePlateletStock(releaseData);
    } catch (error) {
      console.error('Error in releasePlateletStock handler:', error);
      throw error;
    }
  });

  ipcMain.handle('db:getReleasedPlateletStock', async (event) => {
    try {
      return await dbService.getReleasedPlateletStock();
    } catch (error) {
      console.error('Error in getReleasedPlateletStock handler:', error);
      throw error;
    }
  });

  // ========== PLASMA IPC HANDLERS ==========
  ipcMain.handle("db:getPlasmaStock", async () => {
    try {
      return await dbService.getPlasmaStock();
    } catch (error) {
      console.error("IPC Error - getPlasmaStock:", error);
      throw error;
    }
  });

  ipcMain.handle("db:addPlasmaStock", async (_event, plasmaData) => {
    try {
      return await dbService.addPlasmaStock(plasmaData);
    } catch (error) {
      console.error("IPC Error - addPlasmaStock:", error);
      throw error;
    }
  });

  ipcMain.handle("db:updatePlasmaStock", async (_event, id, plasmaData) => {
    try {
      return await dbService.updatePlasmaStock(id, plasmaData);
    } catch (error) {
      console.error("IPC Error - updatePlasmaStock:", error);
      throw error;
    }
  });

  ipcMain.handle("db:deletePlasmaStock", async (_event, ids) => {
    try {
      return await dbService.deletePlasmaStock(ids);
    } catch (error) {
      console.error("IPC Error - deletePlasmaStock:", error);
      throw error;
    }
  });

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

  ipcMain.handle("db:getReleasedPlasmaStock", async () => {
    try {
      return await dbService.getReleasedPlasmaStock();
    } catch (error) {
      console.error("IPC Error - getReleasedPlasmaStock:", error);
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

  // ========== USER AUTHENTICATION IPC HANDLERS ==========
  ipcMain.handle("db:registerUser", async (_event, userData) => {
    try {
      return await dbService.registerUser(userData);
    } catch (error) {
      console.error("IPC Error - registerUser:", error);
      throw error;
    }
  });

  ipcMain.handle("db:loginUser", async (_event, email, password) => {
    try {
      return await dbService.loginUser(email, password);
    } catch (error) {
      console.error("IPC Error - loginUser:", error);
      throw error;
    }
  });

  ipcMain.handle("db:generatePasswordResetToken", async (_event, email) => {
    try {
      return await dbService.generatePasswordResetToken(email);
    } catch (error) {
      console.error("IPC Error - generatePasswordResetToken:", error);
      throw error;
    }
  });

  ipcMain.handle("db:resetPassword", async (_event, email, resetToken, newPassword) => {
    try {
      return await dbService.resetPassword(email, resetToken, newPassword);
    } catch (error) {
      console.error("IPC Error - resetPassword:", error);
      throw error;
    }
  });

  ipcMain.handle("db:activateUserByToken", async (_event, token) => {
    try {
      // Try activating Regional Blood Center user first
      let activated = await dbService.activateUserByToken(token);

      // If not found in Regional Blood Center database, try Organization database
      if (!activated) {
        console.log('[IPC] User not found in Regional Blood Center DB, trying Organization DB...');
        activated = await dbOrgService.activateOrgUserByToken(token);
      }

      return activated;
    } catch (error) {
      console.error("IPC Error - activateUserByToken:", error);
      throw error;
    }
  });

  // ========== ORGANIZATION USER REGISTRATION IPC HANDLERS ==========
  ipcMain.handle("db:registerOrgUser", async (_event, userData) => {
    try {
      return await dbOrgService.registerOrgUser(userData);
    } catch (error) {
      console.error("IPC Error - registerOrgUser:", error);
      throw error;
    }
  });

  ipcMain.handle("db:activateOrgUserByToken", async (_event, token) => {
    try {
      return await dbOrgService.activateOrgUserByToken(token);
    } catch (error) {
      console.error("IPC Error - activateOrgUserByToken:", error);
      throw error;
    }
  });

  ipcMain.handle("db:loginOrgUser", async (_event, email, password) => {
    try {
      return await dbOrgService.loginOrgUser(email, password);
    } catch (error) {
      console.error("IPC Error - loginOrgUser:", error);
      throw error;
    }
  });

  // Organization Profile Handlers
  // Organization user profile handlers
  ipcMain.handle("db:getUserProfile", async (_event, userId) => {
    try {
      return await dbOrgService.getUserProfile(userId);
    } catch (error) {
      console.error("IPC Error - getUserProfile:", error);
      throw error;
    }
  });

  ipcMain.handle("db:updateUserProfile", async (_event, userId, profileData, userName) => {
    try {
      return await dbOrgService.updateUserProfile(userId, profileData, userName);
    } catch (error) {
      console.error("IPC Error - updateUserProfile:", error);
      throw error;
    }
  });

  // RBC user profile handlers
  ipcMain.handle("db:getUserProfileRBC", async (_event, userId) => {
    try {
      return await dbService.getUserProfileRBC(userId);
    } catch (error) {
      console.error("IPC Error - getUserProfileRBC:", error);
      throw error;
    }
  });

  ipcMain.handle("db:updateUserProfileRBC", async (_event, userId, profileData, userName) => {
    try {
      return await dbService.updateUserProfileRBC(userId, profileData, userName);
    } catch (error) {
      console.error("IPC Error - updateUserProfileRBC:", error);
      throw error;
    }
  });

  ipcMain.handle("db:getUserActivitiesRBC", async (_event, userId, limit, offset) => {
    try {
      return await dbService.getUserActivitiesRBC(userId, limit, offset);
    } catch (error) {
      console.error("IPC Error - getUserActivitiesRBC:", error);
      throw error;
    }
  });

  ipcMain.handle("db:getUserActivities", async (_event, userId, limit = 100, offset = 0) => {
    try {
      return await dbOrgService.getUserActivities(userId, limit, offset);
    } catch (error) {
      console.error("IPC Error - getUserActivities:", error);
      throw error;
    }
  });

  ipcMain.handle("db:getBloodStockCounts", async (_event) => {
    try {
      return await dbService.getBloodStockCounts();
    } catch (error) {
      console.error("IPC Error - getBloodStockCounts:", error);
      throw error;
    }
  });

  ipcMain.handle("db:getBloodStockCountsByType", async (_event) => {
    try {
      return await dbService.getBloodStockCountsByType();
    } catch (error) {
      console.error("IPC Error - getBloodStockCountsByType:", error);
      throw error;
    }
  });
};

// Electron app lifecycle
if (started) app.quit();

app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});