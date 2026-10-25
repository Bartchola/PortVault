import React from 'react'
import { useI18n } from '../i18n'

// Pop-up exibido na abertura quando existe uma versão mais nova.
// Em vez de abrir o navegador, ele BAIXA dentro do launcher (barra de
// progresso) e instala sozinho, de forma silenciosa.
export default function UpdateModal({ updater }) {
  const { info, phase, progress, start, dismiss } = updater
  const { t } = useI18n()
  if (!info) return null

  const downloading = phase === 'downloading'
  const installing = phase === 'installing'
  const errored = phase === 'error'

  return (
    <div className="modal-overlay" onClick={downloading || installing ? undefined : dismiss}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon">{installing ? '⚙️' : '🚀'}</div>
        <h2>{installing ? t('update.installingTitle') : t('update.newVersion')}</h2>

        <p className="modal-versions">
          <span className="badge installed">v{info.currentVersion}</span>
          <span className="arrow">→</span>
          <span className="badge latest">v{info.latestVersion}</span>
        </p>

        {/* ---------- Área de progresso / mensagens ---------- */}
        {downloading && (
          <div className="modal-download">
            <p className="modal-text">{t('update.downloading')}</p>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <p className="modal-progress-pct">{progress}%</p>
          </div>
        )}

        {installing && <p className="modal-text">{t('update.installing')}</p>}

        {errored && <p className="modal-text modal-error">{t('update.failed')}</p>}

        {!downloading && !installing && !errored && (
          <p className="modal-text">{t('update.description')}</p>
        )}

        {/* ---------- Botões ---------- */}
        <div className="modal-actions">
          {downloading || installing ? (
            <button className="btn" disabled>
              {downloading ? t('update.downloadingPct', { pct: progress }) : t('update.installingTitle')}
            </button>
          ) : errored ? (
            <>
              <button className="btn" onClick={dismiss}>{t('update.notNow')}</button>
              <button className="btn primary" onClick={start}>{t('common.retry')}</button>
            </>
          ) : (
            <>
              <button className="btn" onClick={dismiss}>{t('update.notNow')}</button>
              <button className="btn primary" onClick={start}>{t('update.updateNow')}</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
