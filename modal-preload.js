const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    onSetCapturedText: (callback) => ipcRenderer.on('set-captured-text', callback),
    onSetImprovedText: (callback) => ipcRenderer.on('set-improved-text', callback),
    onSetError: (callback) => ipcRenderer.on('set-error', callback),
    closeWindow: () => ipcRenderer.invoke('close-modal-window')
})