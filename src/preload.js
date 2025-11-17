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

  // ========== INVOICE METHODS ==========
  getAllReleasedBloodInvoices: () => ipcRenderer.invoke('get-all-invoices'),
  searchReleasedBloodInvoices: (searchTerm) => ipcRenderer.invoke('search-invoices', searchTerm),
  viewReleasedBloodInvoice: (invoiceId) => ipcRenderer.invoke('get-invoice-details', invoiceId),
  deleteReleasedBloodInvoices: (invoiceIds) => ipcRenderer.invoke('delete-released-blood-invoices', invoiceIds),
    
  // ========== DISCARDED BLOOD INVOICE METHODS ==========
  getAllDiscardedBloodInvoices: () => ipcRenderer.invoke('getAllDiscardedBloodInvoices'),
  viewDiscardedBloodInvoice: (invoiceId) => ipcRenderer.invoke('viewDiscardedBloodInvoice', invoiceId),
  searchDiscardedBloodInvoices: (searchTerm) => ipcRenderer.invoke('searchDiscardedBloodInvoices', searchTerm),
  deleteDiscardedBloodInvoices: (invoiceIds) => ipcRenderer.invoke('deleteDiscardedBloodInvoices', invoiceIds),

  // ========== BLOOD REPORTS API METHODS ==========
  getAllBloodReports: () => ipcRenderer.invoke('get-all-blood-reports'),
  generateAllQuarterlyReports: (year) => ipcRenderer.invoke('generate-all-quarterly-reports', year),
  deleteReports: (reportIds) => ipcRenderer.invoke('delete-reports', reportIds),
  searchReports: (searchTerm) => ipcRenderer.invoke('search-reports', searchTerm),
  refreshCurrentYearReports: () => ipcRenderer.invoke('refresh-current-year-reports'),
  
  // ========== REPORTS ==========
  generateAllHistoricalReports: () => ipcRenderer.invoke('generate-all-historical-reports'),
  //========== DASHBOARD METHODS ==========
  getAllBloodStock: () => ipcRenderer.invoke('db:getAllBloodStock'),
  getPlasmaStock: () => ipcRenderer.invoke('db:getPlasmaStock'),
  getPlateletStock: () => ipcRenderer.invoke('db:getPlateletStock'),
  getReleasedBloodStock: () => ipcRenderer.invoke('db:getReleasedBloodStock'),
  getReleasedPlasmaStock: () => ipcRenderer.invoke('db:getReleasedPlasmaStock'),
  getReleasedPlateletStock: () => ipcRenderer.invoke('db:getReleasedPlateletStock'),
  getBloodStockHistory: (year) => ipcRenderer.invoke("db:getBloodStockHistory", year),

  // ========== AUTHENTICATION METHODS ==========
  register: async (userData) => {
    try {
      return await ipcRenderer.invoke('auth:register', userData);
    } catch (error) {
      console.error('Preload Error - register:', error);
      throw error;
    }
  },

  login: async (email, password) => {
    try {
      console.log("Preload - Login request for:", email);
      const result = await ipcRenderer.invoke('auth:login', email, password);
      console.log("Preload - Login result:", result);
      
      if (!result) {
        return {
          success: false,
          message: "No response from server"
        };
      }
      
      return result;
    } catch (error) {
      console.error('Preload Error - login:', error);
      return {
        success: false,
        message: error.message || "Login failed"
      };
    }
  },

  verifyUser: async (token) => {
    try {
      console.log('Preload - verifying user with token:', token);
      return await ipcRenderer.invoke('auth:verify', token);
    } catch (error) {
      console.error('Preload Error - verifyUser:', error);
      throw error;
    }
  },

  getPendingUsers: () => ipcRenderer.invoke('get-pending-users'),
  getVerifiedUsers: () => ipcRenderer.invoke('get-verified-users'),
  verifyUserById: (userId) => ipcRenderer.invoke('verify-user-by-id', userId),
  rejectUser: (userId) => ipcRenderer.invoke('reject-user', userId),
  updateUserRole: (userId, newRole) => ipcRenderer.invoke('update-user-role', userId, newRole),
  removeUser: (userId) => ipcRenderer.invoke('remove-user', userId),
  getUserProfileById: (userId) => ipcRenderer.invoke('get-user-profile', userId),
  updateUserProfile: (userId, data) => ipcRenderer.invoke('update-user-profile', userId, data),
  updateUserProfileImage: (userId, image) => ipcRenderer.invoke('update-profile-image', userId, image),

  //=================== USER ACTIVITY LOG METHODS ===================
  getUserActivityLog: (userId, limit, offset) => {
    return ipcRenderer.invoke('get-user-activity-log', userId, limit, offset);
  },
  
  getUserActivityLogCount: (userId) => {
    return ipcRenderer.invoke('get-user-activity-log-count', userId);
  },
  
  logUserActivity: (userId, action, description) => {
    return ipcRenderer.invoke('log-user-activity', userId, action, description);
  },

  updateUserPassword: (userId, currentPassword, newPassword) => 
    ipcRenderer.invoke('update-user-password', userId, currentPassword, newPassword),
  
    
});






console.log('electronAPI exposed successfully');