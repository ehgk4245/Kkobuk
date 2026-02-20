import { contextBridge, ipcRenderer } from 'electron'

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', {
      windowControl: {
        minimize: () => ipcRenderer.send('window:minimize'),
        hide: () => ipcRenderer.send('window:hide'),
        setMiniMode: () => ipcRenderer.send('window:set-mini-mode'),
        setNormalMode: () => ipcRenderer.send('window:set-normal-mode')
      }
    })
  } catch (error) {
    console.error(error)
  }
}
