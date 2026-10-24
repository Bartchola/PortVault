// Atualização automática do launcher usando o electron-updater.
//
// Diferente do esqueto anterior (que só abria a página no navegador), aqui o
// próprio launcher baixa a nova versão com barra de progresso e instala em
// segundo plano (modo silencioso), sem abrir o instalador na tela.
//
// Como funciona por baixo:
// - O electron-builder gera um "latest.yml" (metadado da versão) que sobe na
//   Release junto dos .exe.
// - O app instalado tem um "app-update.yml" apontando pro repositório.
// - O updater compara as versões, baixa (com download diferencial quando
//   possível, usando os .blockmap) e roda o instalador com `/S` (silencioso).

import { app, BrowserWindow, shell } from 'electron'
import { autoUpdater } from 'electron-updater'

const OWNER = 'Bartchola'
const REPO = 'PortVault'
const RELEASES_URL = `https://github.com/${OWNER}/${REPO}/releases`

// Baixa só quando o usuário pedir (assim mostramos a barra de progresso
// em vez de baixar 80 MB sem avisar).
autoUpdater.autoDownload = false
// A instalação é feita de forma explícita ao clicar em "Atualizar"
// (não esperamos o usuário fechar o app).
autoUpdater.autoInstallOnAppQuit = false

// Envia uma mensagem para a interface (janela principal)
function send(channel, payload) {
  BrowserWindow.getAllWindows()[0]?.webContents.send(channel, payload)
}

// Repassa os eventos do updater para a interface reagir (barra, sucesso, erro)
autoUpdater.on('download-progress', (p) => send('updater:progress', p))
autoUpdater.on('update-downloaded', (info) => send('updater:downloaded', info))
autoUpdater.on('error', (err) => send('updater:error', err?.message || String(err)))

/**
 * Verifica se existe uma versão mais nova no GitHub.
 * Retorna { ok, hasUpdate, currentVersion, latestVersion, url }.
 */
export function checkForUpdates() {
  const currentVersion = app.getVersion()

  // Em desenvolvimento não existe o app-update.yml (só no app empacotado),
  // então evitamos um erro confuso e apenas dizemos "sem atualização".
  if (!app.isPackaged) {
    return Promise.resolve({ ok: true, hasUpdate: false, currentVersion, latestVersion: currentVersion, dev: true })
  }

  return new Promise((resolve) => {
    let done = false
    const finish = (result) => {
      if (done) return
      done = true
      autoUpdater.off('update-available', onAvailable)
      autoUpdater.off('update-not-available', onNotAvailable)
      autoUpdater.off('error', onError)
      resolve(result)
    }
    const onAvailable = (info) => finish({ ok: true, hasUpdate: true, currentVersion, latestVersion: info.version, url: RELEASES_URL })
    const onNotAvailable = () => finish({ ok: true, hasUpdate: false, currentVersion, latestVersion: currentVersion, url: RELEASES_URL })
    const onError = (err) => finish({ ok: false, error: err?.message || String(err), currentVersion })

    autoUpdater.on('update-available', onAvailable)
    autoUpdater.on('update-not-available', onNotAvailable)
    autoUpdater.on('error', onError)

    autoUpdater.checkForUpdates().catch((err) => finish({ ok: false, error: err?.message || String(err), currentVersion }))
  })
}

/**
 * Inicia o download da nova versão. O progresso chega na interface pelo
 * evento 'updater:progress' e o término pelo 'updater:downloaded'.
 */
export async function downloadUpdate() {
  try {
    await autoUpdater.downloadUpdate()
  } catch (err) {
    send('updater:error', err?.message || String(err))
    throw err
  }
}

/**
 * Instala a versão já baixada de forma silenciosa e reabre o app atualizado.
 * `quitAndInstall(silencioso, reabrirDepois)` — com silencioso=true o
 * instalador roda com `/S` sem mostrar janela.
 */
export function installUpdate() {
  autoUpdater.quitAndInstall(true, true)
}

// Abre a página de releases no navegador (usado no "Ver no GitHub")
export function openReleasePage() {
  return shell.openExternal(RELEASES_URL)
}
