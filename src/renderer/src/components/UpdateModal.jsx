import React from 'react'

// Pop-up exibido na abertura quando existe uma versão mais nova no GitHub.
export default function UpdateModal({ info, onDismiss }) {
  if (!info) return null

  return (
    <div className="modal-overlay" onClick={onDismiss}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon">🚀</div>
        <h2>Nova versão disponível!</h2>
        <p className="modal-versions">
          <span className="badge installed">v{info.currentVersion}</span>
          <span className="arrow">→</span>
          <span className="badge latest">v{info.latestVersion}</span>
        </p>
        <p className="modal-text">
          Uma nova versão do PortVault foi publicada. Atualize para ter as
          últimas funcionalidades e correções.
        </p>
        <div className="modal-actions">
          <button className="btn" onClick={onDismiss}>Agora não</button>
          <button className="btn primary" onClick={() => window.api.openReleasePage()}>
            ⬇ Atualizar agora
          </button>
        </div>
      </div>
    </div>
  )
}
