// Varre pastas em busca de executáveis de jogo (ports e recomps baixados).
// Muitos ports são um .zip que, ao extrair, vira uma pasta com o .exe do jogo.

import fs from 'fs'
import path from 'path'

// Nomes de executáveis que NÃO são jogos (instaladores, launchers internos etc.)
const IGNORED_EXE = [
  'unins000', 'uninstall', 'setup', 'install', 'vcredist', 'dxsetup',
  'unitycrashhandler', 'crashreporter', 'ue4prereq', 'dotnet',
  'oalinst', 'ndp', 'vc_redist'
]

// Pastas que não valem a pena escanear
const IGNORED_DIRS = [
  '$recycle.bin', 'system volume information', '__pycache__', 'node_modules',
  '.git', 'redist', '_commonredist', 'directx', 'vcredist', 'dotnet'
]

function isIgnoredExe(name) {
  const base = path.basename(name, path.extname(name)).toLowerCase()
  return IGNORED_EXE.some((i) => base.startsWith(i))
}

/**
 * Escaneia uma pasta (até `maxDepth` níveis de profundidade) e retorna
 * os executáveis que parecem ser jogos.
 * Retorna: [{ name, exePath, coverPath }]
 */
export function scanFolder(root, maxDepth = 3) {
  const results = []

  // Procura também uma imagem de capa ao lado do exe (folder.png, cover.png, etc.)
  function findCover(exePath) {
    const dir = path.dirname(exePath)
    const candidates = ['folder.png', 'cover.png', 'poster.png', 'logo.png', 'icon.png', 'cover.jpg']
    for (const c of candidates) {
      const p = path.join(dir, c)
      if (fs.existsSync(p)) return p
    }
    return null
  }

  function walk(dir, depth) {
    if (depth > maxDepth) return
    let entries
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return // sem permissão ou pasta inacessível: ignora
    }

    for (const entry of entries) {
      const full = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        if (IGNORED_DIRS.includes(entry.name.toLowerCase())) continue
        walk(full, depth + 1)
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.exe')) {
        if (isIgnoredExe(entry.name)) continue
        results.push({
          name: path.basename(entry.name, path.extname(entry.name)),
          exePath: full,
          coverPath: findCover(full)
        })
      }
    }
  }

  walk(root, 0)
  return results
}
