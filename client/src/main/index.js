import { app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

const WINDOW_NORMAL_W = 1280;
const WINDOW_NORMAL_H = 900;
const WINDOW_MINI_W = 240;
const WINDOW_MINI_H = 320;

let tray = null;
let mainWindow = null;

function createWindow() {
  // Create the browser window.
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

  // HMR for renderer base on electron-vite cli.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Window control IPC
  ipcMain.on('window:minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.on('window:hide', () => {
    if (mainWindow) mainWindow.hide();
  });

  ipcMain.on('window:set-mini-mode', () => {
    if (mainWindow) {
      mainWindow.setSize(WINDOW_MINI_W, WINDOW_MINI_H);
      mainWindow.setAlwaysOnTop(true, 'floating');
    }
  });

  ipcMain.on('window:set-normal-mode', () => {
    if (mainWindow) {
      mainWindow.setSize(WINDOW_NORMAL_W, WINDOW_NORMAL_H);
      mainWindow.setAlwaysOnTop(false);
      mainWindow.center();
    }
  });

  // Create Tray
  const trayIcon = nativeImage.createFromPath(join(__dirname, '../../resources/icon.png'));
  tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Kkobuk 열기', click: () => { if (mainWindow) mainWindow.show(); } },
    { label: '종료', click: () => { app.quit(); } }
  ]);
  
  tray.setToolTip('Kkobuk - 거북목 예방 알림이');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) mainWindow.show();
  });

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
