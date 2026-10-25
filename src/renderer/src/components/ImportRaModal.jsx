import React, { useEffect, useState } from 'react'
import { useI18n, pickAchievement } from '../i18n'

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
  const [error, setError] = useState('') // chave de erro ou mensagem crua
  const { t, tr, lang } = useI18n()

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
    if (!consoleId) { setError('ra.pickConsoleFirst'); return }
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
      if (ach.length === 0) setError('ra.noAchievements')
    } catch (e) { setError(e.message) }
    finally { setPreviewLoading(false) }
  }

  function handleUseLink() {
    const id = parseGameId(linkInput)
    if (!id) {
      setError('ra.badLink')
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
            <h2>{t('ra.doneTitle')}</h2>
            <p className="modal-text">
              <b>{done}</b>{t('ra.doneBody')}<b>{game.name}</b>.
            </p>
            <div className="modal-actions">
              <button className="btn primary" onClick={onClose}>{t('common.close')}</button>
            </div>
          </>
        ) : configured === null ? (
          <p className="modal-text">{t('common.loading')}</p>
        ) : configured === false ? (
          <>
            <div className="modal-icon">🕹️</div>
            <h2>{t('ra.notConnectedTitle')}</h2>
            <p className="modal-text">
              {t('ra.notConnectedBody')}<b>{t('ra.notConnectedWhere')}</b>.
            </p>
            <div className="modal-actions">
              <button className="btn primary" onClick={onClose}>{t('ra.gotIt')}</button>
            </div>
          </>
        ) : (
          <>
            <div className="modal-icon">🏆</div>
            <h2>{t('ra.importTitle')}</h2>
            <p className="modal-text">
              {t('ra.chooseGameA')}<b>{game.name}</b>{t('ra.chooseGameB')}
            </p>

            {/* Só mostra o passo de escolha se ainda não escolheu */}
            {!selected ? (
              <>
                <div className="ra-tabs">
                  <button className={`ra-tab ${mode === 'search' ? 'active' : ''}`} onClick={() => setMode('search')}>
                    {t('ra.tabSearch')}
                  </button>
                  <button className={`ra-tab ${mode === 'link' ? 'active' : ''}`} onClick={() => setMode('link')}>
                    {t('ra.tabLink')}
                  </button>
                </div>

                {mode === 'search' ? (
                  <div className="ra-search">
                    <select value={consoleId} onChange={(e) => setConsoleId(e.target.value)}>
                      <option value="">{t('ra.chooseConsole')}</option>
                      {consoles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input
                      value={query}
                      placeholder={t('ra.gameName')}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button className="btn primary" onClick={handleSearch} disabled={searching}>
                      {searching ? t('common.searching') : t('common.search')}
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
                    <button className="btn primary" onClick={handleUseLink}>{t('ra.use')}</button>
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
                  <p className="muted ra-hint">{t('ra.notFound')}</p>
                )}
              </>
            ) : (
              /* ---------- Prévia + confirmar ---------- */
              <div className="ra-preview">
                <p className="ra-preview-title">{selected.title}</p>
                {previewLoading && <p className="muted">{t('ra.fetchingAchievements')}</p>}
                {preview && preview.length > 0 && (
                  <>
                    <p className="ra-preview-count">
                      <b>{preview.length}</b>{t('ra.foundCount')}
                    </p>
                    <ul className="ra-preview-list">
                      {preview.slice(0, 4).map((a, i) => (
                        <li key={i}>{pickAchievement(lang, a.name, a.namePt)}</li>
                      ))}
                      {preview.length > 4 && <li className="muted">{t('ra.more', { n: preview.length - 4 })}</li>}
                    </ul>
                  </>
                )}
                <div className="modal-actions">
                  <button className="btn" onClick={back} disabled={importing}>{t('common.back')}</button>
                  <button className="btn primary" onClick={handleImport} disabled={importing || previewLoading || !preview?.length}>
                    {importing ? t('ra.importing') : t('ra.importN', { n: preview?.length || 0 })}
                  </button>
                </div>
              </div>
            )}

            {error && <p className="ra-status error">⚠️ {tr(error)}</p>}
          </>
        )}
      </div>
    </div>
  )
}
