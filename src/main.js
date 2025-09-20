import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

app.commandLine.appendSwitch(
  'disable-features',
  'AutofillEnable,AutofillAddressEnabled,AutofillCreditCardEnabled'
);

// Create the browser window
const createWindow = () => {
  const mainWindow = new BrowserWindow({
    title: 'Blood Sync',
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '../../public/assets/Icon.png'),
    autoHideMenuBar: true,
    backgroundColor: '#165c3c',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
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

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
};

const setupIpcHandlers = () => {
  const dbService = require(path.join(__dirname, '..', '..', 'backend', 'db.js'));

  // ========== RED BLOOD CELL IPC HANDLERS ==========
  ipcMain.handle('db:getAllBloodStock', async () => {
    return await dbService.getAllBloodStock();
  });

  ipcMain.handle('db:addBloodStock', async (_event, bloodData) => {
    return await dbService.addBloodStock(bloodData);
  });

  ipcMain.handle('db:updateBloodStock', async (_event, id, bloodData) => {
    return await dbService.updateBloodStock(id, bloodData);
  });

  ipcMain.handle('db:deleteBloodStock', async (_event, ids) => {
    return await dbService.deleteBloodStock(ids);
  });

  ipcMain.handle('db:searchBloodStock', async (_event, searchTerm) => {
    return await dbService.searchBloodStock(searchTerm);
  });

  // ========== PLATELET IPC HANDLERS ==========
  ipcMain.handle('db:getPlateletStock', async () => {
    return await dbService.getPlateletStock();
  });

  ipcMain.handle('db:addPlateletStock', async (_event, plateletData) => {
    return await dbService.addPlateletStock(plateletData);
  });

  ipcMain.handle('db:updatePlateletStock', async (_event, id, plateletData) => {
    return await dbService.updatePlateletStock(id, plateletData);
  });

  ipcMain.handle('db:deletePlateletStock', async (_event, ids) => {
    return await dbService.deletePlateletStock(ids);
  });

  ipcMain.handle('db:searchPlateletStock', async (_event, searchTerm) => {
    return await dbService.searchPlateletStock(searchTerm);
  });

  // ========== PLASMA IPC HANDLERS ==========
  ipcMain.handle('db:getPlasmaStock', async () => {
    return await dbService.getPlasmaStock();
  });

  ipcMain.handle('db:addPlasmaStock', async (_event, plasmaData) => {
    return await dbService.addPlasmaStock(plasmaData);
  });

  ipcMain.handle('db:updatePlasmaStock', async (_event, id, plasmaData) => {
    return await dbService.updatePlasmaStock(id, plasmaData);
  });

  ipcMain.handle('db:deletePlasmaStock', async (_event, ids) => {
    return await dbService.deletePlasmaStock(ids);
  });

  ipcMain.handle('db:searchPlasmaStock', async (_event, searchTerm) => {
    return await dbService.searchPlasmaStock(searchTerm);
  });
};

// Electron app lifecycle
if (started) app.quit();

app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});