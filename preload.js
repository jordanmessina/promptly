const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    saveApiKeys: (keys, instruction) => ipcRenderer.invoke('save-api-keys', keys, instruction),
    saveSystemPrompt: (systemPrompt) => ipcRenderer.invoke('save-system-prompt', systemPrompt),
    getDefaultPrompt: () => ipcRenderer.invoke('get-default-prompt'),
    loadApiKeys: () => ipcRenderer.invoke('load-api-keys')
})