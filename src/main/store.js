// Armazenamento simples em JSON dentro da pasta de dados do usuário.
// Guarda: pastas monitoradas, biblioteca de jogos e histórico de downloads.
// Em versões futuras isso pode virar SQLite sem mudar o resto do app.

const path = require('path')
const fs = require('fs')
const { app } = require('electron')

const DATA_DIR = path.join(app.getPath('userData'), 'portvault')
const DATA_FILE = path.join(DATA_DIR, 'library.json')

const DEFAULT_DATA = {
  // Pastas que o usuário escolheu para escanear em busca de jogos
  folders: [],
  // Jogos encontrados/adicionados: { id, name, exePath, coverPath?, addedAt }
  games: [],
  // Downloads feitos pelo launcher
  downloads: []
}

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

function load() {
  try {
    return { ...DEFAULT_DATA, ...JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) }
  } catch {
    return { ...DEFAULT_DATA }
  }
}

function save(data) {
  ensureDir()
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

function getImagesDir() {
  ensureDir()
  return DATA_DIR
}

module.exports = { load, save, getImagesDir }
