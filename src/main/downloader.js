// Sistema de download integrado: baixa um .zip (port/recomp) com barra de
// progresso, extrai e registra na biblioteca automaticamente.

import fs from 'fs'
import path from 'path'
import https from 'https'
import http from 'http'
import { app } from 'electron'
import extractZip from 'extract-zip'
import { scanFolder } from './scanner.js'
import { load, save } from './store.js'

const DOWNLOAD_DIR = path.join(app.getPath('downloads'), 'PortVault')

function ensureDownloadDir() {
  if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true })
}

// Baixa um arquivo com progresso. onProgress recebe { received, total, percent }
function downloadFile(url, destPath, onProgress) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http

    const request = mod.get(url, (res) => {
      // Segue redirecionamentos (muito comum em links de download)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, destPath, onProgress).then(resolve, reject)
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Servidor respondeu ${res.statusCode}`))
      }

      const total = parseInt(res.headers['content-length'] || '0', 10)
      let received = 0

      const file = fs.createWriteStream(destPath)
      res.on('data', (chunk) => {
        received += chunk.length
        if (onProgress) {
          onProgress({
            received,
            total,
            percent: total ? Math.round((received / total) * 100) : 0
          })
        }
      })

      res.pipe(file)
      file.on('finish', () => file.close(resolve))
      file.on('error', reject)
    })

    request.on('error', reject)
  })
}

/**
 * Fluxo completo: baixa o zip, extrai numa pasta e adiciona os .exe
 * encontrados na biblioteca. onProgress recebe updates de status.
 */
export async function downloadAndInstall(url, onProgress) {
  ensureDownloadDir()

  const fileName = decodeURIComponent(new URL(url).pathname.split('/').pop() || 'jogo.zip')
  const safeName = fileName.replace(/[<>:"/\\|?*]/g, '_')
  const zipPath = path.join(DOWNLOAD_DIR, safeName)
  const gameName = path.basename(safeName, path.extname(safeName))
  const extractDir = path.join(DOWNLOAD_DIR, gameName)

  onProgress?.({ stage: 'baixando', fileName: safeName, percent: 0 })

  await downloadFile(url, zipPath, (p) =>
    onProgress?.({ stage: 'baixando', fileName: safeName, ...p })
  )

  // Extrai o zip se for .zip; senão, é um exe avulso
  if (safeName.toLowerCase().endsWith('.zip')) {
    onProgress?.({ stage: 'extraindo', fileName: safeName, percent: 100 })
    if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true, force: true })
    await extractZip(zipPath, { dir: extractDir })
    fs.unlinkSync(zipPath) // limpa o zip depois de extrair
  }

  // Procura executáveis dentro do que foi baixado
  onProgress?.({ stage: 'registrando', fileName: safeName, percent: 100 })
  const found = fs.existsSync(extractDir) ? scanFolder(extractDir, 4) : []
  const data = load()
  let added = 0

  for (const g of found) {
    if (!data.games.some((x) => x.exePath === g.exePath)) {
      data.games.push({ ...g, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), addedAt: new Date().toISOString(), source: 'download' })
      added++
    }
  }
  save(data)

  onProgress?.({ stage: 'concluido', fileName: safeName, percent: 100, added })
  return { added, extractDir }
}

export { DOWNLOAD_DIR }
