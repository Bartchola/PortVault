import React, { useEffect, useState } from 'react'
import { useI18n } from '../i18n'

// Estágios que têm tradução própria (o downloader só emite esses)
const KNOWN_STAGES = ['baixando', 'extraindo', 'registrando', 'concluido']

export default function Downloads({ onInstalled }) {
  const [url, setUrl] = useState('')
  const [items, setItems] = useState([])
  const [busy, setBusy] = useState(false)
  const { t, tr } = useI18n()

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
    setItems((prev) => [...prev, { key: url, fileName: t('dl.starting'), percent: 0, stage: 'baixando' }])

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
        <h1>{t('dl.title')}</h1>
      </header>

      <form className="download-form" onSubmit={handleDownload}>
        <input
          type="url"
          placeholder={t('dl.placeholder')}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <button className="btn primary" disabled={busy}>
          {busy ? t('dl.downloading') : t('dl.downloadInstall')}
        </button>
      </form>

      <p className="muted">{t('dl.hint')}</p>

      <div className="download-list">
        {items.map((item) => (
          <div className="download-item" key={item.key}>
            <div className="download-info">
              <span className="download-name">{item.fileName}</span>
              <span className="download-stage">
                {item.stage === 'erro'
                  ? t('dl.error', { msg: tr(item.error) })
                  : KNOWN_STAGES.includes(item.stage) ? t(`stage.${item.stage}`) : item.stage}
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
