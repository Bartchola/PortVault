import React, { useEffect, useState } from 'react'

// Capa fallback: gera uma cor consistente por nome + as iniciais
function FallbackCover({ name }) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  const hue = Math.abs(hash) % 360
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="cover-fallback" style={{ background: `linear-gradient(135deg, hsl(${hue},60%,30%), hsl(${(hue + 60) % 360},60%,18%))` }}>
      <span>{initials}</span>
    </div>
  )
}

export default function Library() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)

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
      alert('Não foi possível abrir o jogo:\n' + err.message)
    }
  }

  async function handleAddManual() {
    const result = await window.api.addGameManual()
    if (result) setGames(result)
  }

  async function handleRemove(game) {
    if (confirm(`Remover "${game.name}" da biblioteca? (O jogo não será apagado do PC)`)) {
      setGames(await window.api.removeGame(game.id))
    }
  }

  return (
    <div>
      <header className="page-header">
        <h1>Biblioteca</h1>
        <button className="btn primary" onClick={handleAddManual}>+ Adicionar jogo</button>
      </header>

      {loading && <p className="muted">Carregando...</p>}

      {!loading && games.length === 0 && (
        <div className="empty">
          <p>Nenhum jogo na biblioteca ainda.</p>
          <p className="muted">Vá em <b>Pastas</b> para escanear seus jogos, ou <b>Downloads</b> para instalar um port.</p>
        </div>
      )}

      <div className="grid">
        {games.map((game) => (
          <div className="card" key={game.id}>
            <div className="cover">
              {game.coverPath
                ? <img src={`file://${game.coverPath}`} alt={game.name} />
                : <FallbackCover name={game.name} />}
              <button className="play-btn" title="Jogar" onClick={() => handleLaunch(game)}>▶</button>
            </div>
            <div className="card-body">
              <p className="game-name" title={game.exePath}>{game.name}</p>
              <div className="card-actions">
                <button className="btn small" onClick={() => window.api.openGameFolder(game.id)}>📁</button>
                <button className="btn small danger" onClick={() => handleRemove(game)}>✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
