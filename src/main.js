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

  // ========== UPDATE/DELETE RELEASED BLOOD IPC HANDLERS ==========
  ipcMain.handle(
    "db:updateReleasedBloodStock",
    async (_event, id, bloodData) => {
      try {
        return await dbService.updateReleasedBloodStock(id, bloodData);
      } catch (error) {
        console.error("IPC Error - updateReleasedBloodStock:", error);
        throw error;
      }
    }
  );

  ipcMain.handle("db:deleteReleasedBloodStock", async (_event, ids) => {
    try {
      return await dbService.deleteReleasedBloodStock(ids);
    } catch (error) {
      console.error("IPC Error - deleteReleasedBloodStock:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "db:updateReleasedPlasmaStock",
    async (_event, id, plasmaData) => {
      try {
        return await dbService.updateReleasedPlasmaStock(id, plasmaData);
      } catch (error) {
        console.error("IPC Error - updateReleasedPlasmaStock:", error);
        throw error;
      }
    }
  );

  ipcMain.handle("db:deleteReleasedPlasmaStock", async (_event, ids) => {
    try {
      return await dbService.deleteReleasedPlasmaStock(ids);
    } catch (error) {
      console.error("IPC Error - deleteReleasedPlasmaStock:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "db:updateReleasedPlateletStock",
    async (_event, id, plateletData) => {
      try {
        return await dbService.updateReleasedPlateletStock(id, plateletData);
      } catch (error) {
        console.error("IPC Error - updateReleasedPlateletStock:", error);
        throw error;
      }
    }
  );

  ipcMain.handle("db:deleteReleasedPlateletStock", async (_event, ids) => {
    try {
      return await dbService.deleteReleasedPlateletStock(ids);
    } catch (error) {
      console.error("IPC Error - deleteReleasedPlateletStock:", error);
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

  ipcMain.handle("db:getReleasedPlateletStock", async () => {
    try {
      return await dbService.getReleasedPlateletStock();
    } catch (error) {
      console.error("IPC Error - getReleasedPlateletStock:", error);
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

  // ========== DONOR RECORD IPC HANDLERS ==========
  ipcMain.handle("db:getAllDonorRecords", async () => {
    try {
      return await dbService.getAllDonorRecords();
    } catch (error) {
      console.error("IPC Error - getAllDonorRecords:", error);
      throw error;
    }
  });

  ipcMain.handle("db:addDonorRecord", async (_event, donorData) => {
    try {
      return await dbService.addDonorRecord(donorData);
    } catch (error) {
      console.error("IPC Error - addDonorRecord:", error);
      throw error;
    }
  });

  ipcMain.handle("db:updateDonorRecord", async (_event, id, donorData) => {
    try {
      return await dbService.updateDonorRecord(id, donorData);
    } catch (error) {
      console.error("IPC Error - updateDonorRecord:", error);
      throw error;
    }
  });

  ipcMain.handle("db:deleteDonorRecords", async (_event, ids) => {
    try {
      return await dbService.deleteDonorRecords(ids);
    } catch (error) {
      console.error("IPC Error - deleteDonorRecords:", error);
      throw error;
    }
  });

  ipcMain.handle("db:searchDonorRecords", async (_event, searchTerm) => {
    try {
      return await dbService.searchDonorRecords(searchTerm);
    } catch (error) {
      console.error("IPC Error - searchDonorRecords:", error);
      throw error;
    }
  });

  ipcMain.handle("db:generateNextDonorId", async () => {
    try {
      return await dbService.generateNextDonorId();
    } catch (error) {
      console.error("IPC Error - generateNextDonorId:", error);
      throw error;
    }
  });

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

  // ========== RED BLOOD CELL NON-CONFORMING IPC HANDLERS ==========
  ipcMain.handle("db:getAllNonConforming", async () => {
    try {
      return await dbService.getAllNonConforming();
    } catch (error) {
      console.error("IPC Error - getAllNonConforming:", error);
      throw error;
    }
  });

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

  ipcMain.handle("db:transferToNonConforming", async (_event, serialIds) => {
    try {
      return await dbService.transferToNonConforming(serialIds);
    } catch (error) {
      console.error("IPC Error - transferToNonConforming:", error);
      throw error;
    }
  });

  ipcMain.handle("db:updateNonConforming", async (_event, id, ncData) => {
    try {
      return await dbService.updateNonConforming(id, ncData);
    } catch (error) {
      console.error("IPC Error - updateNonConforming:", error);
      throw error;
    }
  });

  ipcMain.handle("db:deleteNonConforming", async (_event, ids) => {
    try {
      return await dbService.deleteNonConforming(ids);
    } catch (error) {
      console.error("IPC Error - deleteNonConforming:", error);
      throw error;
    }
  });

  ipcMain.handle("db:searchNonConforming", async (_event, searchTerm) => {
    try {
      return await dbService.searchNonConforming(searchTerm);
    } catch (error) {
      console.error("IPC Error - searchNonConforming:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "db:discardNonConformingStock",
    async (_event, discardData) => {
      try {
        return await dbService.discardNonConformingStock(discardData);
      } catch (error) {
        console.error("IPC Error - discardNonConformingStock:", error);
        throw error;
      }
    }
  );

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

  // Get all platelet non-conforming records
  ipcMain.handle("db:getAllPlateletNonConforming", async () => {
    try {
      return await dbService.getAllPlateletNonConforming();
    } catch (error) {
      console.error("Error in getAllPlateletNonConforming:", error);
      throw error;
    }
  });

  // Get platelet stock by serial ID for non-conforming
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

  // Transfer platelet to non-conforming
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

  // Update platelet non-conforming record
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

  // Delete platelet non-conforming records
  ipcMain.handle("db:deletePlateletNonConforming", async (event, ids) => {
    try {
      return await dbService.deletePlateletNonConforming(ids);
    } catch (error) {
      console.error("Error in deletePlateletNonConforming:", error);
      throw error;
    }
  });

  // Search platelet non-conforming records
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

  // Discard platelet non-conforming stock
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

  // Get platelet non-conforming by serial ID for discard
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

  // Get all plasma non-conforming records
  ipcMain.handle("db:getAllPlasmaNonConforming", async () => {
    try {
      return await dbService.getAllPlasmaNonConforming();
    } catch (error) {
      console.error("Error in getAllPlasmaNonConforming:", error);
      throw error;
    }
  });

  // Get plasma stock by serial ID for non-conforming
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

  // Transfer plasma to non-conforming
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

  // Update plasma non-conforming record
  ipcMain.handle("db:updatePlasmaNonConforming", async (event, id, ncData) => {
    try {
      return await dbService.updatePlasmaNonConforming(id, ncData);
    } catch (error) {
      console.error("Error in updatePlasmaNonConforming:", error);
      throw error;
    }
  });

  // Delete plasma non-conforming records
  ipcMain.handle("db:deletePlasmaNonConforming", async (event, ids) => {
    try {
      return await dbService.deletePlasmaNonConforming(ids);
    } catch (error) {
      console.error("Error in deletePlasmaNonConforming:", error);
      throw error;
    }
  });

  // Search plasma non-conforming records
  ipcMain.handle("db:searchPlasmaNonConforming", async (event, searchTerm) => {
    try {
      return await dbService.searchPlasmaNonConforming(searchTerm);
    } catch (error) {
      console.error("Error in searchPlasmaNonConforming:", error);
      throw error;
    }
  });

  // Discard plasma non-conforming stock
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

  // Get plasma non-conforming by serial ID for discard
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

  // ========== INVOICE IPC HANDLERS ==========
  ipcMain.handle("get-all-invoices", async () => {
    return await dbService.getAllInvoices();
  });

  ipcMain.handle("search-invoices", async (event, searchTerm) => {
    return await dbService.searchInvoices(searchTerm);
  });

  ipcMain.handle("get-invoice-details", async (event, invoiceId) => {
    return await dbService.getInvoiceDetails(invoiceId);
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

  // ========== BLOOD REPORTS IPC HANDLERS ==========
  ipcMain.handle("get-all-blood-reports", async () => {
    try {
      return await dbService.getAllBloodReports();
    } catch (error) {
      console.error("Error getting all blood reports:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "generate-quarterly-report",
    async (event, quarter, year, monthStart, monthEnd) => {
      try {
        return await dbService.generateQuarterlyReport(
          quarter,
          year,
          monthStart,
          monthEnd
        );
      } catch (error) {
        console.error("Error generating quarterly report:", error);
        throw error;
      }
    }
  );

  ipcMain.handle("generate-all-quarterly-reports", async (event, year) => {
    try {
      return await dbService.generateAllQuarterlyReports(year);
    } catch (error) {
      console.error("Error generating all quarterly reports:", error);
      throw error;
    }
  });

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
  //==================DASHBOARD METHODS ==================
  ipcMain.handle("getReleasedBloodStock", async () => {
    return await dbService.getReleasedBloodStockItems();
  });

  ipcMain.handle("getReleasedPlasmaStock", async () => {
    return await dbService.getReleasedPlasmaStockItems();
  });

  ipcMain.handle("getReleasedPlateletStock", async () => {
    return await dbService.getReleasedPlateletStockItems();
  });

  ipcMain.handle("db:getBloodStockHistory", async (event, year) => {
    return await dbService.getBloodStockHistory(year);
  });

  // ========== AUTHENTICATION IPC HANDLERS ==========
  // (Keep only ONE of these sections - delete any duplicates)
  ipcMain.handle("auth:register", async (_event, userData) => {
    try {
      return await dbService.registerUser(userData);
    } catch (error) {
      console.error("IPC Error - auth:register:", error);
      throw error;
    }
  });

  ipcMain.handle("auth:login", async (_event, email, password) => {
    try {
      const result = await dbService.loginUser(email, password);
      return result;
    } catch (error) {
      console.error("IPC Error - auth:login:", error.message);
      return {
        success: false,
        message: error.message || "Login failed"
      };
    }
  });

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
  ipcMain.handle('get-user-profile', async (event, userId) => {
    try {
      const dbService = require(path.join(__dirname, "..", "..", "backend", "db.js"));
      const user = await dbService.getUserProfileById(userId);
      return user;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  });
  
  ipcMain.handle('update-user-profile', async (event, userId, data) => {
    try {
      const dbService = require(path.join(__dirname, "..", "..", "backend", "db.js"));
      const result = await dbService.updateUserProfile(userId, data);
      return result;
    } catch (error) {
      console.error('Error updating user profile:', error);
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

  //=================USER LOG=========================
  // Get user activity log
ipcMain.handle('get-user-activity-log', async (event, userId, limit = 20, offset = 0) => {
  try {
    console.log('Getting activity log for user:', userId, 'limit:', limit, 'offset:', offset);
    const activities = await dbService.getUserActivityLog(userId, limit, offset);
    return activities;
  } catch (error) {
    console.error('Error in get-user-activity-log:', error);
    throw error;
  }
});

// Get user activity log count
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

// Log user activity
ipcMain.handle('log-user-activity', async (event, userId, action, description) => {
  try {
    console.log('Logging activity for user:', userId, 'action:', action);
    const result = await dbService.logUserActivity(userId, action, description);
    return result;
  } catch (error) {
    console.error('Error in log-user-activity:', error);
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

//===================== USER PERMISSION HANDLERS =====================

ipcMain.handle("save-user-permissions", async (event, userId, permissions) => {
  try {
    return await dbService.saveUserPermissions(userId, permissions);
  } catch (error) {
    console.error("Error saving permissions:", error);
    throw error;
  }
});

ipcMain.handle("get-user-permissions", async (event, userId) => {
  try {
    return await dbService.getUserPermissions(userId);
  } catch (error) {
    console.error("Error getting permissions:", error);
    throw error;
  }
});

ipcMain.handle("get-verified-users-with-permissions", async () => {
  try {
    return await dbService.getVerifiedUsersWithPermissions();
  } catch (error) {
    console.error("Error fetching users with permissions:", error);
    throw error;
  }
});

ipcMain.handle('get-user-by-id', async (event, userId) => {
  try {
    
    // If using a database service
    if (dbService) {
      const user = await dbService.getUserById(userId);
      return user;
    }
    
    // Fallback: return user from localStorage data if available
    console.log('Database service not available');
    return null;
  } catch (error) {
    console.error('rror fetching user by ID:', error);
    return null;
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
