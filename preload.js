const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

// Expose file system operations to renderer process
contextBridge.exposeInMainWorld('path', {
    basename: path.basename,
    dirname: path.dirname,
    join: path.join
});
contextBridge.exposeInMainWorld('fileSystem', {
    readDirectory: (path) => ipcRenderer.invoke('read-directory', path),
    readFile: (path) => ipcRenderer.invoke('read-file', path),
    isDirectory: (path) => ipcRenderer.invoke('is-directory', path),
    selectFolder: () => ipcRenderer.invoke('select-folder')
});