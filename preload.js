const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    saveApiKeys: (keys, instruction) => ipcRenderer.invoke('save-api-keys', keys, instruction),
    loadApiKeys: () => ipcRenderer.invoke('load-api-keys')
})