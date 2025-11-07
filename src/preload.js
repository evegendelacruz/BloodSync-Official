const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script loading...');

contextBridge.exposeInMainWorld('electronAPI', {
  test: () => 'API Working!',
  
  // ========== ACTIVITY LOGGING METHODS ==========
  getAllActivities: async (limit = 100, offset = 0) => {
    try {
      return await ipcRenderer.invoke('db:getAllActivities', limit, offset);
    } catch (error) {
      console.error('Preload Error - getAllActivities:', error);
      throw error;
    }
  },
  
  searchActivities: async (searchTerm, limit = 100) => {
    try {
      return await ipcRenderer.invoke('db:searchActivities', searchTerm, limit);
    } catch (error) {
      console.error('Preload Error - searchActivities:', error);
      throw error;
    }
  },
  
  logActivity: async (activityData) => {
    try {
      return await ipcRenderer.invoke('db:logActivity', activityData);
    } catch (error) {
      console.error('Preload Error - logActivity:', error);
      throw error;
    }
  },

  logActivityRBC: async (activityData) => {
    try {
      return await ipcRenderer.invoke('db:logActivityRBC', activityData);
    } catch (error) {
      console.error('Preload Error - logActivityRBC:', error);
      throw error;
    }
  },

  // ========== PARTNERSHIP REQUEST METHODS ==========
  createPartnershipRequest: async (requestData) => {
    try {
      return await ipcRenderer.invoke('db:createPartnershipRequest', requestData);
    } catch (error) {
      console.error('Preload Error - createPartnershipRequest:', error);
      throw error;
    }
  },

  getAllPartnershipRequests: async (status = null) => {
    try {
      return await ipcRenderer.invoke('db:getAllPartnershipRequests', status);
    } catch (error) {
      console.error('Preload Error - getAllPartnershipRequests:', error);
      throw error;
    }
  },

  getPartnershipRequestById: async (requestId) => {
    try {
      return await ipcRenderer.invoke('db:getPartnershipRequestById', requestId);
    } catch (error) {
      console.error('Preload Error - getPartnershipRequestById:', error);
      throw error;
    }
  },

  updatePartnershipRequestStatus: async (requestId, status, approvedBy) => {
    try {
      return await ipcRenderer.invoke('db:updatePartnershipRequestStatus', requestId, status, approvedBy);
    } catch (error) {
      console.error('Preload Error - updatePartnershipRequestStatus:', error);
      throw error;
    }
  },

  getPendingPartnershipRequestsCount: async () => {
    try {
      return await ipcRenderer.invoke('db:getPendingPartnershipRequestsCount');
    } catch (error) {
      console.error('Preload Error - getPendingPartnershipRequestsCount:', error);
      throw error;
    }
  },

  deletePartnershipRequest: async (requestId) => {
    try {
      return await ipcRenderer.invoke('db:deletePartnershipRequest', requestId);
    } catch (error) {
      console.error('Preload Error - deletePartnershipRequest:', error);
      throw error;
    }
  },

  // ========== NOTIFICATION METHODS (ORG DB) ==========
  createOrgNotification: async (notificationData) => {
    try {
      return await ipcRenderer.invoke('db:createNotificationOrg', notificationData);
    } catch (error) {
      console.error('Preload Error - createNotification:', error);
      throw error;
    }
  },

  getAllOrgNotifications: async () => {
    try {
      return await ipcRenderer.invoke('db:getAllNotificationsOrg');
    } catch (error) {
      console.error('Preload Error - getAllNotifications:', error);
      throw error;
    }
  },

  markOrgNotificationAsRead: async (notificationId) => {
    try {
      return await ipcRenderer.invoke('db:markNotificationAsReadOrg', notificationId);
    } catch (error) {
      console.error('Preload Error - markNotificationAsRead:', error);
      throw error;
    }
  },

  deleteOrgNotification: async (notificationId) => {
    try {
      return await ipcRenderer.invoke('db:deleteNotificationOrg', notificationId);
    } catch (error) {
      console.error('Preload Error - deleteNotification:', error);
      throw error;
    }
  },

  // ========== MAIL METHODS (ORGANIZATION) ==========
  createMail: async (mailData) => {
    try {
      return await ipcRenderer.invoke('db:createMail', mailData);
    } catch (error) {
      console.error('Preload Error - createMail:', error);
      throw error;
    }
  },

  getAllMails: async () => {
    try {
      return await ipcRenderer.invoke('db:getAllMails');
    } catch (error) {
      console.error('Preload Error - getAllMails:', error);
      throw error;
    }
  },

  markMailAsRead: async (mailId) => {
    try {
      return await ipcRenderer.invoke('db:markMailAsRead', mailId);
    } catch (error) {
      console.error('Preload Error - markMailAsRead:', error);
      throw error;
    }
  },

  toggleMailStar: async (mailId) => {
    try {
      return await ipcRenderer.invoke('db:toggleMailStar', mailId);
    } catch (error) {
      console.error('Preload Error - toggleMailStar:', error);
      throw error;
    }
  },

  deleteMail: async (mailId) => {
    try {
      return await ipcRenderer.invoke('db:deleteMail', mailId);
    } catch (error) {
      console.error('Preload Error - deleteMail:', error);
      throw error;
    }
  },

  // ========== BLOOD EXPIRATION CHECKING METHODS ==========
  getExpiringBloodStocks: async (daysThreshold = 7) => {
    try {
      return await ipcRenderer.invoke('db:getExpiringBloodStocks', daysThreshold);
    } catch (error) {
      console.error('Preload Error - getExpiringBloodStocks:', error);
      throw error;
    }
  },

  getExpiringNonConformingStocks: async (daysThreshold = 7) => {
    try {
      return await ipcRenderer.invoke('db:getExpiringNonConformingStocks', daysThreshold);
    } catch (error) {
      console.error('Preload Error - getExpiringNonConformingStocks:', error);
      throw error;
    }
  },

  getAllExpiringStocks: async (daysThreshold = 7) => {
    try {
      return await ipcRenderer.invoke('db:getAllExpiringStocks', daysThreshold);
    } catch (error) {
      console.error('Preload Error - getAllExpiringStocks:', error);
      throw error;
    }
  },

  checkAndCreateExpirationNotifications: async () => {
    try {
      return await ipcRenderer.invoke('db:checkAndCreateExpirationNotifications');
    } catch (error) {
      console.error('Preload Error - checkAndCreateExpirationNotifications:', error);
      throw error;
    }
  },

  // ========== BLOOD DONATION ANALYTICS METHODS ==========
  getBloodDonationAnalytics: async () => {
    try {
      return await ipcRenderer.invoke('db:getBloodDonationAnalytics');
    } catch (error) {
      console.error('Preload Error - getBloodDonationAnalytics:', error);
      throw error;
    }
  },

  // ========== USER MANAGEMENT METHODS ==========
  getAllActiveUsers: async () => {
    try {
      return await ipcRenderer.invoke('db:getAllActiveUsers');
    } catch (error) {
      console.error('Preload Error - getAllActiveUsers:', error);
      throw error;
    }
  },

  getPendingUsers: async () => {
    try {
      return await ipcRenderer.invoke('db:getPendingUsers');
    } catch (error) {
      console.error('Preload Error - getPendingUsers:', error);
      throw error;
    }
  },

  approveUser: async (userId) => {
    try {
      return await ipcRenderer.invoke('db:approveUser', userId);
    } catch (error) {
      console.error('Preload Error - approveUser:', error);
      throw error;
    }
  },

  rejectUser: async (userId) => {
    try {
      return await ipcRenderer.invoke('db:rejectUser', userId);
    } catch (error) {
      console.error('Preload Error - rejectUser:', error);
      throw error;
    }
  },

  updateUserRole: async (userId, newRole) => {
    try {
      return await ipcRenderer.invoke('db:updateUserRole', userId, newRole);
    } catch (error) {
      console.error('Preload Error - updateUserRole:', error);
      throw error;
    }
  },

  deleteUser: async (userId) => {
    try {
      return await ipcRenderer.invoke('db:deleteUser', userId);
    } catch (error) {
      console.error('Preload Error - deleteUser:', error);
      throw error;
    }
  },

  // ========== ORGANIZATION USER MANAGEMENT METHODS ==========
  getAllActiveOrgUsers: async () => {
    try {
      return await ipcRenderer.invoke('db:getAllActiveOrgUsers');
    } catch (error) {
      console.error('Preload Error - getAllActiveOrgUsers:', error);
      throw error;
    }
  },

  updateOrgUserRole: async (userId, newRole) => {
    try {
      return await ipcRenderer.invoke('db:updateOrgUserRole', userId, newRole);
    } catch (error) {
      console.error('Preload Error - updateOrgUserRole:', error);
      throw error;
    }
  },

  deleteOrgUser: async (userId) => {
    try {
      return await ipcRenderer.invoke('db:deleteOrgUser', userId);
    } catch (error) {
      console.error('Preload Error - deleteOrgUser:', error);
      throw error;
    }
  },

  // ========== DONOR METHODS WITH ACTIVITY LOGGING ==========
  getAllDonors: async () => {
    try {
      return await ipcRenderer.invoke('db:getAllDonors');
    } catch (error) {
      console.error('Preload Error - getAllDonors:', error);
      throw error;
    }
  },
  
  addDonor: async (donorData, userName = 'Alaiza Rose Olores') => {
    try {
      return await ipcRenderer.invoke('db:addDonor', donorData, userName);
    } catch (error) {
      console.error('Preload Error - addDonor:', error);
      throw error;
    }
  },
  
  updateDonor: async (id, donorData, userName = 'Alaiza Rose Olores') => {
    try {
      return await ipcRenderer.invoke('db:updateDonor', id, donorData, userName);
    } catch (error) {
      console.error('Preload Error - updateDonor:', error);
      throw error;
    }
  },
  
  deleteDonors: async (ids, userName = 'Alaiza Rose Olores') => {
    try {
      return await ipcRenderer.invoke('db:deleteDonors', ids, userName);
    } catch (error) {
      console.error('Preload Error - deleteDonors:', error);
      throw error;
    }
  },
  
  searchDonors: async (searchTerm) => {
    try {
      return await ipcRenderer.invoke('db:searchDonors', searchTerm);
    } catch (error) {
      console.error('Preload Error - searchDonors:', error);
      throw error;
    }
  },
  
  getDonorByDonorId: async (donorId) => {
    try {
      return await ipcRenderer.invoke('db:getDonorByDonorId', donorId);
    } catch (error) {
      console.error('Preload Error - getDonorByDonorId:', error);
      throw error;
    }
  },
  
  getDonorStatistics: async () => {
    try {
      return await ipcRenderer.invoke('db:getDonorStatistics');
    } catch (error) {
      console.error('Preload Error - getDonorStatistics:', error);
      throw error;
    }
  },
  
  testDonorConnection: async () => {
    try {
      return await ipcRenderer.invoke('db:testDonorConnection');
    } catch (error) {
      console.error('Preload Error - testDonorConnection:', error);
      throw error;
    }
  },

  // ========== APPOINTMENT METHODS WITH ACTIVITY LOGGING ==========
  getAllAppointments: async (organizationName) => {
    try {
      return await ipcRenderer.invoke('db:getAllAppointments', organizationName);
    } catch (error) {
      console.error('Preload Error - getAllAppointments:', error);
      throw error;
    }
  },
  
  addAppointment: async (appointmentData, userName = 'Alaiza Rose Olores') => {
    try {
      return await ipcRenderer.invoke('db:addAppointment', appointmentData, userName);
    } catch (error) {
      console.error('Preload Error - addAppointment:', error);
      throw error;
    }
  },
  
  updateAppointment: async (id, appointmentData, userName = 'Alaiza Rose Olores') => {
    try {
      return await ipcRenderer.invoke('db:updateAppointment', id, appointmentData, userName);
    } catch (error) {
      console.error('Preload Error - updateAppointment:', error);
      throw error;
    }
  },
  
  deleteAppointments: async (ids, userName = 'Alaiza Rose Olores') => {
    try {
      return await ipcRenderer.invoke('db:deleteAppointments', ids, userName);
    } catch (error) {
      console.error('Preload Error - deleteAppointments:', error);
      throw error;
    }
  },
  
  deleteAppointment: async (id, userName = 'Alaiza Rose Olores') => {
    try {
      return await ipcRenderer.invoke('db:deleteAppointment', id, userName);
    } catch (error) {
      console.error('Preload Error - deleteAppointment:', error);
      throw error;
    }
  },
  
  searchAppointments: async (searchTerm) => {
    try {
      return await ipcRenderer.invoke('db:searchAppointments', searchTerm);
    } catch (error) {
      console.error('Preload Error - searchAppointments:', error);
      throw error;
    }
  },
  
  getAppointmentsByDateRange: async (startDate, endDate) => {
    try {
      return await ipcRenderer.invoke('db:getAppointmentsByDateRange', startDate, endDate);
    } catch (error) {
      console.error('Preload Error - getAppointmentsByDateRange:', error);
      throw error;
    }
  },
  
  getAppointmentById: async (id) => {
    try {
      return await ipcRenderer.invoke('db:getAppointmentById', id);
    } catch (error) {
      console.error('Preload Error - getAppointmentById:', error);
      throw error;
    }
  },
  
  getAppointmentStatistics: async () => {
    try {
      return await ipcRenderer.invoke('db:getAppointmentStatistics');
    } catch (error) {
      console.error('Preload Error - getAppointmentStatistics:', error);
      throw error;
    }
  },

  // ========== NOTIFICATION METHODS ==========
  sendNotification: async (notificationData) => {
    try {
      return await ipcRenderer.invoke('db:sendNotification', notificationData);
    } catch (error) {
      console.error('Preload Error - sendNotification:', error);
      throw error;
    }
  },

  getAllNotifications: async () => {
    try {
      return await ipcRenderer.invoke('db:getAllNotifications');
    } catch (error) {
      console.error('Preload Error - getAllNotifications:', error);
      throw error;
    }
  },

  updateNotificationStatus: async (notificationId, status, userName = 'Central System Admin') => {
    try {
      return await ipcRenderer.invoke('db:updateNotificationStatus', notificationId, status, userName);
    } catch (error) {
      console.error('Preload Error - updateNotificationStatus:', error);
      throw error;
    }
  },

  // Add this in the NOTIFICATION METHODS section, after updateNotificationStatus
updateNotificationStatusWithReason: async (notificationId, status, userName = 'Central System Admin', reason) => {
  try {
    return await ipcRenderer.invoke('db:updateNotificationStatusWithReason', notificationId, status, userName, reason);
  } catch (error) {
    console.error('Preload Error - updateNotificationStatusWithReason:', error);
    throw error;
  }
},

  deleteNotification: async (notificationId) => {
    try {
      return await ipcRenderer.invoke('db:deleteNotification', notificationId);
    } catch (error) {
      console.error('Preload Error - deleteNotification:', error);
      throw error;
    }
  },
  
  // ========== RED BLOOD CELL METHODS ==========
  getAllBloodStock: async () => {
    try {
      return await ipcRenderer.invoke('db:getAllBloodStock');
    } catch (error) {
      console.error('Preload Error - getAllBloodStock:', error);
      throw error;
    }
  },
  
  addBloodStock: async (bloodData) => {
    try {
      return await ipcRenderer.invoke('db:addBloodStock', bloodData);
    } catch (error) {
      console.error('Preload Error - addBloodStock:', error);
      throw error;
    }
  },
  
  updateBloodStock: async (id, bloodData) => {
    try {
      return await ipcRenderer.invoke('db:updateBloodStock', id, bloodData);
    } catch (error) {
      console.error('Preload Error - updateBloodStock:', error);
      throw error;
    }
  },
  
  deleteBloodStock: async (ids) => {
    try {
      return await ipcRenderer.invoke('db:deleteBloodStock', ids);
    } catch (error) {
      console.error('Preload Error - deleteBloodStock:', error);
      throw error;
    }
  },
  
  searchBloodStock: async (searchTerm) => {
    try {
      return await ipcRenderer.invoke('db:searchBloodStock', searchTerm);
    } catch (error) {
      console.error('Preload Error - searchBloodStock:', error);
      throw error;
    }
  },
  
  getBloodStockBySerialId: async (serialId) => {
    try {
      return await ipcRenderer.invoke('db:getBloodStockBySerialId', serialId);
    } catch (error) {
      console.error('Preload Error - getBloodStockBySerialId:', error);
      throw error;
    }
  },
  
  releaseBloodStock: async (releaseData) => {
    try {
      console.log('Preload - releasing blood stock:', releaseData);
      const result = await ipcRenderer.invoke('db:releaseBloodStock', releaseData);
      return result;
    } catch (error) {
      console.error('Preload Error - releaseBloodStock:', error);
      throw error;
    }
  },
  
  getReleasedBloodStock: async () => {
    try {
      return await ipcRenderer.invoke('db:getReleasedBloodStock');
    } catch (error) {
      console.error('Preload Error - getReleasedBloodStock:', error);
      throw error;
    }
  },

  updateReleasedBloodStock: async (id, bloodData) => {
    try {
      return await ipcRenderer.invoke('db:updateReleasedBloodStock', id, bloodData);
    } catch (error) {
      console.error('Preload Error - updateReleasedBloodStock:', error);
      throw error;
    }
  },

  deleteReleasedBloodStock: async (ids) => {
    try {
      return await ipcRenderer.invoke('db:deleteReleasedBloodStock', ids);
    } catch (error) {
      console.error('Preload Error - deleteReleasedBloodStock:', error);
      throw error;
    }
  },

  // ========== PLATELET METHODS ==========
  getPlateletStock: async () => {
    try {
      return await ipcRenderer.invoke('db:getPlateletStock');
    } catch (error) {
      console.error('Preload Error - getPlateletStock:', error);
      throw error;
    }
  },
  
  addPlateletStock: async (plateletData) => {
    try {
      return await ipcRenderer.invoke('db:addPlateletStock', plateletData);
    } catch (error) {
      console.error('Preload Error - addPlateletStock:', error);
      throw error;
    }
  },
  
  updatePlateletStock: async (id, plateletData) => {
    try {
      return await ipcRenderer.invoke('db:updatePlateletStock', id, plateletData);
    } catch (error) {
      console.error('Preload Error - updatePlateletStock:', error);
      throw error;
    }
  },
  
  deletePlateletStock: async (ids) => {
    try {
      return await ipcRenderer.invoke('db:deletePlateletStock', ids);
    } catch (error) {
      console.error('Preload Error - deletePlateletStock:', error);
      throw error;
    }
  },
  
  searchPlateletStock: async (searchTerm) => {
    try {
      return await ipcRenderer.invoke('db:searchPlateletStock', searchTerm);
    } catch (error) {
      console.error('Preload Error - searchPlateletStock:', error);
      throw error;
    }
  },

  getPlateletStockBySerialId: async (serialId) => {
    try {
      return await ipcRenderer.invoke('db:getPlateletStockBySerialId', serialId);
    } catch (error) {
      console.error('Preload Error - getPlateletStockBySerialId:', error);
      throw error;
    }
  },

  releasePlateletStock: async (releaseData) => {
    try {
      console.log('Preload - releasing platelet stock:', releaseData);
      const result = await ipcRenderer.invoke('db:releasePlateletStock', releaseData);
      console.log('Preload - platelet release result:', result);
      return result;
    } catch (error) {
      console.error('Preload Error - releasePlateletStock:', error);
      throw error;
    }
  },

  getReleasedPlateletStock: async () => {
    try {
      return await ipcRenderer.invoke('db:getReleasedPlateletStock');
    } catch (error) {
      console.error('Preload Error - getReleasedPlateletStock:', error);
      throw error;
    }
  },

  updateReleasedPlateletStock: async (id, plateletData) => {
    try {
      return await ipcRenderer.invoke('db:updateReleasedPlateletStock', id, plateletData);
    } catch (error) {
      console.error('Preload Error - updateReleasedPlateletStock:', error);
      throw error;
    }
  },

  deleteReleasedPlateletStock: async (ids) => {
    try {
      return await ipcRenderer.invoke('db:deleteReleasedPlateletStock', ids);
    } catch (error) {
      console.error('Preload Error - deleteReleasedPlateletStock:', error);
      throw error;
    }
  },

  // ========== PLASMA METHODS ==========
  getPlasmaStock: async () => {
    try {
      return await ipcRenderer.invoke('db:getPlasmaStock');
    } catch (error) {
      console.error('Preload Error - getPlasmaStock:', error);
      throw error;
    }
  },
  
  addPlasmaStock: async (plasmaData) => {
    try {
      return await ipcRenderer.invoke('db:addPlasmaStock', plasmaData);
    } catch (error) {
      console.error('Preload Error - addPlasmaStock:', error);
      throw error;
    }
  },
  
  updatePlasmaStock: async (id, plasmaData) => {
    try {
      return await ipcRenderer.invoke('db:updatePlasmaStock', id, plasmaData);
    } catch (error) {
      console.error('Preload Error - updatePlasmaStock:', error);
      throw error;
    }
  },
  
  deletePlasmaStock: async (ids) => {
    try {
      return await ipcRenderer.invoke('db:deletePlasmaStock', ids);
    } catch (error) {
      console.error('Preload Error - deletePlasmaStock:', error);
      throw error;
    }
  },
  
  searchPlasmaStock: async (searchTerm) => {
    try {
      return await ipcRenderer.invoke('db:searchPlasmaStock', searchTerm);
    } catch (error) {
      console.error('Preload Error - searchPlasmaStock:', error);
      throw error;
    }
  },

  releasePlasmaStock: async (releaseData) => {
    try {
      const result = await ipcRenderer.invoke('db:releasePlasmaStock', releaseData);
      return result;
    } catch (error) {
      console.error('Preload Error - releasePlasmaStock:', error);
      throw error;
    }
  },

  getReleasedPlasmaStock: async () => {
    try {
      return await ipcRenderer.invoke('db:getReleasedPlasmaStock');
    } catch (error) {
      console.error('Preload Error - getReleasedPlasmaStock:', error);
      throw error;
    }
  },

getPlasmaStockBySerialId: async (serialId) => {
  try {
    return await ipcRenderer.invoke('db:getPlasmaStockBySerialId', serialId);
  } catch (error) {
    console.error('Preload Error - getPlasmaStockBySerialId:', error);
    throw error;
  }
},

  // ========== USER AUTHENTICATION METHODS ==========
  registerUser: async (userData) => {
    try {
      return await ipcRenderer.invoke('db:registerUser', userData);
    } catch (error) {
      console.error('Preload Error - registerUser:', error);
      throw error;
    }
  },

  registerOrgUser: async (userData) => {
    try {
      return await ipcRenderer.invoke('db:registerOrgUser', userData);
    } catch (error) {
      console.error('Preload Error - registerOrgUser:', error);
      throw error;
    }
  },

  loginUser: async (email, password) => {
    try {
      return await ipcRenderer.invoke('db:loginUser', email, password);
    } catch (error) {
      console.error('Preload Error - loginUser:', error);
      throw error;
    }
  },

  loginOrgUser: async (email, password) => {
    try {
      return await ipcRenderer.invoke('db:loginOrgUser', email, password);
    } catch (error) {
      console.error('Preload Error - loginOrgUser:', error);
      throw error;
    }
  },

  // ========== ORGANIZATION USER PROFILE METHODS ==========
  getUserProfile: async (userId) => {
    try {
      return await ipcRenderer.invoke('db:getUserProfile', userId);
    } catch (error) {
      console.error('Preload Error - getUserProfile:', error);
      throw error;
    }
  },

  updateUserProfile: async (userId, profileData, userName) => {
    try {
      return await ipcRenderer.invoke('db:updateUserProfile', userId, profileData, userName);
    } catch (error) {
      console.error('Preload Error - updateUserProfile:', error);
      throw error;
    }
  },

  getUserActivities: async (userId, limit = 100, offset = 0) => {
    try {
      return await ipcRenderer.invoke('db:getUserActivities', userId, limit, offset);
    } catch (error) {
      console.error('Preload Error - getUserActivities:', error);
      throw error;
    }
  },

  // ========== RBC USER PROFILE METHODS ==========
  getUserProfileRBC: async (userId) => {
    try {
      return await ipcRenderer.invoke('db:getUserProfileRBC', userId);
    } catch (error) {
      console.error('Preload Error - getUserProfileRBC:', error);
      throw error;
    }
  },

  updateUserProfileRBC: async (userId, profileData, userName) => {
    try {
      return await ipcRenderer.invoke('db:updateUserProfileRBC', userId, profileData, userName);
    } catch (error) {
      console.error('Preload Error - updateUserProfileRBC:', error);
      throw error;
    }
  },

  getUserActivitiesRBC: async (userId, limit = 100, offset = 0) => {
    try {
      return await ipcRenderer.invoke('db:getUserActivitiesRBC', userId, limit, offset);
    } catch (error) {
      console.error('Preload Error - getUserActivitiesRBC:', error);
      throw error;
    }
  },

  getAllActivitiesRBC: async (limit = 100, offset = 0) => {
    try {
      return await ipcRenderer.invoke('db:getAllActivitiesRBC', limit, offset);
    } catch (error) {
      console.error('Preload Error - getAllActivitiesRBC:', error);
      throw error;
    }
  },

  generatePasswordResetToken: async (email) => {
    try {
      return await ipcRenderer.invoke('db:generatePasswordResetToken', email);
    } catch (error) {
      console.error('Preload Error - generatePasswordResetToken:', error);
      throw error;
    }
  },

  resetPassword: async (email, resetToken, newPassword) => {
    try {
      return await ipcRenderer.invoke('db:resetPassword', email, resetToken, newPassword);
    } catch (error) {
      console.error('Preload Error - resetPassword:', error);
      throw error;
    }
  },

  generatePasswordResetTokenOrg: async (email) => {
    try {
      return await ipcRenderer.invoke('db:generatePasswordResetToken', email);
    } catch (error) {
      console.error('Preload Error - generatePasswordResetTokenOrg:', error);
      throw error;
    }
  },

  resetPasswordOrg: async (email, resetToken, newPassword) => {
    try {
      return await ipcRenderer.invoke('db:resetPassword', email, resetToken, newPassword);
    } catch (error) {
      console.error('Preload Error - resetPasswordOrg:', error);
      throw error;
    }
  },

  activateUserByToken: async (token) => {
    try {
      return await ipcRenderer.invoke('db:activateUserByToken', token);
    } catch (error) {
      console.error('Preload Error - activateUserByToken:', error);
      throw error;
    }
  },

  activateOrgUserByToken: async (token) => {
    try {
      return await ipcRenderer.invoke('db:activateOrgUserByToken', token);
    } catch (error) {
      console.error('Preload Error - activateOrgUserByToken:', error);
      throw error;
    }
  },

  getBloodStockCounts: async () => {
    try {
      return await ipcRenderer.invoke('db:getBloodStockCounts');
    } catch (error) {
      console.error('Preload Error - getBloodStockCounts:', error);
      throw error;
    }
  },

  getBloodStockCountsByType: async () => {
    try {
      return await ipcRenderer.invoke('db:getBloodStockCountsByType');
    } catch (error) {
      console.error('Preload Error - getBloodStockCountsByType:', error);
      throw error;
    }
  },

updateReleasedPlasmaStock: async (id, plasmaData) => {
  try {
    return await ipcRenderer.invoke('db:updateReleasedPlasmaStock', id, plasmaData);
  } catch (error) {
    console.error('Preload Error - updateReleasedPlasmaStock:', error);
    throw error;
  }
},

deleteReleasedPlasmaStock: async (ids) => {
  try {
    return await ipcRenderer.invoke('db:deleteReleasedPlasmaStock', ids);
  } catch (error) {
    console.error('Preload Error - deleteReleasedPlasmaStock:', error);
    throw error;
  }
},

 // ========== DONOR RECORD METHODS ==========
 getAllDonorRecords: async () => {
  return await ipcRenderer.invoke('db:getAllDonorRecords');
},
addDonorRecord: async (donorData) => {
  return await ipcRenderer.invoke('db:addDonorRecord', donorData);
},
updateDonorRecord: async (id, donorData) => {
  return await ipcRenderer.invoke('db:updateDonorRecord', id, donorData);
},
deleteDonorRecords: async (ids) => {
  return await ipcRenderer.invoke('db:deleteDonorRecords', ids);
},
searchDonorRecords: async (searchTerm) => {
  return await ipcRenderer.invoke('db:searchDonorRecords', searchTerm);
},
generateNextDonorId: async () => {
  return await ipcRenderer.invoke('db:generateNextDonorId');
},
// ========== RESTORE BLOOD STOCK METHODS ==========
restoreBloodStock: async (serialIds) => {
  try {
    return await ipcRenderer.invoke('db:restoreBloodStock', serialIds);
  } catch (error) {
    console.error('Preload Error - restoreBloodStock:', error);
    throw error;
  }
},

restorePlasmaStock: async (serialIds) => {
  try {
    return await ipcRenderer.invoke('db:restorePlasmaStock', serialIds);
  } catch (error) {
    console.error('Preload Error - restorePlasmaStock:', error);
    throw error;
  }
},

restorePlateletStock: async (serialIds) => {
  try {
    return await ipcRenderer.invoke('db:restorePlateletStock', serialIds);
  } catch (error) {
    console.error('Preload Error - restorePlateletStock:', error);
    throw error;
  }
},

// ========== NON-CONFORMING METHODS ==========

getAllNonConforming: async () => {
  try {
    return await ipcRenderer.invoke('db:getAllNonConforming');
  } catch (error) {
    console.error('Preload Error - getAllNonConforming:', error);
    throw error;
  }
},

getBloodStockBySerialIdForNC: async (serialId) => {
  try {
    return await ipcRenderer.invoke('db:getBloodStockBySerialIdForNC', serialId);
  } catch (error) {
    console.error('Preload Error - getBloodStockBySerialIdForNC:', error);
    throw error;
  }
},

addNonConforming: async (ncData) => {
  try {
    return await ipcRenderer.invoke('db:addNonConforming', ncData);
  } catch (error) {
    console.error('Preload Error - addNonConforming:', error);
    throw error;
  }
},

updateNonConforming: async (id, ncData) => {
  try {
    return await ipcRenderer.invoke('db:updateNonConforming', id, ncData);
  } catch (error) {
    console.error('Preload Error - updateNonConforming:', error);
    throw error;
  }
},

deleteNonConforming: async (ids) => {
  try {
    return await ipcRenderer.invoke('db:deleteNonConforming', ids);
  } catch (error) {
    console.error('Preload Error - deleteNonConforming:', error);
    throw error;
  }
},

searchNonConforming: async (searchTerm) => {
  try {
    return await ipcRenderer.invoke('db:searchNonConforming', searchTerm);
  } catch (error) {
    console.error('Preload Error - searchNonConforming:', error);
    throw error;
  }
},

transferToNonConforming: async (serialIds) => {
  try {
    return await ipcRenderer.invoke('db:transferToNonConforming', serialIds);
  } catch (error) {
    console.error('Preload Error - transferToNonConforming:', error);
    throw error;
  }
},

// Add methods for discard functionality
discardNonConformingStock: async (discardData) => {
  try {
    return await ipcRenderer.invoke('db:discardNonConformingStock', discardData);
  } catch (error) {
    console.error('Preload Error - discardNonConformingStock:', error);
    throw error;
  }
},

getNonConformingBySerialIdForDiscard: async (serialId) => {
  try {
    return await ipcRenderer.invoke('db:getNonConformingBySerialIdForDiscard', serialId);
  } catch (error) {
    console.error('Preload Error - getNonConformingBySerialIdForDiscard:', error);
    throw error;
  }
},

  searchNonConformingForDiscard: async (searchTerm) => {
    try {
      return await ipcRenderer.invoke('db:searchNonConformingForDiscard', searchTerm);
    } catch (error) {
      console.error('Preload Error - searchNonConformingForDiscard:', error);
      throw error;
    }
  },
  
  // ========== PLATELET NON-CONFORMING METHODS ==========

getAllPlateletNonConforming: async () => {
  try {
    return await ipcRenderer.invoke('db:getAllPlateletNonConforming');
  } catch (error) {
    console.error('Preload Error - getAllPlateletNonConforming:', error);
    throw error;
  }
},

getPlateletStockBySerialIdForNC: async (serialId) => {
  try {
    return await ipcRenderer.invoke('db:getPlateletStockBySerialIdForNC', serialId);
  } catch (error) {
    console.error('Preload Error - getPlateletStockBySerialIdForNC:', error);
    throw error;
  }
},

transferPlateletToNonConforming: async (serialIds) => {
  try {
    return await ipcRenderer.invoke('db:transferPlateletToNonConforming', serialIds);
  } catch (error) {
    console.error('Preload Error - transferPlateletToNonConforming:', error);
    throw error;
  }
},

    // Platelet Non-Conforming
    getAllPlateletNonConforming: () => ipcRenderer.invoke('db:getAllPlateletNonConforming'),
    getPlateletStockBySerialIdForNC: (serialId) => ipcRenderer.invoke('db:getPlateletStockBySerialIdForNC', serialId),
    transferPlateletToNonConforming: (serialIds) => ipcRenderer.invoke('db:transferPlateletToNonConforming', serialIds),
    updatePlateletNonConforming: (id, ncData) => ipcRenderer.invoke('db:updatePlateletNonConforming', id, ncData),
    deletePlateletNonConforming: (ids) => ipcRenderer.invoke('db:deletePlateletNonConforming', ids),
    searchPlateletNonConforming: (searchTerm) => ipcRenderer.invoke('db:searchPlateletNonConforming', searchTerm),
    discardPlateletNonConformingStock: (discardData) => ipcRenderer.invoke('db:discardPlateletNonConformingStock', discardData),
    getPlateletNonConformingBySerialIdForDiscard: (serialId) => ipcRenderer.invoke('db:getPlateletNonConformingBySerialIdForDiscard', serialId),

      // ========== PLASMA NON-CONFORMING METHODS ==========

      getAllPlasmaNonConforming: async () => {
        try {
          return await ipcRenderer.invoke('db:getAllPlasmaNonConforming');
        } catch (error) {
          console.error('Preload Error - getAllPlasmaNonConforming:', error);
          throw error;
        }
      },

      getPlasmaStockBySerialIdForNC: async (serialId) => {
        try {
          return await ipcRenderer.invoke('db:getPlasmaStockBySerialIdForNC', serialId);
        } catch (error) {
          console.error('Preload Error - getPlasmaStockBySerialIdForNC:', error);
          throw error;
        }
      },

      transferPlasmaToNonConforming: async (serialIds) => {
        try {
          return await ipcRenderer.invoke('db:transferPlasmaToNonConforming', serialIds);
        } catch (error) {
          console.error('Preload Error - transferPlasmaToNonConforming:', error);
          throw error;
        }
      },
     // Plasma Non-Conforming
     getAllPlasmaNonConforming: () => ipcRenderer.invoke('db:getAllPlasmaNonConforming'),
     getPlasmaStockBySerialIdForNC: (serialId) => ipcRenderer.invoke('db:getPlasmaStockBySerialIdForNC', serialId),
     transferPlasmaToNonConforming: (serialIds) => ipcRenderer.invoke('db:transferPlasmaToNonConforming', serialIds),
     updatePlasmaNonConforming: (id, ncData) => ipcRenderer.invoke('db:updatePlasmaNonConforming', id, ncData),
     deletePlasmaNonConforming: (ids) => ipcRenderer.invoke('db:deletePlasmaNonConforming', ids),
     searchPlasmaNonConforming: (searchTerm) => ipcRenderer.invoke('db:searchPlasmaNonConforming', searchTerm),
     discardPlasmaNonConformingStock: (discardData) => ipcRenderer.invoke('db:discardPlasmaNonConformingStock', discardData),
     getPlasmaNonConformingBySerialIdForDiscard: (serialId) => ipcRenderer.invoke('db:getPlasmaNonConformingBySerialIdForDiscard', serialId),

     // ========== DONOR RECORDS SYNC METHODS ==========

     // Request donor sync from organization to main system
     requestDonorSync: async (donorRecords, sourceOrganization, sourceUserId, sourceUserName) => {
       try {
         return await ipcRenderer.invoke('db:requestDonorSync', donorRecords, sourceOrganization, sourceUserId, sourceUserName);
       } catch (error) {
         console.error('Preload Error - requestDonorSync:', error);
         throw error;
       }
     },

     // Get pending sync requests
     getPendingSyncRequests: async () => {
       try {
         return await ipcRenderer.invoke('db:getPendingSyncRequests');
       } catch (error) {
         console.error('Preload Error - getPendingSyncRequests:', error);
         throw error;
       }
     },

     // Get all donor records from main table
     getAllDonorRecordsMain: async () => {
       try {
         return await ipcRenderer.invoke('db:getAllDonorRecordsMain');
       } catch (error) {
         console.error('Preload Error - getAllDonorRecordsMain:', error);
         throw error;
       }
     },

     // Approve donor sync
     approveDonorSync: async (approvedBy) => {
       try {
         return await ipcRenderer.invoke('db:approveDonorSync', approvedBy);
       } catch (error) {
         console.error('Preload Error - approveDonorSync:', error);
         throw error;
       }
     },

     // ========== NOTIFICATION METHODS ==========

     // Create notification
     createNotification: async (notificationData) => {
       try {
         return await ipcRenderer.invoke('db:createNotification', notificationData);
       } catch (error) {
         console.error('Preload Error - createNotification:', error);
         throw error;
       }
     },

     // Get all notifications
     getAllNotifications: async (userId = null) => {
       try {
         return await ipcRenderer.invoke('db:getAllNotifications', userId);
       } catch (error) {
         console.error('Preload Error - getAllNotifications:', error);
         throw error;
       }
     },

     // Get unread notification count
     getUnreadNotificationCount: async (userId = null) => {
       try {
         return await ipcRenderer.invoke('db:getUnreadNotificationCount', userId);
       } catch (error) {
         console.error('Preload Error - getUnreadNotificationCount:', error);
         throw error;
       }
     },

     // Mark notification as read
     markNotificationAsRead: async (notificationId) => {
       try {
         return await ipcRenderer.invoke('db:markNotificationAsRead', notificationId);
       } catch (error) {
         console.error('Preload Error - markNotificationAsRead:', error);
         throw error;
       }
     },

     // Mark all notifications as read
     markAllNotificationsAsRead: async (userId = null) => {
       try {
         return await ipcRenderer.invoke('db:markAllNotificationsAsRead', userId);
       } catch (error) {
         console.error('Preload Error - markAllNotificationsAsRead:', error);
         throw error;
       }
     },

     // Delete notification
     deleteNotification: async (notificationId) => {
       try {
         return await ipcRenderer.invoke('db:deleteNotification', notificationId);
       } catch (error) {
         console.error('Preload Error - deleteNotification:', error);
         throw error;
       }
     },

});

console.log('electronAPI exposed successfully');