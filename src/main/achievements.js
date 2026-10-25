// Conquistas por jogo (estilo Steam).
//
// Cada jogo da biblioteca ganha uma lista de conquistas. Tudo fica no mesmo
// library.json, dentro de cada jogo (campo `achievements`), então ao remover
// o jogo as conquistas vão junto automaticamente.
//
// As conquistas são desbloqueadas MANUALMENTE (clicando), porque ports da
// comunidade não avisam o launcher quando você completa algo no jogo. Um
// catálogo inicial já traz listas de exemplo para alguns jogos conhecidos —
// e o usuário pode editar, remover ou criar as suas.

import { load, save } from './store.js'

// Id curto e único (mesmo padrão usado na biblioteca)
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

// Catálogo inicial de conquistas por jogo (exemplos editáveis).
// `exact` compara o nome normalizado igualzinho (evita falso positivo em
// nomes curtos como "black"); `contains` aceita o nome "conter" o trecho
// (para nomes distintos tipo "Midnight Club").
const CATALOG = [
  {
    exact: ['midnightclub3dubedition', 'midnightclub3', 'mc3'],
    contains: ['midnightclub'],
    achievements: [
      { icon: '🏁', name: 'Primeira Volta', desc: 'Complete sua primeira corrida' },
      { icon: '🏆', name: 'Campeão da Rua', desc: 'Vença um torneio da cidade' },
      { icon: '💨', name: 'Velocidade Máxima', desc: 'Atinga a velocidade máxima do carro' },
      { icon: '🌙', name: 'Caçador Noturno', desc: 'Vença uma corrida à noite' },
      { icon: '🔧', name: 'Oficina Custom', desc: 'Personalize seu primeiro veículo' }
    ]
  },
  {
    exact: ['black'],
    contains: [],
    achievements: [
      { icon: '🔫', name: 'Belicista', desc: 'Dispare sua primeira arma' },
      { icon: '💥', name: 'Demolidor', desc: 'Destrua um ambiente destrutível' },
      { icon: '🎯', name: 'Atirador de Elite', desc: 'Acerte 10 tiros na cabeça' },
      { icon: '🛡️', name: 'Sobrevivente', desc: 'Complete um nível sem morrer' },
      { icon: '⭐', name: 'Nota Máxima', desc: 'Conclua um nível com a pontuação mais alta' }
    ]
  }
]

// Deixa o nome comparável: minúsculas e só letras/números
function normalize(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]/g, '')
}

function catalogFor(gameName) {
  const n = normalize(gameName)
  for (const entry of CATALOG) if (entry.exact.includes(n)) return entry.achievements
  for (const entry of CATALOG) if (entry.contains.some((c) => n.includes(c))) return entry.achievements
  return null
}

// Garante que todo jogo tenha o campo `achievements` e semeia do catálogo
// uma única vez (flag `achievementsSeeded`), pra não recriar conquistas que
// o usuário apagou de propósito.
function ensureAchievements(data) {
  let changed = false
  for (const game of data.games) {
    if (!Array.isArray(game.achievements)) {
      game.achievements = []
      changed = true
    }
    if (!game.achievementsSeeded) {
      const seed = catalogFor(game.name)
      if (seed && game.achievements.length === 0) {
        game.achievements = seed.map((a) => ({ id: genId(), unlocked: false, unlockedAt: null, ...a }))
      }
      game.achievementsSeeded = true
      changed = true
    }
  }
  return changed
}

function findGame(data, gameId) {
  const game = data.games.find((g) => g.id === gameId)
  if (!game) throw new Error('Jogo não encontrado')
  if (!Array.isArray(game.achievements)) game.achievements = []
  return game
}

// Lista todos os jogos com suas conquistas + um resumo geral
export function listAchievements() {
  const data = load()
  if (ensureAchievements(data)) save(data)

  const games = data.games.map((g) => ({
    id: g.id,
    name: g.name,
    coverPath: g.coverPath,
    // Vínculo com o RetroAchievements — o renderer precisa saber quais
    // jogos podem sincronizar desbloqueios
    raGameId: g.raGameId || null,
    achievements: (g.achievements || []).map((a) => ({ ...a }))
  }))

  const all = games.flatMap((g) => g.achievements)
  return {
    games,
    summary: { unlocked: all.filter((a) => a.unlocked).length, total: all.length }
  }
}

// Cria uma nova conquista para um jogo
export function addAchievement(gameId, { name, desc, icon }) {
  if (!name || !name.trim()) throw new Error('err.achievementNoName')
  const data = load()
  const game = findGame(data, gameId)
  const ach = {
    id: genId(),
    name: name.trim(),
    desc: (desc || '').trim(),
    icon: (icon || '').trim() || '🏆',
    unlocked: false,
    unlockedAt: null
  }
  game.achievements.push(ach)
  save(data)
  return game.achievements.map((a) => ({ ...a }))
}

// Remove uma conquista
export function removeAchievement(gameId, achId) {
  const data = load()
  const game = findGame(data, gameId)
  game.achievements = game.achievements.filter((a) => a.id !== achId)
  save(data)
  return game.achievements.map((a) => ({ ...a }))
}

// Liga/desliga o "desbloqueada" (desbloqueio manual)
export function toggleAchievement(gameId, achId) {
  const data = load()
  const game = findGame(data, gameId)
  const ach = game.achievements.find((a) => a.id === achId)
  if (!ach) throw new Error('err.achievementNotFound')
  ach.unlocked = !ach.unlocked
  ach.unlockedAt = ach.unlocked ? new Date().toISOString() : null
  save(data)
  return game.achievements.map((a) => ({ ...a }))
}
