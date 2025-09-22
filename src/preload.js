const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script loading...');

contextBridge.exposeInMainWorld('electronAPI', {
  test: () => 'API Working!',
  
  // ========== RED BLOOD CELL METHODS ==========
  getAllBloodStock: async () => {
    return await ipcRenderer.invoke('db:getAllBloodStock');
  },
  addBloodStock: async (bloodData) => {
    return await ipcRenderer.invoke('db:addBloodStock', bloodData);
  },
  updateBloodStock: async (id, bloodData) => {
    return await ipcRenderer.invoke('db:updateBloodStock', id, bloodData);
  },
  deleteBloodStock: async (ids) => {
    return await ipcRenderer.invoke('db:deleteBloodStock', ids);
  },
  searchBloodStock: async (searchTerm) => {
    return await ipcRenderer.invoke('db:searchBloodStock', searchTerm);
  },
  

  // ========== PLATELET METHODS ==========
  getPlateletStock: async () => {
    return await ipcRenderer.invoke('db:getPlateletStock');
  },
  addPlateletStock: async (plateletData) => {
    return await ipcRenderer.invoke('db:addPlateletStock', plateletData);
  },
  updatePlateletStock: async (id, plateletData) => {
    return await ipcRenderer.invoke('db:updatePlateletStock', id, plateletData);
  },
  deletePlateletStock: async (ids) => {
    return await ipcRenderer.invoke('db:deletePlateletStock', ids);
  },
  searchPlateletStock: async (searchTerm) => {
    return await ipcRenderer.invoke('db:searchPlateletStock', searchTerm);
  },

  // ========== PLASMA METHODS ==========
  getPlasmaStock: async () => {
    return await ipcRenderer.invoke('db:getPlasmaStock');
  },
  addPlasmaStock: async (plasmaData) => {
    return await ipcRenderer.invoke('db:addPlasmaStock', plasmaData);
  },
  updatePlasmaStock: async (id, plasmaData) => {
    return await ipcRenderer.invoke('db:updatePlasmaStock', id, plasmaData);
  },
  deletePlasmaStock: async (ids) => {
    return await ipcRenderer.invoke('db:deletePlasmaStock', ids);
  },
  searchPlasmaStock: async (searchTerm) => {
    return await ipcRenderer.invoke('db:searchPlasmaStock', searchTerm);
  },
});

console.log('electronAPI exposed successfully');