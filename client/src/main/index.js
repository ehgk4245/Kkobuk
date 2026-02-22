import { app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

const WINDOW_NORMAL_W = 1280
const WINDOW_NORMAL_H = 900
const WINDOW_MINI_W = 240
const WINDOW_MINI_H = 320

const PROTOCOL = 'kkobuk'
const API_BASE = import.meta.env.VITE_API_BASE_URL

let tray = null
let mainWindow = null

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, commandLine) => {
    const url = commandLine.find((arg) => arg.startsWith(`${PROTOCOL}://`))
    if (url) handleDeepLink(url)

    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

function handleDeepLink(url) {
  const parsed = new URL(url)
  if (parsed.hostname === 'callback') {
    const accessToken = parsed.searchParams.get('accessToken')
    const refreshToken = parsed.searchParams.get('refreshToken')

    if (mainWindow && accessToken && refreshToken) {
      mainWindow.webContents.send('auth:callback', { accessToken, refreshToken })
    }
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: WINDOW_NORMAL_W,
    height: WINDOW_NORMAL_H,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  // Windows 개발 모드: electron.exe가 앱 경로 없이 URL만 받는 문제 방지
  if (is.dev) {
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [app.getAppPath()])
  } else if (!app.isDefaultProtocolClient(PROTOCOL)) {
    app.setAsDefaultProtocolClient(PROTOCOL)
  }

  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.on('window:minimize', () => {
    if (mainWindow) mainWindow.minimize()
  })

  ipcMain.on('window:hide', () => {
    if (mainWindow) mainWindow.hide()
  })

  ipcMain.on('window:set-mini-mode', () => {
    if (mainWindow) {
      mainWindow.setSize(WINDOW_MINI_W, WINDOW_MINI_H)
      mainWindow.setAlwaysOnTop(true, 'floating')
    }
  })

  ipcMain.on('window:set-normal-mode', () => {
    if (mainWindow) {
      mainWindow.setSize(WINDOW_NORMAL_W, WINDOW_NORMAL_H)
      mainWindow.setAlwaysOnTop(false)
      mainWindow.center()
    }
  })

  ipcMain.on('auth:login', (_event, provider) => {
    shell.openExternal(`${API_BASE}/oauth2/authorization/${provider}`)
  })

  const trayIcon = nativeImage.createFromPath(join(__dirname, '../../resources/icon.png'))
  tray = new Tray(trayIcon.resize({ width: 16, height: 16 }))

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Kkobuk 열기',
      click: () => {
        if (mainWindow) mainWindow.show()
      }
    },
    {
      label: '종료',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setToolTip('Kkobuk - 거북목 예방 알림이')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    if (mainWindow) mainWindow.show()
  })

  createWindow()

  app.on('open-url', (_event, url) => {
    handleDeepLink(url)
  })

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
