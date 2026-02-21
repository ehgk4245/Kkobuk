import { contextBridge, ipcRenderer } from 'electron'

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', {
      windowControl: {
        minimize: () => ipcRenderer.send('window:minimize'),
        hide: () => ipcRenderer.send('window:hide'),
        setMiniMode: () => ipcRenderer.send('window:set-mini-mode'),
        setNormalMode: () => ipcRenderer.send('window:set-normal-mode')
      },
      auth: {
        login: (provider) => ipcRenderer.send('auth:login', provider),
        onCallback: (callback) => {
          ipcRenderer.on('auth:callback', (_event, tokens) => callback(tokens))
        },
        removeCallbackListener: () => {
          ipcRenderer.removeAllListeners('auth:callback')
        }
      }
    })
  } catch (error) {
    console.error(error)
  }
}
