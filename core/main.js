const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs").promises;
var os = require("os");
var pty = require("node-pty");
var shell = os.platform() === "win32" ? "powershell.exe" : "bash";

// Store terminal instances
const terminals = new Map();


console.log("BASE_DIR: ", __dirname)

// Create a new terminal instance
function createTerminal(id, cwd = process.env.HOME) {
  const term = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd: cwd,
    env: process.env
  });

  terminals.set(id, term);
  return term;
}

let store;

async function initializeStore() {
  const Store = await import("electron-store");
  store = new Store.default({
    name: "friday-ide-config",
    defaults: {
      lastOpenedFile: null,
      expandedDirs: [],
      lastOpenedDir: null,
      selectedTheme: 'vs-dark'
    },
  });
}

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'icons/friday-ide-code.svg'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Load the index.html file
  mainWindow.loadFile("index.html");

  // Open the DevTools in development mode
  mainWindow.webContents.openDevTools();

  // Handle window close event
  mainWindow.on("close", async (e) => {
    e.preventDefault();
    const hasUnsavedChanges = await mainWindow.webContents.executeJavaScript(
      "window.fileExplorer && window.fileExplorer.hasUnsavedChanges()"
    );

    if (hasUnsavedChanges) {
      const choice = dialog.showMessageBoxSync(mainWindow, {
        type: "question",
        buttons: ["Save and Close", "Close Without Saving", "Cancel"],
        title: "Unsaved Changes",
        message:
          "You have unsaved changes. Would you like to save them before closing?",
        defaultId: 0,
        cancelId: 2,
      });

      if (choice === 0) {
        // Save and Close
        try {
          const saveResult = await mainWindow.webContents.executeJavaScript(`
                        (async () => {
                            try {
                                // Show loading dialog
                                const loadingDialog = await window.electronAPI.fileSystem.showMessage({
                                    type: 'info',
                                    title: 'Saving...',
                                    message: 'Saving changes before closing...',
                                    buttons: [],
                                    noLink: true
                                });
                                
                                // Save all modified files
                                await window.fileExplorer.saveAllModifiedFiles();
                                return true;
                            } catch (error) {
                                console.error('Error saving files:', error);
                                return false;
                            }
                        })()
                    `);

          if (saveResult) {
            app.exit(0);
          } else {
            dialog.showMessageBoxSync(mainWindow, {
              type: "error",
              title: "Save Failed",
              message:
                "Failed to save some files. Please try again or close without saving.",
              buttons: ["OK"],
            });
          }
        } catch (error) {
          console.error("Error in save process:", error);
        }
      } else if (choice === 1) {
        // Close Without Saving
        app.exit(0);
      }
      // If choice === 2 (Cancel), do nothing and keep app open
    } else {
      mainWindow.webContents.send("before-close");
      setTimeout(() => app.exit(0), 500);
    }
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  await initializeStore();
  createWindow();
});

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers for file system operations
ipcMain.handle("read-directory", async (_, dirPath) => {
  try {
    const items = await fs.readdir(dirPath);
    const detailedItems = await Promise.all(
      items.map(async (item) => {
        const fullPath = path.join(dirPath, item);
        const stats = await fs.stat(fullPath);
        return {
          name: item,
          path: fullPath,
          isDirectory: stats.isDirectory(),
          size: stats.size,
          modified: stats.mtime,
        };
      })
    );
    return detailedItems;
  } catch (error) {
    console.error("Error reading directory:", error);
    throw error;
  }
});

ipcMain.handle("read-file", async (_, filePath) => {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return content;
  } catch (error) {
    console.error("Error reading file:", error);
    throw error;
  }
});

ipcMain.handle("is-directory", async (_, filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return stats.isDirectory();
  } catch (error) {
    console.error("Error checking if path is directory:", error);
    throw error;
  }
});

ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });

  if (!result.canceled) {
    store.set("lastOpenedDir", result.filePaths[0]);
    return result.filePaths[0];
  }
  return null;
});

// Handle state saving
ipcMain.handle("save-state", async (_, state = {}) => {
  try {
    // Direct save of entire state object
    store.store = state;
    console.log("State saved:", store.store);
    return true;
  } catch (error) {
    console.error("Error saving state:", error);
    return false;
  }
});

// Handle showing messages
ipcMain.handle("show-message", async (_, options) => {
  return dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options);
});

// Handle file saving
ipcMain.handle("save-file", async (_, { filePath, content }) => {
  try {
    await fs.writeFile(filePath, content, "utf-8");
    return true;
  } catch (error) {
    console.error("Error saving file:", error);
    throw error;
  }
});

// Handle getting home directory
ipcMain.handle("get-home-dir", () => {
  return os.homedir();
});

// File creation handlers
ipcMain.handle("create-file", async (_, filePath) => {
  try {
    // Extract directory path
    const dirPath = path.dirname(filePath);
    
    // Create directory if it doesn't exist
    await fs.mkdir(dirPath, { recursive: true });
    
    // Create empty file
    await fs.writeFile(filePath, '');
    
    return { success: true };
  } catch (error) {
    console.error('Error creating file:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("create-folder", async (_, folderPath) => {
  try {
    await fs.mkdir(folderPath, { recursive: true });
    return { success: true };
  } catch (error) {
    console.error('Error creating folder:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("delete-item", async (_, itemPath) => {
  try {
    const stats = await fs.stat(itemPath);
    if (stats.isDirectory()) {
      await fs.rm(itemPath, { recursive: true });
    } else {
      await fs.unlink(itemPath);
    }
    return { success: true };
  } catch (error) {
    console.error('Error deleting item:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("rename-item", async (_, { oldPath, newPath }) => {
  try {
    await fs.rename(oldPath, newPath);
    return { success: true };
  } catch (error) {
    console.error('Error renaming item:', error);
    return { success: false, error: error.message };
  }
});

// New handlers for path operations
ipcMain.handle("path:resolve", (_, ...paths) => {
  return path.resolve(...paths);
});

ipcMain.handle("fileSystem:exists", async (_, filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
});

// Handle state loading
ipcMain.handle("load-state", async () => {
  try {
    // Ensure store is initialized
    if (!store) {
      await initializeStore();
    }

    return {
      lastOpenedFile: store.get("lastOpenedFile", null),
      expandedDirs: store.get("expandedDirs", []),
      lastOpenedDir: store.get("lastOpenedDir", null),
      openedFiles: store.get("openedFiles", []),
      selectedTheme:  store.get("selectedTheme", []),
    };
  } catch (error) {
    console.error("Error loading state:", error);
    return defaultState;
  }
});

// Synchronous state saving
ipcMain.on("save-state", (event) => {
  try {
    const currentState = store.store;
    console.log("Saving state:", currentState);
    event.returnValue = true;
  } catch (error) {
    console.error("Error in sync save:", error);
    event.returnValue = false;
  }
});

// Terminal IPC Handlers
ipcMain.handle('terminal-create', (event, { cwd }) => {
  const id = Date.now().toString();
  const term = createTerminal(id, cwd);
  
  // Handle terminal output
  term.onData((data) => {
    BrowserWindow.getFocusedWindow()?.webContents.send('terminal-data', { id, data });
  });

  return id;
});

ipcMain.handle('terminal-resize', (event, { id, cols, rows }) => {
  const term = terminals.get(id);
  if (term) {
    term.resize(cols, rows);
    return true;
  }
  return false;
});

ipcMain.handle('terminal-write', (event, { id, data }) => {
  const term = terminals.get(id);
  if (term) {
    term.write(data);
    return true;
  }
  return false;
});

ipcMain.handle('terminal-destroy', (event, { id }) => {
  const term = terminals.get(id);
  if (term) {
    term.kill();
    terminals.delete(id);
    return true;
  }
  return false;
});

// Settings management IPC handlers
ipcMain.handle('store:get', async (_, key) => {
  try {
    console.log(`STORE GET [${key}]: `, store)
    return store.get(key);
  } catch (error) {
    console.error('Error getting store value:', error);
    throw error;
  }
});

ipcMain.handle('store:set', async (_, key, value) => {
  try {
    store.set(key, value);
    console.log("STORE SET: ", store)
    return true;
  } catch (error) {
    console.error('Error setting store value:', error);
    throw error;
  }
});

ipcMain.handle('store:clear', async () => {
  try {
    store.clear();
    return true;
  } catch (error) {
    console.error('Error clearing store:', error);
    throw error;
  }
});

// App restart handler
ipcMain.handle('app:restart', async () => {
  app.relaunch();
  app.exit();
});

// Error handling
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error);
});
