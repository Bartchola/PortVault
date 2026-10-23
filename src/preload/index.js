// A ponte segura: expõe funções do "cérebro" para a interface usar.
// A interface NÃO tem acesso direto ao Node.js (isso é importante por segurança).
//
// Também em ESM, pelo mesmo motivo do processo principal: o bundler precisa
// seguir os `require`/`import` pra juntar tudo num arquivo só.

import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // Biblioteca
  listGames: () => ipcRenderer.invoke('library:list'),
  addGameManual: () => ipcRenderer.invoke('library:addManual'),
  removeGame: (id) => ipcRenderer.invoke('library:remove', id),
  launchGame: (id) => ipcRenderer.invoke('library:launch', id),
  openGameFolder: (id) => ipcRenderer.invoke('library:openFolder', id),

  // Pastas monitoradas
  listFolders: () => ipcRenderer.invoke('folders:list'),
  addFolder: () => ipcRenderer.invoke('folders:add'),
  removeFolder: (folder) => ipcRenderer.invoke('folders:remove', folder),
  scanFolders: () => ipcRenderer.invoke('folders:scan'),

  // Downloads
  startDownload: (url) => ipcRenderer.invoke('downloads:start', url),
  onDownloadProgress: (callback) => {
    ipcRenderer.on('downloads:progress', (_e, data) => callback(data))
  },

  // Conquistas
  listAchievements: () => ipcRenderer.invoke('achievements:list'),
  addAchievement: (gameId, payload) => ipcRenderer.invoke('achievements:add', gameId, payload),
  removeAchievement: (gameId, achId) => ipcRenderer.invoke('achievements:remove', gameId, achId),
  toggleAchievement: (gameId, achId) => ipcRenderer.invoke('achievements:toggle', gameId, achId),

  // Versão e atualizações
  getVersion: () => ipcRenderer.invoke('app:version'),
  checkForUpdates: () => ipcRenderer.invoke('updates:check'),
  openReleasePage: () => ipcRenderer.invoke('updates:open')
})
