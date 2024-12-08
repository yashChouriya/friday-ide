const { contextBridge, ipcRenderer, shell } = require('electron');
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
// Store API for settings and app state
const storeApi = {
    get: (key) => ipcRenderer.invoke('store:get', key),
    set: (key, value) => ipcRenderer.invoke('store:set', key, value),
    clear: () => ipcRenderer.invoke('store:clear'),
};

// App control API
const appApi = {
    restart: () => ipcRenderer.invoke('app:restart'),
};

contextBridge.exposeInMainWorld('electronAPI', {
    store: storeApi,
    app: appApi,
    // File system operations
    path: {
        basename: path.basename,
        dirname: path.dirname,
        join: path.join,
        getHomeDir: () => ipcRenderer.invoke('get-home-dir')
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
        create: (cwd) => ipcRenderer.invoke('terminal-create', { cwd }),
        resize: (id, cols, rows) => ipcRenderer.invoke('terminal-resize', { id, cols, rows }),
        write: (id, data) => ipcRenderer.invoke('terminal-write', { id, data }),
        destroy: (id) => ipcRenderer.invoke('terminal-destroy', { id }),
        onData: (callback) => {
            const subscription = (event, data) => callback(data);
            ipcRenderer.on('terminal-data', subscription);
            return () => ipcRenderer.removeListener('terminal-data', subscription);
        }
    },
    // Shell operations for opening external links
    shell: {
        openExternal: async (url) => {
            try {
                // Basic URL validation
                const urlObj = new URL(url);
                if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
                    await shell.openExternal(url);
                } else {
                    console.warn('Blocked attempt to open non-http(s) URL:', url);
                }
            } catch (error) {
                console.error('Failed to open URL:', error);
            }
        }
    }
});