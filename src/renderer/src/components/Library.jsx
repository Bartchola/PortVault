import React, { useEffect, useState } from 'react'
import Cover from './Cover'
import ImportRaModal from './ImportRaModal'
import { useI18n } from '../i18n'

export default function Library() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [raFor, setRaFor] = useState(null) // jogo com modal de importação do RA aberto
  const { t, tr } = useI18n()

  async function refresh() {
    setLoading(true)
    setGames(await window.api.listGames())
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  async function handleLaunch(game) {
    try {
      await window.api.launchGame(game.id)
    } catch (err) {
      alert(t('library.launchError') + '\n' + tr(err.message))
    }
  }

  async function handleAddManual() {
    const result = await window.api.addGameManual()
    if (result) setGames(result)
  }

  async function handleRemove(game) {
    if (confirm(t('library.confirmRemove', { name: game.name }))) {
      setGames(await window.api.removeGame(game.id))
    }
  }

  return (
    <div>
      <header className="page-header">
        <h1>{t('nav.library')}</h1>
        <button className="btn primary" onClick={handleAddManual}>{t('library.add')}</button>
      </header>

      {loading && <p className="muted">{t('common.loading')}</p>}

      {!loading && games.length === 0 && (
        <div className="empty">
          <p>{t('library.empty')}</p>
          <p className="muted">
            {t('library.emptyHintA')}<b>{t('nav.folders')}</b>{t('library.emptyHintB')}<b>{t('nav.downloads')}</b>{t('library.emptyHintC')}
          </p>
        </div>
      )}

      <div className="grid">
        {games.map((game) => (
          <div className="card" key={game.id}>
            <div className="cover">
              {game.coverPath
                ? <img src={`file://${game.coverPath}`} alt={game.name} />
                : <Cover name={game.name} />}
              <button className="play-btn" title={t('library.play')} onClick={() => handleLaunch(game)}>▶</button>
            </div>
            <div className="card-body">
              <p className="game-name" title={game.exePath}>{game.name}</p>
              <div className="card-actions">
                <button className="btn small" title={t('library.importRa')} onClick={() => setRaFor(game)}>🏆</button>
                <button className="btn small" title={t('library.openFolder')} onClick={() => window.api.openGameFolder(game.id)}>📁</button>
                <button className="btn small danger" title={t('library.remove')} onClick={() => handleRemove(game)}>✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de importação do RetroAchievements */}
      {raFor && (
        <ImportRaModal game={raFor} onClose={() => setRaFor(null)} onImported={refresh} />
      )}
    </div>
  )
}
