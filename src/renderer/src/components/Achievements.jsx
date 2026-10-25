import React, { useEffect, useState } from 'react'
import Cover from './Cover'
import { useI18n, pickAchievement } from '../i18n'

// Recalcula o resumo geral a partir da lista de jogos (usado após cada
// mudança, senão a barra do topo fica defasada)
function summarize(games) {
  const all = games.flatMap((g) => g.achievements)
  return { unlocked: all.filter((a) => a.unlocked).length, total: all.length }
}

// Formata a data de desbloqueio no padrão do idioma escolhido
function fmtDate(iso, lang) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(lang === 'en' ? 'en-US' : 'pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
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
  const [syncing, setSyncing] = useState(null) // id do jogo sincronizando agora
  const [syncMsg, setSyncMsg] = useState(null) // { gameId, k, p?, erro }
  const { t, tr, lang } = useI18n()

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

  // Puxa do RetroAchievements o que você já desbloqueou naquele jogo
  async function handleSync(game) {
    setSyncing(game.id)
    setSyncMsg(null)
    try {
      const r = await window.api.raSync(game.id, game.raGameId)
      setSyncMsg({
        gameId: game.id,
        erro: false,
        k: r.novas > 0 ? 'ach.syncRaDone' : 'ach.syncRaUptodate',
        p: { n: r.novas }
      })
      // Recarrega tudo: o resumo do topo e as datas mudam junto
      setData(await window.api.listAchievements())
    } catch (err) {
      setSyncMsg({ gameId: game.id, erro: true, k: err.message })
    }
    setSyncing(null)
  }

  return (
    <div>
      <header className="page-header">
        <h1>{t('ach.title')}</h1>
      </header>

      {/* ---------- Resumo geral ---------- */}
      <div className="ach-summary">
        <div className="ach-summary-info">
          <span className="ach-summary-num">{summary.unlocked}</span>
          <span className="ach-summary-total">{t('ach.summaryOf', { total: summary.total })}</span>
        </div>
        <div className="progress-bar ach-summary-bar">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="ach-summary-pct">{pct}%</span>
      </div>

      {loading && <p className="muted">{t('common.loading')}</p>}

      {!loading && data.games.length === 0 && (
        <div className="empty">
          <p>{t('ach.empty')}</p>
          <p className="muted">{t('ach.emptyHintA')}<b>{t('nav.library')}</b>{t('ach.emptyHintB')}</p>
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
                    <p className="muted ach-empty-game">{t('ach.emptyGame')}</p>
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
                        {/* Em português usa a tradução salva; em inglês, o original */}
                        <p className="ach-name">
                          {pickAchievement(lang, ach.name, ach.namePt)}
                          {ach.points ? <span className="ach-points">{t('ach.pts', { points: ach.points })}</span> : null}
                        </p>
                        <p className="ach-desc">{pickAchievement(lang, ach.desc, ach.descPt)}</p>
                        {ach.unlocked && <p className="ach-date">{t('ach.unlockedAt', { date: fmtDate(ach.unlockedAt, lang) })}</p>}
                      </div>
                      <div className="ach-actions">
                        <button
                          className="btn small"
                          title={ach.unlocked ? t('ach.markLocked') : t('ach.unlock')}
                          onClick={() => handleToggle(game.id, ach.id)}
                        >
                          {ach.unlocked ? '🔒' : '🔓'}
                        </button>
                        <button className="btn small danger" title={t('ach.remove')} onClick={() => handleRemove(game.id, ach.id)}>
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Sincroniza desbloqueios com o RetroAchievements
                      (só aparece em jogo vinculado a um id do RA) */}
                  {game.raGameId ? (
                    <div className="ach-sync">
                      <button
                        className="btn small"
                        title={t('ach.syncRaHint')}
                        disabled={syncing === game.id}
                        onClick={() => handleSync(game)}
                      >
                        {syncing === game.id ? t('common.loading') : t('ach.syncRa')}
                      </button>
                      <span className="ach-sync-hint">{t('ach.syncRaHint')}</span>
                    </div>
                  ) : null}

                  {syncMsg && syncMsg.gameId === game.id && (
                    <p className={`ra-status ${syncMsg.erro ? 'error' : 'ok'}`}>
                      {syncMsg.erro ? '⚠️ ' : '✅ '}
                      {syncMsg.p ? t(syncMsg.k, syncMsg.p) : tr(syncMsg.k)}
                    </p>
                  )}

                  {/* Formulário para criar conquista */}
                  {addingFor === game.id ? (
                    <div className="ach-form">
                      <input
                        className="ach-form-icon"
                        maxLength={2}
                        value={form.icon}
                        title={t('ach.formEmoji')}
                        onChange={(e) => setForm({ ...form, icon: e.target.value })}
                      />
                      <input
                        className="ach-form-name"
                        placeholder={t('ach.formName')}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                      <input
                        className="ach-form-desc"
                        placeholder={t('ach.formDesc')}
                        value={form.desc}
                        onChange={(e) => setForm({ ...form, desc: e.target.value })}
                      />
                      <button className="btn primary small" onClick={() => handleAdd(game.id)}>{t('common.save')}</button>
                      <button className="btn small" onClick={() => setAddingFor(null)}>{t('common.cancel')}</button>
                    </div>
                  ) : (
                    <button className="btn small ach-add-btn" onClick={() => openAdd(game.id)}>
                      {t('ach.add')}
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
