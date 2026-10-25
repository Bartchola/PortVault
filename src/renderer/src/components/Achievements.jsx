import React, { useEffect, useState } from 'react'
import Cover from './Cover'

// Recalcula o resumo geral a partir da lista de jogos (usado após cada
// mudança, senão a barra do topo fica defasada)
function summarize(games) {
  const all = games.flatMap((g) => g.achievements)
  return { unlocked: all.filter((a) => a.unlocked).length, total: all.length }
}

// Formata a data de desbloqueio no padrão brasileiro
function fmtDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return ''
  }
}

export default function Achievements() {
  const [data, setData] = useState({ games: [], summary: { unlocked: 0, total: 0 } })
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null) // id do jogo aberto
  const [addingFor, setAddingFor] = useState(null) // id do jogo com formulário aberto
  const [form, setForm] = useState({ icon: '🏆', name: '', desc: '' })

  async function refresh() {
    setLoading(true)
    setData(await window.api.listAchievements())
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  const { summary } = data
  const pct = summary.total ? Math.round((summary.unlocked / summary.total) * 100) : 0

  async function handleToggle(gameId, achId) {
    const achievements = await window.api.toggleAchievement(gameId, achId)
    setData((d) => {
      const games = d.games.map((g) => (g.id === gameId ? { ...g, achievements } : g))
      return { ...d, games, summary: summarize(games) }
    })
  }

  async function handleRemove(gameId, achId) {
    const achievements = await window.api.removeAchievement(gameId, achId)
    setData((d) => {
      const games = d.games.map((g) => (g.id === gameId ? { ...g, achievements } : g))
      return { ...d, games, summary: summarize(games) }
    })
  }

  async function handleAdd(gameId) {
    if (!form.name.trim()) return
    const achievements = await window.api.addAchievement(gameId, form)
    setData((d) => {
      const games = d.games.map((g) => (g.id === gameId ? { ...g, achievements } : g))
      return { ...d, games, summary: summarize(games) }
    })
    setForm({ icon: '🏆', name: '', desc: '' })
    setAddingFor(null)
  }

  function openAdd(gameId) {
    setForm({ icon: '🏆', name: '', desc: '' })
    setAddingFor(gameId)
  }

  return (
    <div>
      <header className="page-header">
        <h1>Conquistas</h1>
      </header>

      {/* ---------- Resumo geral ---------- */}
      <div className="ach-summary">
        <div className="ach-summary-info">
          <span className="ach-summary-num">{summary.unlocked}</span>
          <span className="ach-summary-total">/ {summary.total} desbloqueadas</span>
        </div>
        <div className="progress-bar ach-summary-bar">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="ach-summary-pct">{pct}%</span>
      </div>

      {loading && <p className="muted">Carregando...</p>}

      {!loading && data.games.length === 0 && (
        <div className="empty">
          <p>Nenhum jogo na biblioteca ainda.</p>
          <p className="muted">Adicione jogos na <b>Biblioteca</b> para ver as conquistas de cada um.</p>
        </div>
      )}

      {/* ---------- Um cartão por jogo ---------- */}
      <div className="ach-games">
        {data.games.map((game) => {
          const done = game.achievements.filter((a) => a.unlocked).length
          const total = game.achievements.length
          const gamePct = total ? Math.round((done / total) * 100) : 0
          const isOpen = expanded === game.id

          return (
            <div className="ach-game" key={game.id}>
              {/* Cabeçalho clicável do jogo */}
              <button className="ach-game-head" onClick={() => setExpanded(isOpen ? null : game.id)}>
                <div className="ach-game-cover">
                  {game.coverPath ? <img src={`file://${game.coverPath}`} alt={game.name} /> : <Cover name={game.name} />}
                </div>
                <div className="ach-game-info">
                  <p className="ach-game-name">{game.name}</p>
                  <div className="progress-bar ach-game-bar">
                    <div className="progress-fill" style={{ width: `${gamePct}%` }} />
                  </div>
                </div>
                <span className="ach-game-count">{done}/{total}</span>
                <span className={`ach-chevron ${isOpen ? 'open' : ''}`}>▾</span>
              </button>

              {/* Lista de conquistas (só aparece se aberto) */}
              {isOpen && (
                <div className="ach-list">
                  {game.achievements.length === 0 && (
                    <p className="muted ach-empty-game">Este jogo ainda não tem conquistas.</p>
                  )}

                  {game.achievements.map((ach) => (
                    <div className={`ach-row ${ach.unlocked ? 'unlocked' : 'locked'}`} key={ach.id}>
                      <div className="ach-icon">
                        {ach.iconUrl ? (
                          <>
                            {/* Badge do RetroAchievements; se a imagem falhar,
                                esconde e mostra o emoji no lugar */}
                            <img
                              className="ach-icon-img"
                              src={ach.iconUrl}
                              alt=""
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                if (e.currentTarget.nextElementSibling) e.currentTarget.nextElementSibling.style.display = 'block'
                              }}
                            />
                            <span className="ach-icon-emoji" style={{ display: 'none' }}>{ach.icon || '🏆'}</span>
                          </>
                        ) : (
                          <span className="ach-icon-emoji">{ach.icon}</span>
                        )}
                        {!ach.unlocked && <span className="ach-lock">🔒</span>}
                      </div>
                      <div className="ach-info">
                        <p className="ach-name">{ach.name}{ach.points ? <span className="ach-points">{ach.points} pts</span> : null}</p>
                        <p className="ach-desc">{ach.desc}</p>
                        {ach.unlocked && <p className="ach-date">Desbloqueada em {fmtDate(ach.unlockedAt)}</p>}
                      </div>
                      <div className="ach-actions">
                        <button
                          className="btn small"
                          title={ach.unlocked ? 'Marcar como bloqueada' : 'Desbloquear'}
                          onClick={() => handleToggle(game.id, ach.id)}
                        >
                          {ach.unlocked ? '🔒' : '🔓'}
                        </button>
                        <button className="btn small danger" title="Remover conquista" onClick={() => handleRemove(game.id, ach.id)}>
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Formulário para criar conquista */}
                  {addingFor === game.id ? (
                    <div className="ach-form">
                      <input
                        className="ach-form-icon"
                        maxLength={2}
                        value={form.icon}
                        title="Emoji da conquista"
                        onChange={(e) => setForm({ ...form, icon: e.target.value })}
                      />
                      <input
                        className="ach-form-name"
                        placeholder="Nome da conquista"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                      <input
                        className="ach-form-desc"
                        placeholder="Descrição (opcional)"
                        value={form.desc}
                        onChange={(e) => setForm({ ...form, desc: e.target.value })}
                      />
                      <button className="btn primary small" onClick={() => handleAdd(game.id)}>Salvar</button>
                      <button className="btn small" onClick={() => setAddingFor(null)}>Cancelar</button>
                    </div>
                  ) : (
                    <button className="btn small ach-add-btn" onClick={() => openAdd(game.id)}>
                      + Adicionar conquista
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
