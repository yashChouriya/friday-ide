const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let store;

async function initializeStore() {
    const Store = await import('electron-store');
    store = new Store.default({
        name: 'friday-ide-config',
        defaults: {
            lastOpenedFile: null,
            expandedDirs: [],
            lastOpenedDir: null
        }
    });
}

function createWindow() {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Load the index.html file
    mainWindow.loadFile('index.html');

    // Open the DevTools in development mode
    mainWindow.webContents.openDevTools();

    // Handle window close event
    mainWindow.on('close', async (e) => {
        e.preventDefault();
        mainWindow.webContents.send('before-close');
        // Give some time for state to be saved
        setTimeout(() => {
            app.exit(0);
        }, 500);
    });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
    await initializeStore();
    createWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// IPC Handlers for file system operations
ipcMain.handle('read-directory', async (_, dirPath) => {
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
                    modified: stats.mtime
                };
            })
        );
        return detailedItems;
    } catch (error) {
        console.error('Error reading directory:', error);
        throw error;
    }
});

ipcMain.handle('read-file', async (_, filePath) => {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return content;
    } catch (error) {
        console.error('Error reading file:', error);
        throw error;
    }
});

ipcMain.handle('is-directory', async (_, filePath) => {
    try {
        const stats = await fs.stat(filePath);
        return stats.isDirectory();
    } catch (error) {
        console.error('Error checking if path is directory:', error);
        throw error;
    }
});

ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });
    
    if (!result.canceled) {
        store.set('lastOpenedDir', result.filePaths[0]);
        return result.filePaths[0];
    }
    return null;
});

// Handle state saving
ipcMain.handle('save-state', async (_, state = {}) => {
    try {
        // Direct save of entire state object
        store.store = state;
        console.log('State saved:', store.store);
        return true;
    } catch (error) {
        console.error('Error saving state:', error);
        return false;
    }
});

// Handle state loading
ipcMain.handle('load-state', async () => {
    try {
        const defaultState = {
            lastOpenedFile: null,
            expandedDirs: [],
            lastOpenedDir: null,
            openedFiles: []
        };

        // Ensure store is initialized
        if (!store) {
            await initializeStore();
        }

        return {
            lastOpenedFile: store.get('lastOpenedFile', null),
            expandedDirs: store.get('expandedDirs', []),
            lastOpenedDir: store.get('lastOpenedDir', null),
            openedFiles: store.get('openedFiles', [])
        };
    } catch (error) {
        console.error('Error loading state:', error);
        return defaultState;
    }
});

// Synchronous state saving
ipcMain.on('save-state', (event) => {
    try {
        const currentState = store.store;
        console.log('Saving state:', currentState);
        event.returnValue = true;
    } catch (error) {
        console.error('Error in sync save:', error);
        event.returnValue = false;
    }
});

// Error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});