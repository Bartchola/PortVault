// Cliente da API pública do RetroAchievements (https://api-docs.retroachievements.org/).
//
// A API exige sua "web API key" (retroachievements.org → Control Panel → Keys).
// Toda chamada leva `&y=<apiKey>`, lida das credenciais salvas no store.
// Endpoints e campos abaixo foram conferidos na documentação oficial e testados
// ao vivo — não mudar sem re-conferir a doc.
//
// POR QUE NÃO CASA AUTOMÁTICO: o RetroAchievements identifica os jogos pelo
// hash da ROM original. Ports/recompilações não têm a ROM, então a gente
// vincula pelo ID do jogo (buscando por nome dentro de um console, ou colando
// o link do jogo no site) e daí baixa as conquistas oficiais daquele jogo.

import { getRaConfig, load, save } from './store.js'

const BASE = 'https://retroachievements.org/API'

// Ícone de uma conquista a partir do "BadgeName" (número) que a API devolve.
// Testado ao vivo: os badges agora ficam em /Images/ (o host antigo
// media.retroachievements.org/BadgeImages/ sumiu e dá 404).
const badgeUrl = (badgeName) =>
  badgeName ? `https://retroachievements.org/Images/${badgeName}.png` : ''

// Caminho de imagem relativo (ex.: "/Images/020895.png") → URL absoluto
const imageUrl = (path) =>
  !path ? '' : path.startsWith('http') ? path : `https://retroachievements.org${path}`

// Faz uma chamada à API e devolve o JSON (lança erro em falha)
async function request(endpoint, params = {}) {
  const { apiKey } = getRaConfig()
  if (!apiKey) throw new Error('Configure sua chave do RetroAchievements em Configurações.')
  const url = new URL(`${BASE}/${endpoint}`)
  for (const [k, v] of Object.entries({ ...params, y: apiKey })) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)
  }
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Erro ${res.status} ao falar com o RetroAchievements.`)
  let json
  try { json = await res.json() } catch { throw new Error('Resposta inválida do RetroAchievements.') }
  if (json && typeof json === 'object' && !Array.isArray(json) && json.error) {
    throw new Error(String(json.error))
  }
  return json
}

// Lista de consoles, só sistemas de jogos e ativos (evita Hubs/Eventos)
// `a=1` só ativos, `g=1` só sistemas de jogos
function fetchConsoles() {
  return request('API_GetConsoleIDs.php', { a: 1, g: 1 })
}

// Valida a conta: baixa a lista de consoles (se der certo, a chave é boa)
export async function verifyAccount() {
  const { username, apiKey } = getRaConfig()
  if (!apiKey) return { ok: false, error: 'Chave de API vazia.' }
  try {
    const consoles = await fetchConsoles()
    if (!Array.isArray(consoles)) return { ok: false, error: 'Resposta inesperada da API.' }
    return { ok: true, username, consoles: consoles.length }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

// Lista de consoles (usada pra escolher na busca)
export async function getConsoles() {
  const list = await fetchConsoles()
  return Array.isArray(list) ? list.map((c) => ({ id: c.ID, name: c.Name })) : []
}

// Cache em memória da lista de jogos por console. A doc pede pra "agressively
// cachear" esse endpoint (a resposta é enorme e muda pouco) — então guardamos
// durante a sessão pra não baixar de novo a cada busca.
const gamesCache = new Map()

// Jogos de um console que têm conquistas (`f=1`). Filtramos por nome no cliente.
export async function getConsoleGames(consoleId) {
  const key = String(consoleId)
  if (gamesCache.has(key)) return gamesCache.get(key)
  // `i` = id do console, `f=1` = só jogos com conquistas
  const games = await request('API_GetGameList.php', { i: consoleId, f: 1 })
  const list = Array.isArray(games) ? games : []
  gamesCache.set(key, list)
  return list
}

// Busca jogos por nome dentro de um console
export async function searchGames(query, consoleId) {
  const q = String(query || '').toLowerCase().trim()
  if (!q) return []
  const games = await getConsoleGames(consoleId)
  return games
    .filter((g) => String(g.Title || '').toLowerCase().includes(q))
    .slice(0, 25)
    .map((g) => ({ id: g.ID, title: g.Title, imageIcon: imageUrl(g.ImageIcon) }))
}

// Extrai o ID do jogo de uma URL (retroachievements.org/game/12345) ou número
export function parseGameId(input) {
  const s = String(input || '').trim()
  const fromUrl = s.match(/game\/(\d+)/i)
  if (fromUrl) return fromUrl[1]
  if (/^\d+$/.test(s)) return s
  return null
}

// Conquistas de um jogo do RA, convertidas pro formato do PortVault.
// A API devolve `Achievements` como um OBJETO (chave = id da conquista),
// então percorremos com Object.values e ordenamos por DisplayOrder.
export async function getGameAchievements(raGameId) {
  const data = await request('API_GetGameExtended.php', { i: raGameId }) // `i` = id do jogo
  const source = data && data.Achievements ? data.Achievements : {}
  return Object.values(source)
    .sort((a, b) => (a.DisplayOrder || 0) - (b.DisplayOrder || 0))
    .map((a) => ({
      raId: a.ID,
      name: a.Title || '',
      desc: a.Description || '',
      points: a.Points || 0,
      icon: '🏆', // reserva (emoji) caso o badge não carregue
      iconUrl: badgeUrl(a.BadgeName), // ícone oficial do RetroAchievements
      unlocked: false,
      unlockedAt: null
    }))
}

// Id curto e único (mesmo padrão da biblioteca)
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

// Substitui as conquistas de um jogo pelas oficiais do RetroAchievements
export async function importAchievements(gameId, raGameId) {
  const achievements = await getGameAchievements(raGameId)
  if (achievements.length === 0) {
    throw new Error('Esse jogo do RA não retornou conquistas.')
  }
  const data = load()
  const game = data.games.find((g) => g.id === gameId)
  if (!game) throw new Error('Jogo não encontrado')
  game.achievements = achievements.map((a) => ({ id: genId(), ...a }))
  game.raGameId = raGameId // lembra o vínculo (pra re-sincronizar no futuro)
  save(data)
  return { count: game.achievements.length, achievements: game.achievements.map((a) => ({ ...a })) }
}
