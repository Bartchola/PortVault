// Armazenamento simples em JSON dentro da pasta de dados do usuário.
// Guarda: pastas monitoradas, biblioteca de jogos e histórico de downloads.
// Em versões futuras isso pode virar SQLite sem mudar o resto do app.

import path from 'path'
import fs from 'fs'
import { app } from 'electron'

const DATA_DIR = path.join(app.getPath('userData'), 'portvault')
const DATA_FILE = path.join(DATA_DIR, 'library.json')

const DEFAULT_DATA = {
  // Pastas que o usuário escolheu para escanear em busca de jogos
  folders: [],
  // Jogos encontrados/adicionados: { id, name, exePath, coverPath?, addedAt }
  games: [],
  // Downloads feitos pelo launcher
  downloads: [],
  // Credenciais do RetroAchievements (para importar conquistas)
  ra: { username: '', apiKey: '' },
  // Idioma do launcher ('pt' | 'en')
  locale: 'pt'
}

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

export function load() {
  try {
    return { ...DEFAULT_DATA, ...JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) }
  } catch {
    return { ...DEFAULT_DATA }
  }
}

export function save(data) {
  ensureDir()
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

export function getImagesDir() {
  ensureDir()
  return DATA_DIR
}

// Lê as credenciais do RetroAchievements
export function getRaConfig() {
  const { ra } = load()
  return { username: ra?.username || '', apiKey: ra?.apiKey || '' }
}

// Salva as credenciais do RetroAchievements
export function saveRaConfig({ username, apiKey }) {
  const data = load()
  data.ra = { username: (username || '').trim(), apiKey: (apiKey || '').trim() }
  save(data)
  return data.ra
}

// Lê o idioma do launcher ('pt' | 'en'; padrão português)
export function getLocale() {
  const { locale } = load()
  return locale === 'en' ? 'en' : 'pt'
}

// Salva o idioma do launcher
export function setLocale(locale) {
  const data = load()
  data.locale = locale === 'en' ? 'en' : 'pt'
  save(data)
  return data.locale
}
