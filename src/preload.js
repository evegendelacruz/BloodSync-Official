const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script loading...');

contextBridge.exposeInMainWorld('electronAPI', {
  test: () => 'API Working!',
  // ==================================================================================
  // 📦 GROUP A: STRICTLY OFFLINE TRANSACTIONS (Local Database Only)
  // ==================================================================================

  // --- BLOOD STOCK (Red Blood Cells) ---
  getAllBloodStock: () => ipcRenderer.invoke('db:getAllBloodStock'),
  addBloodStock: (data) => ipcRenderer.invoke('db:addBloodStock', data),
  updateBloodStock: (id, data) => ipcRenderer.invoke('db:updateBloodStock', id, data),
  deleteBloodStock: (ids) => ipcRenderer.invoke('db:deleteBloodStock', ids),
  searchBloodStock: (term) => ipcRenderer.invoke('db:searchBloodStock', term),
  getBloodStockBySerialId: (id) => ipcRenderer.invoke('db:getBloodStockBySerialId', id),

  // --- RELEASED STOCK ---
  getReleasedBloodStock: () => ipcRenderer.invoke('db:getReleasedBloodStock'),
  releaseBloodStock: (data) => ipcRenderer.invoke('db:releaseBloodStock', data),
  updateReleasedBloodStock: (id, data) => ipcRenderer.invoke('db:updateReleasedBloodStock', id, data),
  deleteReleasedBloodStock: (ids) => ipcRenderer.invoke('db:deleteReleasedBloodStock', ids),

  // --- PLASMA STOCK ---
  getPlasmaStock: () => ipcRenderer.invoke('db:getPlasmaStock'),
  addPlasmaStock: (data) => ipcRenderer.invoke('db:addPlasmaStock', data),
  updatePlasmaStock: (id, data) => ipcRenderer.invoke('db:updatePlasmaStock', id, data),
  deletePlasmaStock: (ids) => ipcRenderer.invoke('db:deletePlasmaStock', ids),
  searchPlasmaStock: (term) => ipcRenderer.invoke('db:searchPlasmaStock', term),
  getPlasmaStockBySerialId: (id) => ipcRenderer.invoke('db:getPlasmaStockBySerialId', id),
  getReleasedPlasmaStock: () => ipcRenderer.invoke('db:getReleasedPlasmaStock'),
  updateReleasedPlasmaStock: (id, data) => ipcRenderer.invoke('db:updateReleasedPlasmaStock', id, data),

  // --- PLATELET STOCK ---
  getPlateletStock: () => ipcRenderer.invoke('db:getPlateletStock'),
  addPlateletStock: (data) => ipcRenderer.invoke('db:addPlateletStock', data),
  updatePlateletStock: (id, data) => ipcRenderer.invoke('db:updatePlateletStock', id, data),
  deletePlateletStock: (ids) => ipcRenderer.invoke('db:deletePlateletStock', ids),
  searchPlateletStock: (term) => ipcRenderer.invoke('db:searchPlateletStock', term),
  getPlateletStockBySerialId: (id) => ipcRenderer.invoke('db:getPlateletStockBySerialId', id),
  getReleasedPlateletStock: () => ipcRenderer.invoke('db:getReleasedPlateletStock'),
  updateReleasedPlateletStock: (id, data) => ipcRenderer.invoke('db:updateReleasedPlateletStock', id, data),

  // --- NON-CONFORMING (General/RBC) ---
  getAllNonConforming: () => ipcRenderer.invoke('db:getAllNonConforming'),
  getBloodStockBySerialIdForNC: (id) => ipcRenderer.invoke('db:getBloodStockBySerialIdForNC', id),
  transferToNonConforming: (ids) => ipcRenderer.invoke('db:transferToNonConforming', ids),
  updateNonConforming: (id, data) => ipcRenderer.invoke('db:updateNonConforming', id, data),
  deleteNonConforming: (ids) => ipcRenderer.invoke('db:deleteNonConforming', ids),
  searchNonConforming: (term) => ipcRenderer.invoke('db:searchNonConforming', term),
  discardNonConformingStock: (data) => ipcRenderer.invoke('db:discardNonConformingStock', data),
  getNonConformingBySerialIdForDiscard: (id) => ipcRenderer.invoke('db:getNonConformingBySerialIdForDiscard', id),

  // --- NON-CONFORMING (Platelet) ---
  getAllPlateletNonConforming: () => ipcRenderer.invoke('db:getAllPlateletNonConforming'),
  getPlateletStockBySerialIdForNC: (id) => ipcRenderer.invoke('db:getPlateletStockBySerialIdForNC', id),
  transferPlateletToNonConforming: (ids) => ipcRenderer.invoke('db:transferPlateletToNonConforming', ids),
  updatePlateletNonConforming: (id, data) => ipcRenderer.invoke('db:updatePlateletNonConforming', id, data),
  deletePlateletNonConforming: (ids) => ipcRenderer.invoke('db:deletePlateletNonConforming', ids),
  searchPlateletNonConforming: (term) => ipcRenderer.invoke('db:searchPlateletNonConforming', term),
  discardPlateletNonConformingStock: (data) => ipcRenderer.invoke('db:discardPlateletNonConformingStock', data),
  getPlateletNonConformingBySerialIdForDiscard: (id) => ipcRenderer.invoke('db:getPlateletNonConformingBySerialIdForDiscard', id),

  // --- NON-CONFORMING (Plasma) ---
  getAllPlasmaNonConforming: () => ipcRenderer.invoke('db:getAllPlasmaNonConforming'),
  getPlasmaStockBySerialIdForNC: (id) => ipcRenderer.invoke('db:getPlasmaStockBySerialIdForNC', id),
  transferPlasmaToNonConforming: (ids) => ipcRenderer.invoke('db:transferPlasmaToNonConforming', ids),
  updatePlasmaNonConforming: (id, data) => ipcRenderer.invoke('db:updatePlasmaNonConforming', id, data),
  deletePlasmaNonConforming: (ids) => ipcRenderer.invoke('db:deletePlasmaNonConforming', ids),
  searchPlasmaNonConforming: (term) => ipcRenderer.invoke('db:searchPlasmaNonConforming', term),
  discardPlasmaNonConformingStock: (data) => ipcRenderer.invoke('db:discardPlasmaNonConformingStock', data),
  getPlasmaNonConformingBySerialIdForDiscard: (id) => ipcRenderer.invoke('db:getPlasmaNonConformingBySerialIdForDiscard', id),

  // --- RESTORE STOCK ---
  restoreBloodStock: (ids) => ipcRenderer.invoke('db:restoreBloodStock', ids),
  restorePlasmaStock: (ids) => ipcRenderer.invoke('db:restorePlasmaStock', ids),
  restorePlateletStock: (ids) => ipcRenderer.invoke('db:restorePlateletStock', ids),

  // --- DONOR RECORDS ---
  getAllDonorRecords: () => ipcRenderer.invoke('db:getAllDonorRecords'),
  addDonorRecord: (data) => ipcRenderer.invoke('db:addDonorRecord', data),
  updateDonorRecord: (id, data) => ipcRenderer.invoke('db:updateDonorRecord', id, data),
  deleteDonorRecords: (ids) => ipcRenderer.invoke('db:deleteDonorRecords', ids),
  searchDonorRecords: (term) => ipcRenderer.invoke('db:searchDonorRecords', term),
  generateNextDonorId: () => ipcRenderer.invoke('db:generateNextDonorId'),

  // --- INVOICES ---
  getAllReleasedBloodInvoices: () => ipcRenderer.invoke('get-all-invoices'),
  viewReleasedBloodInvoice: (id) => ipcRenderer.invoke('get-invoice-details', id), // Maps to get-invoice-details
  searchReleasedBloodInvoices: (term) => ipcRenderer.invoke('search-invoices', term),
  deleteReleasedBloodInvoices: (ids) => ipcRenderer.invoke('delete-released-blood-invoices', ids),
  
  getAllDiscardedBloodInvoices: () => ipcRenderer.invoke('getAllDiscardedBloodInvoices'),
  viewDiscardedBloodInvoice: (id) => ipcRenderer.invoke('viewDiscardedBloodInvoice', id),
  searchDiscardedBloodInvoices: (term) => ipcRenderer.invoke('searchDiscardedBloodInvoices', term),
  deleteDiscardedBloodInvoices: (ids) => ipcRenderer.invoke('deleteDiscardedBloodInvoices', ids),

  // --- REPORTS ---
  getAllBloodReports: () => ipcRenderer.invoke('get-all-blood-reports'),
  generateAllQuarterlyReports: (year) => ipcRenderer.invoke('generate-all-quarterly-reports', year),
  generateQuarterlyReport: (q, y, ms, me) => ipcRenderer.invoke('generate-quarterly-report', q, y, ms, me),
  deleteReports: (ids) => ipcRenderer.invoke('delete-reports', ids),
  searchReports: (term) => ipcRenderer.invoke('search-reports', term),
  refreshCurrentYearReports: () => ipcRenderer.invoke('refresh-current-year-reports'),
  generateAllHistoricalReports: () => ipcRenderer.invoke('generate-all-historical-reports'),

  // --- DASHBOARD (Offline items) ---
  getReleasedBloodStockItems: () => ipcRenderer.invoke('getReleasedBloodStock'), // For Dashboard list
  getReleasedPlasmaStockItems: () => ipcRenderer.invoke('getReleasedPlasmaStock'), // For Dashboard list
  getReleasedPlateletStockItems: () => ipcRenderer.invoke('getReleasedPlateletStock'), // For Dashboard list
  getBloodStockHistory: (year) => ipcRenderer.invoke('db:getBloodStockHistory', year),

  // --- AUTHENTICATION (Local) ---
  login: (email, password) => ipcRenderer.invoke('auth:login', email, password),
  register: (userData) => ipcRenderer.invoke('auth:register', userData),
  verifyUser: (token) => ipcRenderer.invoke('auth:verify', token),
  
  // --- USER MANAGEMENT (Local) ---
  getPendingUsers: () => ipcRenderer.invoke('get-pending-users'),
  getVerifiedUsers: () => ipcRenderer.invoke('get-verified-users'),
  verifyUserById: (id) => ipcRenderer.invoke('verify-user-by-id', id),
  rejectUser: (id) => ipcRenderer.invoke('reject-user', id),
  updateUserRole: (id, role) => ipcRenderer.invoke('update-user-role', id, role),
  removeUser: (id) => ipcRenderer.invoke('remove-user', id),
  getUserProfileById: (id) => ipcRenderer.invoke('get-user-profile', id),
  updateUserProfile: (id, data) => ipcRenderer.invoke('update-user-profile', id, data),
  updateUserProfileImage: (id, img) => ipcRenderer.invoke('update-profile-image', id, img),
  
  // --- USER ACTIVITY LOGS ---
  getUserActivityLog: (id, lim, off) => ipcRenderer.invoke('get-user-activity-log', id, lim, off),
  getUserActivityLogCount: (id) => ipcRenderer.invoke('get-user-activity-log-count', id),
  logUserActivity: (id, act, desc) => ipcRenderer.invoke('log-user-activity', id, act, desc),
  updateUserPassword: (id, curr, newP) => ipcRenderer.invoke('update-user-password', id, curr, newP),

  // ==================================================================================
  // ☁️ GROUP B: STRICTLY ONLINE TRANSACTIONS (Cloud API Only)
  // ==================================================================================

  // --- SYNC REQUESTS ---
  requestDonorSync: (records, org, uid, uname) => ipcRenderer.invoke('db:requestDonorSync', records, org, uid, uname),
  updateSyncRequestStatus: (org, user, status, approver, reason) => ipcRenderer.invoke('db:updateSyncRequestStatus', org, user, status, approver, reason),
  getPendingSyncRequests: () => ipcRenderer.invoke('db:getPendingSyncRequests'),

  // --- MAIL ---
  getAllMails: () => ipcRenderer.invoke('db:getAllMails'),
  createMail: (data) => ipcRenderer.invoke('db:createMail', data),
  markMailAsRead: (id) => ipcRenderer.invoke('db:markMailAsRead', id),
  toggleMailStar: (id) => ipcRenderer.invoke('db:toggleMailStar', id),
  deleteMail: (id) => ipcRenderer.invoke('db:deleteMail', id),

  // --- NOTIFICATIONS (Online) ---
  getAllNotifications: (userId) => ipcRenderer.invoke('db:getAllNotifications', userId),
  markAllNotificationsAsRead: (userId) => ipcRenderer.invoke('db:markAllNotificationsAsRead', userId),
  
  // --- NOTIFICATIONS (Organization) ---
  createOrgNotification: (data) => ipcRenderer.invoke('db:createNotificationOrg', data),
  getAllNotificationsOrg: () => ipcRenderer.invoke('db:getAllNotificationsOrg'),
  markOrgNotificationAsRead: (id) => ipcRenderer.invoke('db:markNotificationAsReadOrg', id),
  markAllOrgNotificationsAsRead: () => ipcRenderer.invoke('db:markAllNotificationsAsReadOrg', id),
  checkEventNotifications: () => ipcRenderer.invoke('db:checkEventNotifications'),
  getAllOrgNotifications: () => ipcRenderer.invoke('org:getAllOrgNotifications'), // Alias

  // --- CALENDAR / APPOINTMENTS (Online) ---
  getAllAppointments: (orgName) => ipcRenderer.invoke('db:getAllAppointments', orgName),
  addAppointment: (data, user) => ipcRenderer.invoke('db:addAppointment', data, user),
  updateAppointment: (id, data, user) => ipcRenderer.invoke('db:updateAppointment', id, data, user),
  updateAppointmentStatus: (id, status, user) => ipcRenderer.invoke('db:updateAppointmentStatus', id, status, user),
  cancelAppointmentWithReason: (id, reason, user) => ipcRenderer.invoke('db:cancelAppointmentWithReason', id, reason, user),
  deleteAppointments: (ids, user) => ipcRenderer.invoke('db:deleteAppointments', ids, user),
  deleteAppointment: (id, user) => ipcRenderer.invoke('db:deleteAppointment', id, user),
  searchAppointments: (term) => ipcRenderer.invoke('db:searchAppointments', term),
  getAppointmentsByDateRange: (start, end) => ipcRenderer.invoke('db:getAppointmentsByDateRange', start, end),
  getAppointmentById: (id) => ipcRenderer.invoke('db:getAppointmentById', id),
  getAppointmentStatistics: () => ipcRenderer.invoke('db:getAppointmentStatistics'),
  getAllOrgAppointments: () => ipcRenderer.invoke('get-all-org-appointments'), // Internal

  // --- PARTNERSHIP REQUESTS ---
  createPartnershipRequest: (data) => ipcRenderer.invoke('db:createPartnershipRequest', data),
  getAllPartnershipRequests: (status) => ipcRenderer.invoke('db:getAllPartnershipRequests', status),
  getPartnershipRequestById: (id) => ipcRenderer.invoke('db:getPartnershipRequestById', id),
  updatePartnershipRequestStatus: (id, status, approver) => ipcRenderer.invoke('db:updatePartnershipRequestStatus', id, status, approver),
  getPendingPartnershipRequestsCount: () => ipcRenderer.invoke('db:getPendingPartnershipRequestsCount'),
  deletePartnershipRequest: (id) => ipcRenderer.invoke('db:deletePartnershipRequest', id),

  // --- ORGANIZATION AUTHENTICATION ---
  registerOrgUser: (data) => ipcRenderer.invoke('auth:registerOrg', data),
  loginOrgUser: (idOrEmail, pass) => ipcRenderer.invoke('auth:loginOrg', idOrEmail, pass),
  activateOrgUser: (token) => ipcRenderer.invoke('auth:activateOrg', token),

  // --- ORGANIZATION DONORS ---
  getAllDonors: () => ipcRenderer.invoke('org:getAllDonors'), // Org specific donor list
  
  // --- ORGANIZATION ACTIVITY LOGS ---
  getAllActivities: (lim, off) => ipcRenderer.invoke('db:getAllActivities', lim, off),
  searchActivities: (term, lim) => ipcRenderer.invoke('db:searchActivities', term, lim),
  logActivityRBC: (data) => ipcRenderer.invoke('db:logActivityRBC', data),
  logOrgActivity: (data) => ipcRenderer.invoke('org:logActivity', data),

  // --- PASSWORD RESET ---
  forgotPassword: (email) => ipcRenderer.invoke('auth:forgotPassword', email),
});

console.log('electronAPI exposed successfully');
