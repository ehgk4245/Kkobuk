import { contextBridge } from 'electron'

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', {})
  } catch (error) {
    console.error(error)
  }
}
