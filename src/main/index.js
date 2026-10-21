// Ponto de entrada do Electron. Cria a janela e conecta tudo via IPC
// (a ponte de mensagens entre o "cérebro" e a interface).

const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const { load, save } = require('./store')
const { scanFolder } = require('./scanner')
const { launchGame, openGameFolder } = require('./launcher')
const { downloadAndInstall } = require('./downloader')

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0d0f14',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL) // modo dev
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html')) // build
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ---------- IPC: biblioteca ----------

ipcMain.handle('library:list', () => load().games)

ipcMain.handle('library:addManual', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Escolha o executável do jogo',
    filters: [{ name: 'Executáveis', extensions: ['exe'] }],
    properties: ['openFile']
  })
  if (result.canceled || !result.filePaths[0]) return null

  const exePath = result.filePaths[0]
  const data = load()
  const name = path.basename(exePath, path.extname(exePath))
  if (!data.games.some((g) => g.exePath === exePath)) {
    data.games.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, exePath, coverPath: null, addedAt: new Date().toISOString(), source: 'manual' })
    save(data)
  }
  return data.games
})

ipcMain.handle('library:remove', (_e, id) => {
  const data = load()
  data.games = data.games.filter((g) => g.id !== id)
  save(data)
  return data.games
})

ipcMain.handle('library:launch', (_e, id) => {
  const game = load().games.find((g) => g.id === id)
  if (!game) throw new Error('Jogo não encontrado')
  return launchGame(game)
})

ipcMain.handle('library:openFolder', (_e, id) => {
  const game = load().games.find((g) => g.id === id)
  if (game) openGameFolder(game)
})

// ---------- IPC: pastas monitoradas ----------

ipcMain.handle('folders:list', () => load().folders)

ipcMain.handle('folders:add', async () => {
  const result = await dialog.showOpenDialog({ title: 'Escolha a pasta dos seus jogos', properties: ['openDirectory'] })
  if (result.canceled || !result.filePaths[0]) return load().folders
  const data = load()
  if (!data.folders.includes(result.filePaths[0])) data.folders.push(result.filePaths[0])
  save(data)
  return data.folders
})

ipcMain.handle('folders:remove', (_e, folder) => {
  const data = load()
  data.folders = data.folders.filter((f) => f !== folder)
  save(data)
  return data.folders
})

// Escaneia todas as pastas monitoradas e adiciona jogos novos na biblioteca
ipcMain.handle('folders:scan', () => {
  const data = load()
  let added = 0
  for (const folder of data.folders) {
    for (const game of scanFolder(folder)) {
      if (!data.games.some((g) => g.exePath === game.exePath)) {
        data.games.push({ ...game, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), addedAt: new Date().toISOString(), source: 'scan' })
        added++
      }
    }
  }
  save(data)
  return { games: data.games, added }
})

// ---------- IPC: downloads ----------

ipcMain.handle('downloads:start', async (_e, url) => {
  try {
    const result = await downloadAndInstall(url, (progress) => {
      BrowserWindow.getAllWindows()[0]?.webContents.send('downloads:progress', progress)
    })
    return { ok: true, ...result }
  } catch (err) {
    return { ok: false, error: err.message }
  }
})
