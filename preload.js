const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

// Listen for window close event
ipcRenderer.on('before-close', () => {
    // Synchronously save state
    ipcRenderer.sendSync('save-state');
});

// Configure Monaco's base path
const appPath = __dirname;
const monacoPath = path.join(appPath, 'node_modules/monaco-editor/min/vs');

// Expose necessary APIs to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // File system operations
    path: {
        basename: path.basename,
        dirname: path.dirname,
        join: path.join
    },
    fileSystem: {
        readDirectory: (path) => ipcRenderer.invoke('read-directory', path),
        readFile: (path) => ipcRenderer.invoke('read-file', path),
        isDirectory: (path) => ipcRenderer.invoke('is-directory', path),
        selectFolder: () => ipcRenderer.invoke('select-folder'),
        saveState: (state) => ipcRenderer.invoke('save-state', state),
        loadState: () => ipcRenderer.invoke('load-state'),
    saveFile: (filePath, content) => ipcRenderer.invoke('save-file', { filePath, content }),
    showMessage: (options) => ipcRenderer.invoke('show-message', options)
    },
    // Monaco environment configuration
    monacoEnv: {
        getBasePath: () => 'node_modules/monaco-editor/min',
        getWorkerPath: () => './node_modules/monaco-editor/min/vs/base/worker/workerMain.js'
    },
    // Terminal operations
    terminal: {
        create: () => ipcRenderer.invoke('terminal-create'),
        resize: (id, cols, rows) => ipcRenderer.invoke('terminal-resize', { id, cols, rows }),
        write: (id, data) => ipcRenderer.invoke('terminal-write', { id, data }),
        destroy: (id) => ipcRenderer.invoke('terminal-destroy', { id }),
        onData: (callback) => {
            const subscription = (event, data) => callback(data);
            ipcRenderer.on('terminal-data', subscription);
            return () => ipcRenderer.removeListener('terminal-data', subscription);
        }
    }
});