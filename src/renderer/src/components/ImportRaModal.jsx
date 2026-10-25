import React, { useEffect, useState } from 'react'

// Lê o ID do jogo de uma URL (retroachievements.org/game/12345) ou de um número
function parseGameId(input) {
  const s = String(input || '').trim()
  const fromUrl = s.match(/game\/(\d+)/i)
  if (fromUrl) return fromUrl[1]
  if (/^\d+$/.test(s)) return s
  return null
}

// Modal para vincular um jogo ao RetroAchievements e importar as conquistas
// oficiais dele (substituindo a lista atual do jogo).
export default function ImportRaModal({ game, onClose, onImported }) {
  const [configured, setConfigured] = useState(null) // null=carregando, false=sem chave
  const [consoles, setConsoles] = useState([])
  const [consoleId, setConsoleId] = useState('')
  const [mode, setMode] = useState('search') // 'search' | 'link'
  const [query, setQuery] = useState(game.name)
  const [linkInput, setLinkInput] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState(null) // { id, title }
  const [preview, setPreview] = useState(null) // conquistas (prévia)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState(null) // total importado
  const [error, setError] = useState('')

  // Ao abrir: vê se tem chave salva e carrega os consoles
  useEffect(() => {
    (async () => {
      const cfg = await window.api.raConfigGet()
      if (!cfg.apiKey) { setConfigured(false); return }
      setConfigured(true)
      try { setConsoles(await window.api.raConsoles()) } catch { /* fica vazio */ }
    })()
  }, [])

  async function handleSearch() {
    if (!consoleId) { setError('Escolha o console primeiro.'); return }
    setError(''); setSearching(true); setResults([]); setSelected(null); setPreview(null)
    try { setResults(await window.api.raSearch(query, consoleId)) }
    catch (e) { setError(e.message) }
    finally { setSearching(false) }
  }

  // Vincula um jogo do RA (por busca ou link) e busca a prévia das conquistas
  async function pickRaGame(id, title) {
    setSelected({ id, title }); setPreview(null); setError(''); setPreviewLoading(true)
    try {
      const ach = await window.api.raPreview(id)
      setPreview(ach)
      if (ach.length === 0) setError('Esse jogo não retornou conquistas.')
    } catch (e) { setError(e.message) }
    finally { setPreviewLoading(false) }
  }

  function handleUseLink() {
    const id = parseGameId(linkInput)
    if (!id) {
      setError('Não consegui ler o ID. Cole o link tipo retroachievements.org/game/12345 (ou só o número).')
      return
    }
    pickRaGame(id, `Jogo #${id}`)
  }

  async function handleImport() {
    if (!selected) return
    setImporting(true); setError('')
    try {
      const r = await window.api.raImport(game.id, selected.id)
      setDone(r.count)
      onImported && onImported()
    } catch (e) { setError(e.message) }
    finally { setImporting(false) }
  }

  function back() { setSelected(null); setPreview(null); setError('') }

  return (
    <div className="modal-overlay" onClick={importing ? undefined : onClose}>
      <div className="modal ra-modal" onClick={(e) => e.stopPropagation()}>
        {/* ---------- Tela de sucesso ---------- */}
        {done !== null ? (
          <>
            <div className="modal-icon">✅</div>
            <h2>Conquistas importadas!</h2>
            <p className="modal-text">
              <b>{done}</b> conquistas do RetroAchievements foram adicionadas a <b>{game.name}</b>.
            </p>
            <div className="modal-actions">
              <button className="btn primary" onClick={onClose}>Fechar</button>
            </div>
          </>
        ) : configured === null ? (
          <p className="modal-text">Carregando...</p>
        ) : configured === false ? (
          <>
            <div className="modal-icon">🕹️</div>
            <h2>RetroAchievements não conectado</h2>
            <p className="modal-text">
              Antes de importar, conecte sua conta em <b>Configurações → RetroAchievements</b>.
            </p>
            <div className="modal-actions">
              <button className="btn primary" onClick={onClose}>Entendi</button>
            </div>
          </>
        ) : (
          <>
            <div className="modal-icon">🏆</div>
            <h2>Importar conquistas</h2>
            <p className="modal-text">
              Jogo: <b>{game.name}</b> — escolha a versão certa no RetroAchievements.
            </p>

            {/* Só mostra o passo de escolha se ainda não escolheu */}
            {!selected ? (
              <>
                <div className="ra-tabs">
                  <button className={`ra-tab ${mode === 'search' ? 'active' : ''}`} onClick={() => setMode('search')}>
                    🔎 Buscar por nome
                  </button>
                  <button className={`ra-tab ${mode === 'link' ? 'active' : ''}`} onClick={() => setMode('link')}>
                    🔗 Colar link
                  </button>
                </div>

                {mode === 'search' ? (
                  <div className="ra-search">
                    <select value={consoleId} onChange={(e) => setConsoleId(e.target.value)}>
                      <option value="">Escolha o console...</option>
                      {consoles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input
                      value={query}
                      placeholder="Nome do jogo"
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button className="btn primary" onClick={handleSearch} disabled={searching}>
                      {searching ? 'Buscando...' : 'Buscar'}
                    </button>
                  </div>
                ) : (
                  <div className="ra-search">
                    <input
                      value={linkInput}
                      placeholder="retroachievements.org/game/12345"
                      onChange={(e) => setLinkInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUseLink()}
                    />
                    <button className="btn primary" onClick={handleUseLink}>Usar</button>
                  </div>
                )}

                {/* Resultados da busca */}
                {results.length > 0 && (
                  <div className="ra-results">
                    {results.map((r) => (
                      <button key={r.id} className="ra-result" onClick={() => pickRaGame(r.id, r.title)}>
                        {r.title}
                      </button>
                    ))}
                  </div>
                )}
                {mode === 'search' && !searching && query && consoleId && results.length === 0 && !error && (
                  <p className="muted ra-hint">Nada encontrado. Tente outro nome ou a aba “Colar link”.</p>
                )}
              </>
            ) : (
              /* ---------- Prévia + confirmar ---------- */
              <div className="ra-preview">
                <p className="ra-preview-title">{selected.title}</p>
                {previewLoading && <p className="muted">Buscando conquistas...</p>}
                {preview && preview.length > 0 && (
                  <>
                    <p className="ra-preview-count">
                      <b>{preview.length}</b> conquistas encontradas. Substituir as atuais?
                    </p>
                    <ul className="ra-preview-list">
                      {preview.slice(0, 4).map((a, i) => <li key={i}>{a.name}</li>)}
                      {preview.length > 4 && <li className="muted">... e mais {preview.length - 4}</li>}
                    </ul>
                  </>
                )}
                <div className="modal-actions">
                  <button className="btn" onClick={back} disabled={importing}>← Voltar</button>
                  <button className="btn primary" onClick={handleImport} disabled={importing || previewLoading || !preview?.length}>
                    {importing ? 'Importando...' : `Importar ${preview?.length || 0} conquistas`}
                  </button>
                </div>
              </div>
            )}

            {error && <p className="ra-status error">⚠️ {error}</p>}
          </>
        )}
      </div>
    </div>
  )
}
