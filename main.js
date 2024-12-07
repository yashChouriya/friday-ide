const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;

function createWindow() {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js'),
            sandbox: false // Needed for our preload script
        }
    });

    // Load the index.html file
    mainWindow.loadFile('index.html');

    // Open the DevTools in development mode
    mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

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
        return result.filePaths[0];
    }
    return null;
});