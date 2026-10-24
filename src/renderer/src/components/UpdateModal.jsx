import React from 'react'

// Pop-up exibido na abertura quando existe uma versão mais nova.
// Em vez de abrir o navegador, ele BAIXA dentro do launcher (barra de
// progresso) e instala sozinho, de forma silenciosa.
export default function UpdateModal({ updater }) {
  const { info, phase, progress, start, dismiss } = updater
  if (!info) return null

  const downloading = phase === 'downloading'
  const installing = phase === 'installing'
  const errored = phase === 'error'

  return (
    <div className="modal-overlay" onClick={downloading || installing ? undefined : dismiss}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon">{installing ? '⚙️' : '🚀'}</div>
        <h2>{installing ? 'Instalando...' : 'Nova versão disponível!'}</h2>

        <p className="modal-versions">
          <span className="badge installed">v{info.currentVersion}</span>
          <span className="arrow">→</span>
          <span className="badge latest">v{info.latestVersion}</span>
        </p>

        {/* ---------- Área de progresso / mensagens ---------- */}
        {downloading && (
          <div className="modal-download">
            <p className="modal-text">Baixando a nova versão...</p>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <p className="modal-progress-pct">{progress}%</p>
          </div>
        )}

        {installing && (
          <p className="modal-text">
            Instalando a atualização. O PortVault vai reabrir sozinho em instantes...
          </p>
        )}

        {errored && (
          <p className="modal-text modal-error">
            Não foi possível baixar agora. Verifique sua conexão e tente de novo.
          </p>
        )}

        {!downloading && !installing && !errored && (
          <p className="modal-text">
            Uma nova versão do PortVault foi publicada. Baixe e instale
            direto aqui, sem sair do launcher.
          </p>
        )}

        {/* ---------- Botões ---------- */}
        <div className="modal-actions">
          {downloading || installing ? (
            <button className="btn" disabled>
              {downloading ? `Baixando ${progress}%` : 'Instalando...'}
            </button>
          ) : errored ? (
            <>
              <button className="btn" onClick={dismiss}>Agora não</button>
              <button className="btn primary" onClick={start}>↻ Tentar de novo</button>
            </>
          ) : (
            <>
              <button className="btn" onClick={dismiss}>Agora não</button>
              <button className="btn primary" onClick={start}>⬇ Atualizar agora</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
