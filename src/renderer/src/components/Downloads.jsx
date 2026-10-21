import React, { useEffect, useState } from 'react'

const STAGE_LABEL = {
  baixando: 'Baixando',
  extraindo: 'Extraindo',
  registrando: 'Adicionando à biblioteca',
  concluido: 'Concluído ✅'
}

export default function Downloads({ onInstalled }) {
  const [url, setUrl] = useState('')
  const [items, setItems] = useState([])
  const [busy, setBusy] = useState(false)

  // Escuta o progresso vindo do "cérebro" do launcher
  useEffect(() => {
    window.api.onDownloadProgress((data) => {
      setItems((prev) => {
        const key = data.fileName
        const existing = prev.find((i) => i.key === key)
        if (existing) return prev.map((i) => (i.key === key ? { ...i, ...data } : i))
        return [...prev, { key, ...data }]
      })
    })
  }, [])

  async function handleDownload(e) {
    e.preventDefault()
    if (!url.trim() || busy) return
    setBusy(true)
    setItems((prev) => [...prev, { key: url, fileName: 'Iniciando...', percent: 0, stage: 'baixando' }])

    const result = await window.api.startDownload(url.trim())
    setBusy(false)

    if (!result.ok) {
      setItems((prev) => prev.map((i) => (i.key === url ? { ...i, stage: 'erro', error: result.error } : i)))
    } else {
      setUrl('')
      onInstalled?.()
    }
  }

  return (
    <div>
      <header className="page-header">
        <h1>Downloads</h1>
      </header>

      <form className="download-form" onSubmit={handleDownload}>
        <input
          type="url"
          placeholder="Cole o link direto de um port/recomp (.zip ou .exe)..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <button className="btn primary" disabled={busy}>
          {busy ? 'Baixando...' : 'Baixar e instalar'}
        </button>
      </form>

      <p className="muted">
        Funciona com links diretos (.zip, .exe). O jogo é extraído e adicionado à biblioteca automaticamente.
      </p>

      <div className="download-list">
        {items.map((item) => (
          <div className="download-item" key={item.key}>
            <div className="download-info">
              <span className="download-name">{item.fileName}</span>
              <span className="download-stage">
                {item.stage === 'erro' ? `Erro: ${item.error}` : STAGE_LABEL[item.stage] || item.stage}
              </span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${item.percent || 0}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
