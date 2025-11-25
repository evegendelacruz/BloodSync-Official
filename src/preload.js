const { contextBridge, ipcRenderer } = require("electron");

console.log("Preload script loading...");

contextBridge.exposeInMainWorld("electronAPI", {
  test: () => "API Working!",

  // ============================================================================
  // A. CALENDAR AND APPOINTMENTS
  // ============================================================================

  // A1. Get all appointments by organization
  getAllAppointments: async (organizationName) => {
    try {
      return await ipcRenderer.invoke(
        "db:getAllAppointments",
        organizationName
      );
    } catch (error) {
      console.error("Preload Error - getAllAppointments:", error);
      throw error;
    }
  },

  // A2. Add appointment
  addAppointment: async (appointmentData, userName = "Alaiza Rose Olores") => {
    try {
      return await ipcRenderer.invoke(
        "db:addAppointment",
        appointmentData,
        userName
      );
    } catch (error) {
      console.error("Preload Error - addAppointment:", error);
      throw error;
    }
  },

  // A3. Update appointment
  updateAppointment: async (
    id,
    appointmentData,
    userName = "Alaiza Rose Olores"
  ) => {
    try {
      return await ipcRenderer.invoke(
        "db:updateAppointment",
        id,
        appointmentData,
        userName
      );
    } catch (error) {
      console.error("Preload Error - updateAppointment:", error);
      throw error;
    }
  },

  // A4. Update appointment status
  updateAppointmentStatus: async (
    appointmentId,
    status,
    userName = "Central System Admin"
  ) => {
    try {
      return await ipcRenderer.invoke(
        "db:updateAppointmentStatus",
        appointmentId,
        status,
        userName
      );
    } catch (error) {
      console.error("Preload Error - updateAppointmentStatus:", error);
      throw error;
    }
  },

  // A5. Cancel appointment with reason
  cancelAppointmentWithReason: async (appointmentId, reason, userName) => {
    try {
      return await ipcRenderer.invoke(
        "db:cancelAppointmentWithReason",
        appointmentId,
        reason,
        userName
      );
    } catch (error) {
      console.error("Preload Error - cancelAppointmentWithReason:", error);
      throw error;
    }
  },

  // A6. Delete multiple appointments
  deleteAppointments: async (ids, userName = "Alaiza Rose Olores") => {
    try {
      return await ipcRenderer.invoke("db:deleteAppointments", ids, userName);
    } catch (error) {
      console.error("Preload Error - deleteAppointments:", error);
      throw error;
    }
  },

  // A7. Delete single appointment
  deleteAppointment: async (id, userName = "Alaiza Rose Olores") => {
    try {
      return await ipcRenderer.invoke("db:deleteAppointment", id, userName);
    } catch (error) {
      console.error("Preload Error - deleteAppointment:", error);
      throw error;
    }
  },

  // A8. Search appointments
  searchAppointments: async (searchTerm) => {
    try {
      return await ipcRenderer.invoke("db:searchAppointments", searchTerm);
    } catch (error) {
      console.error("Preload Error - searchAppointments:", error);
      throw error;
    }
  },

  // A9. Get appointments by date range
  getAppointmentsByDateRange: async (startDate, endDate) => {
    try {
      return await ipcRenderer.invoke(
        "db:getAppointmentsByDateRange",
        startDate,
        endDate
      );
    } catch (error) {
      console.error("Preload Error - getAppointmentsByDateRange:", error);
      throw error;
    }
  },

  // A10. Get appointment by ID
  getAppointmentById: async (id) => {
    try {
      return await ipcRenderer.invoke("db:getAppointmentById", id);
    } catch (error) {
      console.error("Preload Error - getAppointmentById:", error);
      throw error;
    }
  },

  // A11. Get appointment statistics
  getAppointmentStatistics: async () => {
    try {
      return await ipcRenderer.invoke("db:getAppointmentStatistics");
    } catch (error) {
      console.error("Preload Error - getAppointmentStatistics:", error);
      throw error;
    }
  },
  // ========== RED BLOOD CELL METHODS ==========
  getAllBloodStock: async () => {
    try {
      return await ipcRenderer.invoke("db:getAllBloodStock");
    } catch (error) {
      console.error("Preload Error - getAllBloodStock:", error);
      throw error;
    }
  },

  addBloodStock: async (bloodData, userData) => {
    try {
      return await ipcRenderer.invoke("db:addBloodStock", bloodData, userData);
    } catch (error) {
      console.error("Preload Error - addBloodStock:", error);
      throw error;
    }
  },

  updateBloodStock: async (id, bloodData, userData) => {
    try {
      return await ipcRenderer.invoke(
        "db:updateBloodStock",
        id,
        bloodData,
        userData
      );
    } catch (error) {
      console.error("Preload Error - updateBloodStock:", error);
      throw error;
    }
  },

  deleteBloodStock: async (ids, userData) => {
    try {
      return await ipcRenderer.invoke("db:deleteBloodStock", ids, userData);
    } catch (error) {
      console.error("Preload Error - deleteBloodStock:", error);
      throw error;
    }
  },

  searchBloodStock: async (searchTerm) => {
    try {
      return await ipcRenderer.invoke("db:searchBloodStock", searchTerm);
    } catch (error) {
      console.error("Preload Error - searchBloodStock:", error);
      throw error;
    }
  },

  getBloodStockBySerialId: async (serialId) => {
    try {
      return await ipcRenderer.invoke("db:getBloodStockBySerialId", serialId);
    } catch (error) {
      console.error("Preload Error - getBloodStockBySerialId:", error);
      throw error;
    }
  },

  // ========== RELEASE STOCK METHODS ==========
  releaseBloodStock: async (releaseData, userData) => {
    try {
      console.log("Preload - releasing blood stock:", releaseData);
      const result = await ipcRenderer.invoke(
        "db:releaseBloodStock",
        releaseData,
        userData
      );
      return result;
    } catch (error) {
      console.error("Preload Error - releaseBloodStock:", error);
      throw error;
    }
  },

  getReleasedBloodStock: async () => {
    try {
      return await ipcRenderer.invoke("db:getReleasedBloodStock");
    } catch (error) {
      console.error("Preload Error - getReleasedBloodStock:", error);
      throw error;
    }
  },

  updateReleasedBloodStock: async (id, bloodData, userData) => {
    try {
      return await ipcRenderer.invoke(
        "db:updateReleasedBloodStock",
        id,
        bloodData,
        userData
      );
    } catch (error) {
      console.error("Preload Error - updateReleasedBloodStock:", error);
      throw error;
    }
  },

  deleteReleasedBloodStock: async (ids, userData) => {
    try {
      return await ipcRenderer.invoke(
        "db:deleteReleasedBloodStock",
        ids,
        userData
      );
    } catch (error) {
      console.error("Preload Error - deleteReleasedBloodStock:", error);
      throw error;
    }
  },

  // ========== PLATELET METHODS ==========
  getPlateletStock: async () => {
    try {
      return await ipcRenderer.invoke("db:getPlateletStock");
    } catch (error) {
      console.error("Preload Error - getPlateletStock:", error);
      throw error;
    }
  },

  addPlateletStock: async (plateletData, userData) => {
    try {
      return await ipcRenderer.invoke(
        "db:addPlateletStock",
        plateletData,
        userData
      );
    } catch (error) {
      console.error("Preload Error - addPlateletStock:", error);
      throw error;
    }
  },

  updatePlateletStock: async (id, plateletData, userData) => {
    try {
      return await ipcRenderer.invoke(
        "db:updatePlateletStock",
        id,
        plateletData,
        userData
      );
    } catch (error) {
      console.error("Preload Error - updatePlateletStock:", error);
      throw error;
    }
  },

  deletePlateletStock: async (ids, userData) => {
    try {
      return await ipcRenderer.invoke("db:deletePlateletStock", ids, userData);
    } catch (error) {
      console.error("Preload Error - deletePlateletStock:", error);
      throw error;
    }
  },

  searchPlateletStock: async (searchTerm) => {
    try {
      return await ipcRenderer.invoke("db:searchPlateletStock", searchTerm);
    } catch (error) {
      console.error("Preload Error - searchPlateletStock:", error);
      throw error;
    }
  },

  getPlateletStockBySerialId: async (serialId) => {
    try {
      return await ipcRenderer.invoke(
        "db:getPlateletStockBySerialId",
        serialId
      );
    } catch (error) {
      console.error("Preload Error - getPlateletStockBySerialId:", error);
      throw error;
    }
  },

  releasePlateletStock: async (releaseData, userData) => {
    try {
      console.log("Preload - releasing platelet stock:", releaseData, userData);
      const result = await ipcRenderer.invoke(
        "db:releasePlateletStock",
        releaseData,
        userData
      );
      console.log("Preload - platelet release result:", result);
      return result;
    } catch (error) {
      console.error("Preload Error - releasePlateletStock:", error);
      throw error;
    }
  },

  getReleasedPlateletStock: async () => {
    try {
      return await ipcRenderer.invoke("db:getReleasedPlateletStock");
    } catch (error) {
      console.error("Preload Error - getReleasedPlateletStock:", error);
      throw error;
    }
  },

  updateReleasedPlateletStock: async (id, plateletData, userData) => {
    try {
      return await ipcRenderer.invoke(
        "db:updateReleasedPlateletStock",
        id,
        plateletData,
        userData
      );
    } catch (error) {
      console.error("Preload Error - updateReleasedPlateletStock:", error);
      throw error;
    }
  },

  deleteReleasedPlateletStock: async (ids, userData) => {
    try {
      return await ipcRenderer.invoke(
        "db:deleteReleasedPlateletStock",
        ids,
        userData
      );
    } catch (error) {
      console.error("Preload Error - deleteReleasedPlateletStock:", error);
      throw error;
    }
  },

  // ========== PLASMA METHODS ==========
  getPlasmaStock: async () => {
    try {
      return await ipcRenderer.invoke("db:getPlasmaStock");
    } catch (error) {
      console.error("Preload Error - getPlasmaStock:", error);
      throw error;
    }
  },

  addPlasmaStock: async (plasmaData, userData) => {
    try {
      return await ipcRenderer.invoke(
        "db:addPlasmaStock",
        plasmaData,
        userData
      );
    } catch (error) {
      console.error("Preload Error - addPlasmaStock:", error);
      throw error;
    }
  },

  updatePlasmaStock: async (id, plasmaData, userData) => {
    try {
      return await ipcRenderer.invoke(
        "db:updatePlasmaStock",
        id,
        plasmaData,
        userData
      );
    } catch (error) {
      console.error("Preload Error - updatePlasmaStock:", error);
      throw error;
    }
  },

  deletePlasmaStock: async (ids, userData) => {
    try {
      return await ipcRenderer.invoke("db:deletePlasmaStock", ids, userData);
    } catch (error) {
      console.error("Preload Error - deletePlasmaStock:", error);
      throw error;
    }
  },

  searchPlasmaStock: async (searchTerm) => {
    try {
      return await ipcRenderer.invoke("db:searchPlasmaStock", searchTerm);
    } catch (error) {
      console.error("Preload Error - searchPlasmaStock:", error);
      throw error;
    }
  },

  // Add these to your existing PLASMA METHODS section in preload.js
  releasePlasmaStock: async (releaseData, userData) => {
    try {
      const result = await ipcRenderer.invoke(
        "db:releasePlasmaStock",
        releaseData,
        userData
      );
      return result;
    } catch (error) {
      console.error("Preload Error - releasePlasmaStock:", error);
      throw error;
    }
  },

  getReleasedPlasmaStock: async () => {
    try {
      return await ipcRenderer.invoke("db:getReleasedPlasmaStock");
    } catch (error) {
      console.error("Preload Error - getReleasedPlasmaStock:", error);
      throw error;
    }
  },

  getPlasmaStockBySerialId: async (serialId) => {
    try {
      return await ipcRenderer.invoke("db:getPlasmaStockBySerialId", serialId);
    } catch (error) {
      console.error("Preload Error - getPlasmaStockBySerialId:", error);
      throw error;
    }
  },

  updateReleasedPlasmaStock: async (id, plasmaData, userData) => {
    try {
      return await ipcRenderer.invoke(
        "db:updateReleasedPlasmaStock",
        id,
        plasmaData,
        userData
      );
    } catch (error) {
      console.error("Preload Error - updateReleasedPlasmaStock:", error);
      throw error;
    }
  },

  deleteReleasedPlasmaStock: async (ids, userData) => {
    try {
      return await ipcRenderer.invoke(
        "db:deleteReleasedPlasmaStock",
        ids,
        userData
      );
    } catch (error) {
      console.error("Preload Error - deleteReleasedPlasmaStock:", error);
      throw error;
    }
  },

  // ========== DONOR RECORD METHODS ==========
  getAllDonorRecords: async () => {
    return await ipcRenderer.invoke("db:getAllDonorRecords");
  },
  addDonorRecord: async (donorData, userData) => {
    return await ipcRenderer.invoke("db:addDonorRecord", donorData, userData);
  },
  updateDonorRecord: async (id, donorData, userData) => {
    return await ipcRenderer.invoke(
      "db:updateDonorRecord",
      id,
      donorData,
      userData
    );
  },
  deleteDonorRecords: async (ids, userData) => {
    return await ipcRenderer.invoke("db:deleteDonorRecords", ids, userData);
  },
  searchDonorRecords: async (searchTerm) => {
    return await ipcRenderer.invoke("db:searchDonorRecords", searchTerm);
  },
  generateNextDonorId: async () => {
    return await ipcRenderer.invoke("db:generateNextDonorId");
  },
  // ========== RESTORE BLOOD STOCK METHODS ==========
  restoreBloodStock: async (serialIds) => {
    try {
      return await ipcRenderer.invoke("db:restoreBloodStock", serialIds);
    } catch (error) {
      console.error("Preload Error - restoreBloodStock:", error);
      throw error;
    }
  },

  restorePlasmaStock: async (serialIds) => {
    try {
      return await ipcRenderer.invoke("db:restorePlasmaStock", serialIds);
    } catch (error) {
      console.error("Preload Error - restorePlasmaStock:", error);
      throw error;
    }
  },

  restorePlateletStock: async (serialIds) => {
    try {
      return await ipcRenderer.invoke("db:restorePlateletStock", serialIds);
    } catch (error) {
      console.error("Preload Error - restorePlateletStock:", error);
      throw error;
    }
  },

  // ========== NON-CONFORMING METHODS ==========

  getAllNonConforming: async () => {
    try {
      return await ipcRenderer.invoke("db:getAllNonConforming");
    } catch (error) {
      console.error("Preload Error - getAllNonConforming:", error);
      throw error;
    }
  },

  getBloodStockBySerialIdForNC: async (serialId) => {
    try {
      return await ipcRenderer.invoke(
        "db:getBloodStockBySerialIdForNC",
        serialId
      );
    } catch (error) {
      console.error("Preload Error - getBloodStockBySerialIdForNC:", error);
      throw error;
    }
  },

  addNonConforming: async (ncData, userData) => {
    try {
      return await ipcRenderer.invoke("db:addNonConforming", ncData, userData);
    } catch (error) {
      console.error("Preload Error - addNonConforming:", error);
      throw error;
    }
  },

  updateNonConforming: async (id, ncData, userData) => {
    try {
      return await ipcRenderer.invoke(
        "db:updateNonConforming",
        id,
        ncData,
        userData
      );
    } catch (error) {
      console.error("Preload Error - updateNonConforming:", error);
      throw error;
    }
  },

  deleteNonConforming: async (ids, userData) => {
    try {
      return await ipcRenderer.invoke("db:deleteNonConforming", ids, userData);
    } catch (error) {
      console.error("Preload Error - deleteNonConforming:", error);
      throw error;
    }
  },

  searchNonConforming: async (searchTerm) => {
    try {
      return await ipcRenderer.invoke("db:searchNonConforming", searchTerm);
    } catch (error) {
      console.error("Preload Error - searchNonConforming:", error);
      throw error;
    }
  },

  transferToNonConforming: async (serialIds, userData) => {
    try {
      return await ipcRenderer.invoke(
        "db:transferToNonConforming",
        serialIds,
        userData
      );
    } catch (error) {
      console.error("Preload Error - transferToNonConforming:", error);
      throw error;
    }
  },

  // Add methods for discard functionality
  discardNonConformingStock: async (discardData, userData) => {
    try {
      return await ipcRenderer.invoke(
        "db:discardNonConformingStock",
        discardData,
        userData
      );
    } catch (error) {
      console.error("Preload Error - discardNonConformingStock:", error);
      throw error;
    }
  },

  getNonConformingBySerialIdForDiscard: async (serialId) => {
    try {
      return await ipcRenderer.invoke(
        "db:getNonConformingBySerialIdForDiscard",
        serialId
      );
    } catch (error) {
      console.error(
        "Preload Error - getNonConformingBySerialIdForDiscard:",
        error
      );
      throw error;
    }
  },

  searchNonConformingForDiscard: async (searchTerm) => {
    try {
      return await ipcRenderer.invoke(
        "db:searchNonConformingForDiscard",
        searchTerm
      );
    } catch (error) {
      console.error("Preload Error - searchNonConformingForDiscard:", error);
      throw error;
    }
  },

  // ========== PLATELET NON-CONFORMING METHODS ==========

  getAllPlateletNonConforming: async () => {
    try {
      return await ipcRenderer.invoke("db:getAllPlateletNonConforming");
    } catch (error) {
      console.error("Preload Error - getAllPlateletNonConforming:", error);
      throw error;
    }
  },

  getPlateletStockBySerialIdForNC: async (serialId) => {
    try {
      return await ipcRenderer.invoke(
        "db:getPlateletStockBySerialIdForNC",
        serialId
      );
    } catch (error) {
      console.error("Preload Error - getPlateletStockBySerialIdForNC:", error);
      throw error;
    }
  },

  transferPlateletToNonConforming: async (serialIds, userData) => {
    try {
      return await ipcRenderer.invoke(
        "db:transferPlateletToNonConforming",
        serialIds,
        userData
      );
    } catch (error) {
      console.error("Preload Error - transferPlateletToNonConforming:", error);
      throw error;
    }
  },

  // Platelet Non-Conforming
  getAllPlateletNonConforming: () =>
    ipcRenderer.invoke("db:getAllPlateletNonConforming"),
  getPlateletStockBySerialIdForNC: (serialId) =>
    ipcRenderer.invoke("db:getPlateletStockBySerialIdForNC", serialId),
  transferPlateletToNonConforming: (serialIds, userData) =>
    ipcRenderer.invoke(
      "db:transferPlateletToNonConforming",
      serialIds,
      userData
    ),
  updatePlateletNonConforming: (id, ncData, userData) =>
    ipcRenderer.invoke("db:updatePlateletNonConforming", id, ncData, userData),
  deletePlateletNonConforming: (ids, userData) =>
    ipcRenderer.invoke("db:deletePlateletNonConforming", ids, userData),
  searchPlateletNonConforming: (searchTerm) =>
    ipcRenderer.invoke("db:searchPlateletNonConforming", searchTerm),
  discardPlateletNonConformingStock: (discardData, userData) =>
    ipcRenderer.invoke(
      "db:discardPlateletNonConformingStock",
      discardData,
      userData
    ),
  getPlateletNonConformingBySerialIdForDiscard: (serialId) =>
    ipcRenderer.invoke(
      "db:getPlateletNonConformingBySerialIdForDiscard",
      serialId
    ),

  // ========== PLASMA NON-CONFORMING METHODS ==========

  getAllPlasmaNonConforming: async () => {
    try {
      return await ipcRenderer.invoke("db:getAllPlasmaNonConforming");
    } catch (error) {
      console.error("Preload Error - getAllPlasmaNonConforming:", error);
      throw error;
    }
  },

  getPlasmaStockBySerialIdForNC: async (serialId) => {
    try {
      return await ipcRenderer.invoke(
        "db:getPlasmaStockBySerialIdForNC",
        serialId
      );
    } catch (error) {
      console.error("Preload Error - getPlasmaStockBySerialIdForNC:", error);
      throw error;
    }
  },

  transferPlasmaToNonConforming: async (serialIds, userData) => {
    try {
      return await ipcRenderer.invoke(
        "db:transferPlasmaToNonConforming",
        serialIds,
        userData
      );
    } catch (error) {
      console.error("Preload Error - transferPlasmaToNonConforming:", error);
      throw error;
    }
  },
  // Plasma Non-Conforming
  getAllPlasmaNonConforming: () =>
    ipcRenderer.invoke("db:getAllPlasmaNonConforming"),
  getPlasmaStockBySerialIdForNC: (serialId) =>
    ipcRenderer.invoke("db:getPlasmaStockBySerialIdForNC", serialId),
  transferPlasmaToNonConforming: (serialIds, userData, currentUser) =>
    ipcRenderer.invoke(
      "db:transferPlasmaToNonConforming",
      serialIds,
      userData,
      currentUser
    ),
  updatePlasmaNonConforming: (id, ncData, userData, currentUser) =>
    ipcRenderer.invoke(
      "db:updatePlasmaNonConforming",
      id,
      ncData,
      userData,
      currentUser
    ),
  deletePlasmaNonConforming: (ids, userData, currentUser) =>
    ipcRenderer.invoke(
      "db:deletePlasmaNonConforming",
      ids,
      userData,
      currentUser
    ),
  searchPlasmaNonConforming: (searchTerm) =>
    ipcRenderer.invoke("db:searchPlasmaNonConforming", searchTerm),
  discardPlasmaNonConformingStock: (discardData, userData, currentUser) =>
    ipcRenderer.invoke(
      "db:discardPlasmaNonConformingStock",
      discardData,
      userData,
      currentUser
    ),
  getPlasmaNonConformingBySerialIdForDiscard: (serialId) =>
    ipcRenderer.invoke(
      "db:getPlasmaNonConformingBySerialIdForDiscard",
      serialId
    ),

  // ========== INVOICE METHODS ==========
  getAllReleasedBloodInvoices: () => ipcRenderer.invoke("get-all-invoices"),
  searchReleasedBloodInvoices: (searchTerm) =>
    ipcRenderer.invoke("search-invoices", searchTerm),
  viewReleasedBloodInvoice: (invoiceId) =>
    ipcRenderer.invoke("get-invoice-details", invoiceId),
  deleteReleasedBloodInvoices: (invoiceIds) =>
    ipcRenderer.invoke("delete-released-blood-invoices", invoiceIds),

  // ========== DISCARDED BLOOD INVOICE METHODS ==========
  getAllDiscardedBloodInvoices: () =>
    ipcRenderer.invoke("getAllDiscardedBloodInvoices"),
  viewDiscardedBloodInvoice: (invoiceId) =>
    ipcRenderer.invoke("viewDiscardedBloodInvoice", invoiceId),
  searchDiscardedBloodInvoices: (searchTerm) =>
    ipcRenderer.invoke("searchDiscardedBloodInvoices", searchTerm),
  deleteDiscardedBloodInvoices: (invoiceIds) =>
    ipcRenderer.invoke("deleteDiscardedBloodInvoices", invoiceIds),

  // ========== BLOOD REPORTS API METHODS ==========
  getAllBloodReports: () => ipcRenderer.invoke("get-all-blood-reports"),
  generateAllQuarterlyReports: (year) =>
    ipcRenderer.invoke("generate-all-quarterly-reports", year),
  deleteReports: (reportIds) => ipcRenderer.invoke("delete-reports", reportIds),
  searchReports: (searchTerm) =>
    ipcRenderer.invoke("search-reports", searchTerm),
  refreshCurrentYearReports: () =>
    ipcRenderer.invoke("refresh-current-year-reports"),

  // ========== REPORTS ==========
  generateAllHistoricalReports: () =>
    ipcRenderer.invoke("generate-all-historical-reports"),
  //========== DASHBOARD METHODS ==========
  getAllBloodStock: () => ipcRenderer.invoke("db:getAllBloodStock"),
  getPlasmaStock: () => ipcRenderer.invoke("db:getPlasmaStock"),
  getPlateletStock: () => ipcRenderer.invoke("db:getPlateletStock"),
  getReleasedBloodStock: () => ipcRenderer.invoke("db:getReleasedBloodStock"),
  getReleasedPlasmaStock: () => ipcRenderer.invoke("db:getReleasedPlasmaStock"),
  getReleasedPlateletStock: () =>
    ipcRenderer.invoke("db:getReleasedPlateletStock"),
  getBloodStockHistory: (year) =>
    ipcRenderer.invoke("db:getBloodStockHistory", year),

  // ========== AUTHENTICATION METHODS ==========
  register: async (userData) => {
    try {
      return await ipcRenderer.invoke("auth:register", userData);
    } catch (error) {
      console.error("Preload Error - register:", error);
      throw error;
    }
  },

  login: async (email, password) => {
    try {
      console.log("Preload - Login request for:", email);
      const result = await ipcRenderer.invoke("auth:login", email, password);
      console.log("Preload - Login result:", result);

      if (!result) {
        return {
          success: false,
          message: "No response from server",
        };
      }

      return result;
    } catch (error) {
      console.error("Preload Error - login:", error);
      return {
        success: false,
        message: error.message || "Login failed",
      };
    }
  },

  verifyUser: async (token) => {
    try {
      console.log("Preload - verifying user with token:", token);
      return await ipcRenderer.invoke("auth:verify", token);
    } catch (error) {
      console.error("Preload Error - verifyUser:", error);
      throw error;
    }
  },

  getPendingUsers: () => ipcRenderer.invoke("get-pending-users"),
  getVerifiedUsers: () => ipcRenderer.invoke("get-verified-users"),
  verifyUserById: (userId) => ipcRenderer.invoke("verify-user-by-id", userId),
  rejectUser: (userId) => ipcRenderer.invoke("reject-user", userId),
  updateUserRole: (userId, newRole) =>
    ipcRenderer.invoke("update-user-role", userId, newRole),
  removeUser: (userId) => ipcRenderer.invoke("remove-user", userId),
  getUserProfileById: (userId) =>
    ipcRenderer.invoke("get-user-profile", userId),
  updateUserProfile: (userId, data) =>
    ipcRenderer.invoke("update-user-profile", userId, data),
  updateUserProfileImage: (userId, image) =>
    ipcRenderer.invoke("update-profile-image", userId, image),

  //=================== USER ACTIVITY LOG METHODS ===================
  getUserActivityLog: (userId, limit, offset) => {
    return ipcRenderer.invoke("get-user-activity-log", userId, limit, offset);
  },

  getUserActivityLogCount: (userId) => {
    return ipcRenderer.invoke("get-user-activity-log-count", userId);
  },

  logUserActivity: (userId, action, description) => {
    return ipcRenderer.invoke("log-user-activity", userId, action, description);
  },

  updateUserPassword: (userId, currentPassword, newPassword) =>
    ipcRenderer.invoke(
      "update-user-password",
      userId,
      currentPassword,
      newPassword
    ),

  //=============================USER PERMISSIONS=============================
  saveUserPermissions: (userId, permissions) =>
    ipcRenderer.invoke("save-user-permissions", userId, permissions),
  getUserPermissions: (userId) =>
    ipcRenderer.invoke("get-user-permissions", userId),
  getVerifiedUsersWithPermissions: () =>
    ipcRenderer.invoke("get-verified-users-with-permissions"),
  getUserById: (userId) => ipcRenderer.invoke("get-user-by-id", userId),

  //============================FORGOT PASSWORD============================
  // Password Reset Methods
  sendRecoveryCode: (email) => ipcRenderer.invoke("send-recovery-code", email),
  resetPassword: (data) => ipcRenderer.invoke("reset-password", data),

  // ========== ORGANIZATION AUTH METHODS ==========
  registerOrg: async (userData) => {
    try {
      return await ipcRenderer.invoke("auth:registerOrg", userData);
    } catch (error) {
      console.error("Preload Error - registerOrg:", error);
      throw error;
    }
  },

  verifyOrg: async (token) => {
    try {
      return await ipcRenderer.invoke("auth:verifyOrg", token);
    } catch (error) {
      console.error("Preload Error - verifyOrg:", error);
      throw error;
    }
  },

  resendOrgVerification: async (email) => {
    try {
      return await ipcRenderer.invoke("auth:resendOrgVerification", email);
    } catch (error) {
      console.error("Preload Error - resendOrgVerification:", error);
      throw error;
    }
  },

  loginOrg: (email, password) =>
    ipcRenderer.invoke("auth:loginOrg", email, password),

  //==============================DONOR RECORD ORGANIZATION=============================
  getDonorRecordsOrg: (sourceOrganization) =>
    ipcRenderer.invoke("get-donor-records-org", sourceOrganization),
  addDonorRecordOrg: (donorData, sourceOrganization) =>
    ipcRenderer.invoke("add-donor-record-org", donorData, sourceOrganization),
  deleteDonorRecordsOrg: (ids, sourceOrganization) =>
    ipcRenderer.invoke("delete-donor-records-org", ids, sourceOrganization),
  searchDonorRecordsOrg: (searchTerm, sourceOrganization) =>
    ipcRenderer.invoke(
      "search-donor-records-org",
      searchTerm,
      sourceOrganization
    ),
  generateNextDonorIdOrg: () =>
    ipcRenderer.invoke("generate-next-donor-id-org"),
  updateDonorRecordOrg: (id, donorData, sourceOrganization) =>
    ipcRenderer.invoke(
      "update-donor-record-org",
      id,
      donorData,
      sourceOrganization
    ),

  //======================ORGANIZATION FORGOT PASSWORD=========================
  sendRecoveryCodeOrg: (email) =>
    ipcRenderer.invoke("send-recovery-code-org", email),
  resetPasswordOrg: (data) => ipcRenderer.invoke("reset-password-org", data),

  // ========== PARTNERSHIP REQUEST METHODS ==========
  createPartnershipRequest: async (requestData) => {
    try {
      return await ipcRenderer.invoke(
        "db:createPartnershipRequest",
        requestData
      );
    } catch (error) {
      console.error("Preload Error - createPartnershipRequest:", error);
      throw error;
    }
  },

  getAllPartnershipRequests: async (status = null) => {
    try {
      return await ipcRenderer.invoke("db:getAllPartnershipRequests", status);
    } catch (error) {
      console.error("Preload Error - getAllPartnershipRequests:", error);
      throw error;
    }
  },

  getPendingSyncRequests: async () => {
    try {
      return await ipcRenderer.invoke("db:getPendingSyncRequests");
    } catch (error) {
      console.error("Preload Error - getPendingSyncRequests:", error);
      throw error;
    }
  },

  getPartnershipRequestById: async (requestId) => {
    try {
      return await ipcRenderer.invoke(
        "db:getPartnershipRequestById",
        requestId
      );
    } catch (error) {
      console.error("Preload Error - getPartnershipRequestById:", error);
      throw error;
    }
  },

  updatePartnershipRequestStatus: async (requestId, status, approvedBy, declineReason = null) => {
    try {
      return await ipcRenderer.invoke(
        "db:updatePartnershipRequestStatus",
        requestId,
        status,
        approvedBy,
        declineReason
      );
    } catch (error) {
      console.error("Preload Error - updatePartnershipRequestStatus:", error);
      throw error;
    }
  },

  getPendingPartnershipRequestsCount: async () => {
    try {
      return await ipcRenderer.invoke("db:getPendingPartnershipRequestsCount");
    } catch (error) {
      console.error(
        "Preload Error - getPendingPartnershipRequestsCount:",
        error
      );
      throw error;
    }
  },

  deletePartnershipRequest: async (requestId) => {
    try {
      return await ipcRenderer.invoke("db:deletePartnershipRequest", requestId);
    } catch (error) {
      console.error("Preload Error - deletePartnershipRequest:", error);
      throw error;
    }
  },

  // ========== TEMP DONOR RECORDS (SYNC REQUESTS) METHODS ==========

  getPendingTempDonorRecords: async () => {
    try {
      return await ipcRenderer.invoke("db:getPendingTempDonorRecords");
    } catch (error) {
      console.error("Preload Error - getPendingTempDonorRecords:", error);
      throw error;
    }
  },

  getPendingTempDonorRecordsCount: async () => {
    try {
      return await ipcRenderer.invoke("db:getPendingTempDonorRecordsCount");
    } catch (error) {
      console.error("Preload Error - getPendingTempDonorRecordsCount:", error);
      throw error;
    }
  },

  approveTempDonorRecords: async (tdrIds, approvedBy) => {
    try {
      return await ipcRenderer.invoke("db:approveTempDonorRecords", tdrIds, approvedBy);
    } catch (error) {
      console.error("Preload Error - approveTempDonorRecords:", error);
      throw error;
    }
  },

  declineTempDonorRecords: async (tdrIds, declinedBy, declineReason) => {
    try {
      return await ipcRenderer.invoke("db:declineTempDonorRecords", tdrIds, declinedBy, declineReason);
    } catch (error) {
      console.error("Preload Error - declineTempDonorRecords:", error);
      throw error;
    }
  },

  // ========== RECENT ACTIVITY METHODS ==========
  recordActivity: (
    userId,
    userName,
    actionType,
    actionDescription,
    entityType,
    entityId,
    details
  ) =>
    ipcRenderer.invoke(
      "record-activity",
      userId,
      userName,
      actionType,
      actionDescription,
      entityType,
      entityId,
      details
    ),
  getAllActivities: (limit, offset) =>
    ipcRenderer.invoke("get-all-activities", limit, offset),
  getUserActivities: (userId, limit, offset) =>
    ipcRenderer.invoke("get-user-activities", userId, limit, offset),
  searchActivities: (searchTerm, limit) =>
    ipcRenderer.invoke("search-activities", searchTerm, limit),

  //============ORGANIZATION PROFILE===============
  getUserProfileByIdOrg: (userId) =>
    ipcRenderer.invoke("get-user-profile-org", userId),
  updateUserProfileOrg: (userId, data) =>
    ipcRenderer.invoke("update-user-profile-org", userId, data),
  updateUserProfileImageOrg: (userId, imageData) =>
    ipcRenderer.invoke("update-profile-image-org", userId, imageData),

  // ========== ACCOUNT SETTINGS ORG UPDATE METHOD ==========
  updateUserPasswordOrg: (userId, currentPassword, newPassword) =>
    ipcRenderer.invoke(
      "updateUserPasswordOrg",
      userId,
      currentPassword,
      newPassword
    ),

  //================USER ORG ACTIVITY LOG=====================
  getUserActivityLogOrg: (userId, page, limit) =>
    ipcRenderer.invoke("get-user-activity-log-org", userId, page, limit),

  getUserActivityLogCountOrg: (userId) =>
    ipcRenderer.invoke("get-user-activity-log-count-org", userId),

  getUserActivityLogWithFilterOrg: (userId, startDate, endDate, page, limit) =>
    ipcRenderer.invoke(
      "get-user-activity-log-with-filter-org",
      userId,
      startDate,
      endDate,
      page,
      limit
    ),

  //================ORGANIZATION NOTIFICATIONS AND MAILS=====================
  getAllNotificationsOrg: async () => {
    try {
      return await ipcRenderer.invoke("db:getAllNotificationsOrg");
    } catch (error) {
      console.error("Preload Error - getAllNotificationsOrg:", error);
      throw error;
    }
  },

  getAllNotificationsOrg: async () => {
    try {
      return await ipcRenderer.invoke("db:getAllNotificationsOrg");
    } catch (error) {
      console.error("Preload Error - getAllNotificationsOrg:", error);
      return []; // Return empty array on error to prevent app crash
    }
  },

  getUnreadNotificationCount: async () => {
    try {
      return await ipcRenderer.invoke("db:getUnreadNotificationCount");
    } catch (error) {
      console.error("Preload Error - getUnreadNotificationCount:", error);
      return 0;
    }
  },

  markOrgNotificationAsRead: async (id) => {
    return await ipcRenderer.invoke("db:markOrgNotificationAsRead", id);
  },

  markAllOrgNotificationsAsRead: async () => {
    return await ipcRenderer.invoke("db:markAllOrgNotificationsAsRead");
  },

  getAllOrgNotifications: async () => {
    try {
      return await ipcRenderer.invoke("db:getAllNotificationsOrg");
    } catch (error) {
      console.error("Preload Error - getAllOrgNotifications:", error);
      return [];
    }
  },

  createSyncRequest: async (sourceOrganization, sourceUserName, sourceUserId, donorIds) => {
    try {
      return await ipcRenderer.invoke("createSyncRequest", sourceOrganization, sourceUserName, sourceUserId, donorIds);
    } catch (error) {
      console.error("Preload Error - createSyncRequest:", error);
      throw error;
    }
  },

  createOrgNotification: async (notificationData) => {
    try {
      return await ipcRenderer.invoke(
        "db:createOrgNotification",
        notificationData
      );
    } catch (error) {
      console.error("Preload Error - createOrgNotification:", error);
      throw error;
    }
  },

  createMail: async (mailData) => {
    try {
      return await ipcRenderer.invoke("db:createMail", mailData);
    } catch (error) {
      console.error("Preload Error - createMail:", error);
      throw error;
    }
  },

  getAllMails: async () => {
    try {
      return await ipcRenderer.invoke("db:getAllMails");
    } catch (error) {
      console.error("Preload Error - getAllMails:", error);
      throw error;
    }
  },

  markMailAsRead: async (mailId) => {
    return await ipcRenderer.invoke("db:markMailAsRead", mailId);
  },

  toggleMailStar: async (mailId) => {
    return await ipcRenderer.invoke("db:toggleMailStar", mailId);
  },

  deleteMail: async (mailId) => {
    return await ipcRenderer.invoke("db:deleteMail", mailId);
  },

  getTableSchema: async (tableName) => {
    try {
      return await ipcRenderer.invoke("db:getTableSchema", tableName);
    } catch (error) {
      console.error("Preload Error - getTableSchema:", error);
      throw error;
    }
  },
});

console.log("electronAPI exposed successfully");
