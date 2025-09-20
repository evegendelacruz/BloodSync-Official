import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ❌  Removed the old top-level require of services/db.js
//     We'll load db.js later from ../backend

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
  // ✅ go two levels up to reach <project-root>/backend/db.js
  const dbService = require(path.join(__dirname, '..', '..', 'backend', 'db.js'));

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
