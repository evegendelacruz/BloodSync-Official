const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script loading...');

contextBridge.exposeInMainWorld('electronAPI', {
  test: () => 'API Working!',
  
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

  // Add these methods to your electronAPI object in preload.js

// Add these to your existing PLASMA METHODS section in preload.js
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