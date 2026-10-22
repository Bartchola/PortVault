import React, { useEffect, useState } from 'react'

const STATUS = {
  checking: { icon: '🔄', text: 'Procurando atualizações...' },
  update: { icon: '🚀', text: 'Atualização disponível!' },
  uptodate: { icon: '✅', text: 'Você está na versão mais recente.' },
  error: { icon: '⚠️', text: 'Não foi possível verificar agora.' },
  idle: { icon: '🔍', text: 'Clique para verificar se há novas versões.' }
}

export default function Settings() {
  const [status, setStatus] = useState('idle')
  const [info, setInfo] = useState(null)
  const [version, setVersion] = useState('...')

  // Busca a versão real (do package.json) pra mostrar sempre correta
  useEffect(() => {
    window.api.getVersion().then(setVersion)
  }, [])

  async function handleCheck() {
    setStatus('checking')
    const result = await window.api.checkForUpdates()

    if (!result.ok) {
      setInfo(result)
      setStatus('error')
    } else if (result.hasUpdate) {
      setInfo(result)
      setStatus('update')
    } else {
      setInfo(result)
      setStatus('uptodate')
    }
  }

  const currentStatus = STATUS[status]

  return (
    <div>
      <header className="page-header">
        <h1>Configurações</h1>
      </header>

      {/* ---------- Seção de atualização ---------- */}
      <section className="settings-section">
        <h2>🔄 Atualizações</h2>
        <div className="setting-card">
          <div className="setting-info">
            <p className="setting-label">Versão instalada</p>
            <p className="setting-value">v{version}</p>
          </div>
          <button className="btn primary" onClick={handleCheck} disabled={status === 'checking'}>
            {status === 'checking' ? 'Verificando...' : 'Verificar atualização'}
          </button>
        </div>

        {/* Resultado da verificação */}
        {status !== 'idle' && (
          <div className={`update-status ${status}`}>
            <span className="update-status-icon">{currentStatus.icon}</span>
            <div>
              <p className="update-status-text">{currentStatus.text}</p>
              {info?.latestVersion && (
                <p className="update-status-detail">
                  Última versão disponível: <b>v{info.latestVersion}</b>
                </p>
              )}
              {status === 'error' && info?.error && (
                <p className="update-status-detail muted">{info.error}</p>
              )}
            </div>
            {status === 'update' && (
              <button className="btn primary" onClick={() => window.api.openReleasePage()}>
                ⬇ Atualizar
              </button>
            )}
          </div>
        )}
      </section>

      {/* ---------- Sobre ---------- */}
      <section className="settings-section">
        <h2>ℹ️ Sobre</h2>
        <div className="setting-card">
          <div className="setting-info">
            <p className="setting-label">PortVault</p>
            <p className="setting-value">Launcher de ports e recomps</p>
            <p className="setting-desc">
              Feito pela comunidade, para a comunidade. Código aberto no GitHub.
            </p>
          </div>
          <button className="btn" onClick={() => window.api.openReleasePage()}>
            Ver no GitHub
          </button>
        </div>
      </section>
    </div>
  )
}
