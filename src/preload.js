const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script loading...');

contextBridge.exposeInMainWorld('electronAPI', {
  test: () => 'API Working!',
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
});

console.log('electronAPI exposed successfully');