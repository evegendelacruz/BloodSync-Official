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
  getAllAppointments: async () => {
    try {
      return await ipcRenderer.invoke('db:getAllAppointments');
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
  
  // ========== RELEASE STOCK METHODS ==========
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

  loginUser: async (email, password) => {
    try {
      return await ipcRenderer.invoke('db:loginUser', email, password);
    } catch (error) {
      console.error('Preload Error - loginUser:', error);
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

  activateUserByToken: async (token) => {
    try {
      return await ipcRenderer.invoke('db:activateUserByToken', token);
    } catch (error) {
      console.error('Preload Error - activateUserByToken:', error);
      throw error;
    }
  },
});

console.log('electronAPI exposed successfully');