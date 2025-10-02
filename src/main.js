import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.commandLine.appendSwitch(
  "disable-features",
  "AutofillEnable,AutofillAddressEnabled,AutofillCreditCardEnabled"
);

// Create the browser window
const createWindow = () => {
  const mainWindow = new BrowserWindow({
    title: "Blood Sync",
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "../../public/assets/Icon.png"),
    autoHideMenuBar: true,
    backgroundColor: "#165c3c",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
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

  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }
};

const setupIpcHandlers = () => {
  const dbService = require(
    path.join(__dirname, "..", "..", "backend", "db.js")
  );

  // ========== RED BLOOD CELL IPC HANDLERS ==========
  ipcMain.handle("db:getAllBloodStock", async () => {
    try {
      return await dbService.getAllBloodStock();
    } catch (error) {
      console.error("IPC Error - getAllBloodStock:", error);
      throw error;
    }
  });

  ipcMain.handle("db:addBloodStock", async (_event, bloodData) => {
    try {
      return await dbService.addBloodStock(bloodData);
    } catch (error) {
      console.error("IPC Error - addBloodStock:", error);
      throw error;
    }
  });

  ipcMain.handle("db:updateBloodStock", async (_event, id, bloodData) => {
    try {
      return await dbService.updateBloodStock(id, bloodData);
    } catch (error) {
      console.error("IPC Error - updateBloodStock:", error);
      throw error;
    }
  });

  ipcMain.handle("db:deleteBloodStock", async (_event, ids) => {
    try {
      return await dbService.deleteBloodStock(ids);
    } catch (error) {
      console.error("IPC Error - deleteBloodStock:", error);
      throw error;
    }
  });

  ipcMain.handle("db:searchBloodStock", async (_event, searchTerm) => {
    try {
      return await dbService.searchBloodStock(searchTerm);
    } catch (error) {
      console.error("IPC Error - searchBloodStock:", error);
      throw error;
    }
  });

  ipcMain.handle("db:getBloodStockBySerialId", async (_event, serialId) => {
    try {
      return await dbService.getBloodStockBySerialId(serialId);
    } catch (error) {
      console.error("IPC Error - getBloodStockBySerialId:", error);
      throw error;
    }
  });

  // ========== RELEASE STOCK IPC HANDLERS ==========
  ipcMain.handle("db:releaseBloodStock", async (_event, releaseData) => {
    try {
      const result = await dbService.releaseBloodStock(releaseData);
      return result;
    } catch (error) {
      console.error("IPC Error - releaseBloodStock:", error);
      throw error;
    }
  });

  ipcMain.handle("db:getReleasedBloodStock", async () => {
    try {
      return await dbService.getReleasedBloodStock();
    } catch (error) {
      console.error("IPC Error - getReleasedBloodStock:", error);
      throw error;
    }
  });

  // ========== PLATELET IPC HANDLERS ==========
  ipcMain.handle("db:getPlateletStock", async () => {
    try {
      return await dbService.getPlateletStock();
    } catch (error) {
      console.error("IPC Error - getPlateletStock:", error);
      throw error;
    }
  });

  ipcMain.handle("db:addPlateletStock", async (_event, plateletData) => {
    try {
      return await dbService.addPlateletStock(plateletData);
    } catch (error) {
      console.error("IPC Error - addPlateletStock:", error);
      throw error;
    }
  });

  ipcMain.handle("db:updatePlateletStock", async (_event, id, plateletData) => {
    try {
      return await dbService.updatePlateletStock(id, plateletData);
    } catch (error) {
      console.error("IPC Error - updatePlateletStock:", error);
      throw error;
    }
  });

  ipcMain.handle("db:deletePlateletStock", async (_event, ids) => {
    try {
      return await dbService.deletePlateletStock(ids);
    } catch (error) {
      console.error("IPC Error - deletePlateletStock:", error);
      throw error;
    }
  });

  ipcMain.handle("db:searchPlateletStock", async (_event, searchTerm) => {
    try {
      return await dbService.searchPlateletStock(searchTerm);
    } catch (error) {
      console.error("IPC Error - searchPlateletStock:", error);
      throw error;
    }
  });

  // Handler for getting platelet stock by serial ID (for release functionality)
ipcMain.handle('db:getPlateletStockBySerialId', async (event, serialId) => {
  try {
    return await dbService.getPlateletStockBySerialId(serialId);
  } catch (error) {
    throw error;
  }
});

// Handler for releasing platelet stock
ipcMain.handle('db:releasePlateletStock', async (event, releaseData) => {
  try {
    return await dbService.releasePlateletStock(releaseData);
  } catch (error) {
    console.error('Error in releasePlateletStock handler:', error);
    throw error;
  }
});

// Handler for getting released platelet stock records
ipcMain.handle('db:getReleasedPlateletStock', async (event) => {
  try {
    return await dbService.getReleasedPlateletStock();
  } catch (error) {
    console.error('Error in getReleasedPlateletStock handler:', error);
    throw error;
  }
});


  // ========== PLASMA IPC HANDLERS ==========
  ipcMain.handle("db:getPlasmaStock", async () => {
    try {
      return await dbService.getPlasmaStock();
    } catch (error) {
      console.error("IPC Error - getPlasmaStock:", error);
      throw error;
    }
  });

  ipcMain.handle("db:addPlasmaStock", async (_event, plasmaData) => {
    try {
      return await dbService.addPlasmaStock(plasmaData);
    } catch (error) {
      console.error("IPC Error - addPlasmaStock:", error);
      throw error;
    }
  });

  ipcMain.handle("db:updatePlasmaStock", async (_event, id, plasmaData) => {
    try {
      return await dbService.updatePlasmaStock(id, plasmaData);
    } catch (error) {
      console.error("IPC Error - updatePlasmaStock:", error);
      throw error;
    }
  });

  ipcMain.handle("db:deletePlasmaStock", async (_event, ids) => {
    try {
      return await dbService.deletePlasmaStock(ids);
    } catch (error) {
      console.error("IPC Error - deletePlasmaStock:", error);
      throw error;
    }
  });

  ipcMain.handle("db:searchPlasmaStock", async (_event, searchTerm) => {
    try {
      return await dbService.searchPlasmaStock(searchTerm);
    } catch (error) {
      console.error("IPC Error - searchPlasmaStock:", error);
      throw error;
    }
  });


// Add these to your existing PLASMA IPC HANDLERS section in main.js
ipcMain.handle("db:releasePlasmaStock", async (_event, releaseData) => {
  try {
    const result = await dbService.releasePlasmaStock(releaseData);
    return result;
  } catch (error) {
    console.error("IPC Error - releasePlasmaStock:", error);
    throw error;
  }
});

ipcMain.handle("db:getReleasedPlasmaStock", async () => {
  try {
    return await dbService.getReleasedPlasmaStock();
  } catch (error) {
    console.error("IPC Error - getReleasedPlasmaStock:", error);
    throw error;
  }
});

ipcMain.handle("db:getPlasmaStockBySerialId", async (_event, serialId) => {
  try {
    return await dbService.getPlasmaStockBySerialId(serialId);
  } catch (error) {
    console.error("IPC Error - getPlasmaStockBySerialId:", error);
    throw error;
  }
});

  // ========== USER AUTHENTICATION IPC HANDLERS ==========
  ipcMain.handle("db:registerUser", async (_event, userData) => {
    try {
      return await dbService.registerUser(userData);
    } catch (error) {
      console.error("IPC Error - registerUser:", error);
      throw error;
    }
  });

  ipcMain.handle("db:loginUser", async (_event, email, password) => {
    try {
      return await dbService.loginUser(email, password);
    } catch (error) {
      console.error("IPC Error - loginUser:", error);
      throw error;
    }
  });

  ipcMain.handle("db:generatePasswordResetToken", async (_event, email) => {
    try {
      return await dbService.generatePasswordResetToken(email);
    } catch (error) {
      console.error("IPC Error - generatePasswordResetToken:", error);
      throw error;
    }
  });

  ipcMain.handle("db:resetPassword", async (_event, email, resetToken, newPassword) => {
    try {
      return await dbService.resetPassword(email, resetToken, newPassword);
    } catch (error) {
      console.error("IPC Error - resetPassword:", error);
      throw error;
    }
  });

  ipcMain.handle("db:activateUserByToken", async (_event, token) => {
    try {
      return await dbService.activateUserByToken(token);
    } catch (error) {
      console.error("IPC Error - activateUserByToken:", error);
      throw error;
    }
  });
};

// Electron app lifecycle
if (started) app.quit();

app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
