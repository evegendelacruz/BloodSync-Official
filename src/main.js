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
  const dbOrgService = require(
    path.join(__dirname, "..", "..", "backend", "db_org.js")
  );

  
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

  // ========== DONOR SYNC IPC HANDLERS ==========
  ipcMain.handle('db:requestDonorSync', async (event, donorRecords, sourceOrganization, sourceUserId, sourceUserName) => {
    try {
      const result = await dbService.requestDonorSync(donorRecords, sourceOrganization, sourceUserId, sourceUserName);

      // Create notification for main system (RBC)
      await dbService.createNotification({
        userId: null,
        userName: sourceUserName,
        notificationType: 'sync_request',
        title: 'Donor Records Sync Request Approval',
        description: `${sourceUserName} from ${sourceOrganization} has requested to sync ${donorRecords.length} donor record(s) to the Regional Blood Center. Please review and approve the sync request in the Donor Record page.`,
        relatedEntityType: 'temp_donor_records',
        relatedEntityId: result[0]?.id,
        linkTo: 'donor-record',
        priority: 'high'
      });

      return result;
    } catch (error) {
      console.error('Error in requestDonorSync:', error);
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
      return await dbService.registerUser(userData); // Pass the whole object
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

// MIGRATION FROM OLD MAIN JS - CONTINUED BELOW =======================================================================================================
// MIGRATION FROM OLD MAIN JS - CONTINUED BELOW =======================================================================================================
// MIGRATION FROM OLD MAIN JS - CONTINUED BELOW =======================================================================================================
// MIGRATION FROM OLD MAIN JS - CONTINUED BELOW =======================================================================================================
// MIGRATION FROM OLD MAIN JS - CONTINUED BELOW =======================================================================================================
// MIGRATION FROM OLD MAIN JS - CONTINUED BELOW =======================================================================================================
// MIGRATION FROM OLD MAIN JS - CONTINUED BELOW =======================================================================================================
// MIGRATION FROM OLD MAIN JS - CONTINUED BELOW =======================================================================================================

// ========== SYNC REQUEST IPC HANDLERS ==========
  ipcMain.handle("db:getPendingSyncRequests", async () => {
    try {
      return await dbService.getPendingSyncRequests();
    } catch (error) {
      console.error("IPC Error - getPendingSyncRequests:", error);
      throw error;
    }
  });

  ipcMain.handle("db:updateSyncRequestStatus", async (_event, organization, userName, status, approvedBy, declineReason) => {
    try {
      return await dbService.updateSyncRequestStatus(organization, userName, status, approvedBy, declineReason);
    } catch (error) {
      console.error("IPC Error - updateSyncRequestStatus:", error);
      throw error;
    }
  });  

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

  ipcMain.handle("db:logActivityRBC", async (_event, activityData) => {
    try {
      return await dbService.logActivity(activityData);
    } catch (error) {
      console.error("IPC Error - logActivityRBC:", error);
      throw error;
    }
  });

 

    // ========== NOTIFICATION IPC HANDLERS (RBC) ==========
    ipcMain.handle("db:getAllNotifications", async (_event, userId = null) => {
      try {
        return await dbService.getAllNotifications(userId);
      } catch (error) {
        console.error("IPC Error - getAllNotifications:", error);
        throw error;
      }
    });

    ipcMain.handle("db:markAllNotificationsAsRead", async (_event, userId = null) => {
      try {
        return await dbService.markAllNotificationsAsRead(userId);
      } catch (error) {
        console.error("IPC Error - markAllNotificationsAsRead:", error);
        throw error;
      }
    });

    // ========== NOTIFICATION IPC HANDLERS (Organization System) ==========
    // These use dbOrgService to write to notifications_org table
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

    // ========== MAIL IPC HANDLERS (ORGANIZATION) ==========
  ipcMain.handle("db:createMail", async (_event, mailData) => {
    try {
      return await dbOrgService.createMail(mailData);
    } catch (error) {
      console.error("IPC Error - createMail:", error);
      throw error;
    }
  });

  ipcMain.handle("db:getAllMails", async () => {
    try {
      return await dbOrgService.getAllMails();
    } catch (error) {
      console.error("IPC Error - getAllMails:", error);
      throw error;
    }
  });

  ipcMain.handle("db:markMailAsRead", async (_event, mailId) => {
    try {
      return await dbOrgService.markMailAsRead(mailId);
    } catch (error) {
      console.error("IPC Error - markMailAsRead:", error);
      throw error;
    }
  });

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
  // ========== APPOINTMENT IPC HANDLERS WITH ACTIVITY LOGGING ==========
  // Handler for getting org appointments (uses dbOrgService)
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
    try {
      return await dbOrgService.getAllAppointments(organizationName);
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

  // ADD THIS NEW HANDLER
    ipcMain.handle("db:updateAppointmentStatus", async (_event, appointmentId, status, userName = 'Central System Admin') => {
      try {
        return await dbOrgService.updateAppointmentStatus(appointmentId, status, userName);
      } catch (error) {
        console.error("IPC Error - updateAppointmentStatus:", error);
        throw error;
      }
    });

  //APPOINTMENT CANCELLATION  
    ipcMain.handle("db:cancelAppointmentWithReason", async (_event, appointmentId, reason, userName) => {
        try {
          // We call dbOrgService because that's where the appointments are stored
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

  ipcMain.handle("org:logActivity", async (_event, activityData) => {
    try {
      return await dbOrgService.logActivity(activityData);
    } catch (error) {
      console.error("IPC Error - org:logActivity:", error);
      // Don't throw - activity logging is non-critical
      return { success: false, error: error.message };
    }
  });

  // ========== ORGANIZATION DATA IPC HANDLERS ==========
  ipcMain.handle("org:getAllDonors", async () => {
    try {
      return await dbOrgService.getAllDonors();
    } catch (error) {
      console.error("IPC Error - org:getAllDonors:", error);
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
