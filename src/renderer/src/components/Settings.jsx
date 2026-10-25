import React, { useEffect, useState } from 'react'

const STATUS = {
  checking: { icon: '🔄', text: 'Procurando atualizações...' },
  update: { icon: '🚀', text: 'Atualização disponível!' },
  uptodate: { icon: '✅', text: 'Você está na versão mais recente.' },
  error: { icon: '⚠️', text: 'Não foi possível verificar agora.' },
  idle: { icon: '🔍', text: 'Clique para verificar se há novas versões.' }
}

// `updater` vem do App (compartilha o progresso do download com o pop-up).
export default function Settings({ updater }) {
  const [status, setStatus] = useState('idle')
  const [info, setInfo] = useState(null)
  const [version, setVersion] = useState('...')
  // RetroAchievements (credenciais + estado da conexão)
  const [ra, setRa] = useState({ username: '', apiKey: '' })
  const [raStatus, setRaStatus] = useState('idle') // idle | checking | ok | error
  const [raMsg, setRaMsg] = useState('')

  const phase = updater?.phase || 'idle'
  const progress = updater?.progress || 0
  const downloading = phase === 'downloading'
  const installing = phase === 'installing'
  const failed = phase === 'error' && status === 'update'

  // Busca a versão real (do package.json) pra mostrar sempre correta
  useEffect(() => {
    window.api.getVersion().then(setVersion)
  }, [])

  // Carrega as credenciais salvas do RetroAchievements
  useEffect(() => {
    window.api.raConfigGet().then((cfg) => {
      setRa({ username: cfg.username || '', apiKey: cfg.apiKey || '' })
      if (cfg.apiKey) setRaStatus('ok') // já tinha chave salva
    })
  }, [])

  // Salva e valida a chave do RetroAchievements
  async function handleRaConnect() {
    setRaStatus('checking')
    setRaMsg('')
    await window.api.raConfigSave(ra)
    const result = await window.api.raVerify()
    if (result.ok) {
      setRaStatus('ok')
      setRaMsg(`Conectado! ${result.consoles} consoles disponíveis.`)
    } else {
      setRaStatus('error')
      setRaMsg(result.error)
    }
  }

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
  // Ícone muda conforme o que está acontecendo agora
  const icon = downloading ? '⬇️' : installing ? '⚙️' : failed ? '⚠️' : currentStatus.icon

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
          <button className="btn primary" onClick={handleCheck} disabled={status === 'checking' || downloading || installing}>
            {status === 'checking' ? 'Verificando...' : 'Verificar atualização'}
          </button>
        </div>

        {/* Resultado da verificação / progresso do download */}
        {status !== 'idle' && (
          <div className={`update-status ${failed ? 'error' : downloading || installing ? 'update' : status}`}>
            <span className="update-status-icon">{icon}</span>
            <div className="update-status-main">
              {downloading ? (
                <>
                  <p className="update-status-text">Baixando nova versão...</p>
                  <div className="progress-bar update-progress">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                </>
              ) : installing ? (
                <p className="update-status-text">Instalando... o launcher vai reabrir sozinho.</p>
              ) : failed ? (
                <>
                  <p className="update-status-text">Falha no download da atualização.</p>
                  <p className="update-status-detail muted">Verifique sua conexão e tente de novo.</p>
                </>
              ) : (
                <>
                  <p className="update-status-text">{currentStatus.text}</p>
                  {info?.latestVersion && (
                    <p className="update-status-detail">
                      Última versão disponível: <b>v{info.latestVersion}</b>
                    </p>
                  )}
                  {status === 'error' && info?.error && (
                    <p className="update-status-detail muted">{info.error}</p>
                  )}
                </>
              )}
            </div>

            {/* Ação à direita */}
            {downloading ? (
              <button className="btn" disabled>{progress}%</button>
            ) : installing ? (
              <button className="btn" disabled>Instalando...</button>
            ) : failed ? (
              <button className="btn primary" onClick={updater.start}>↻ Tentar de novo</button>
            ) : status === 'update' ? (
              <button className="btn primary" onClick={updater.start}>⬇ Atualizar</button>
            ) : null}
          </div>
        )}
      </section>

      {/* ---------- RetroAchievements ---------- */}
      <section className="settings-section">
        <h2>🕹️ RetroAchievements</h2>
        <div className="setting-card">
          <div className="setting-info">
            <p className="setting-label">Importar conquistas oficiais</p>
            <p className="setting-desc">
              Conecte sua conta pra puxar as conquistas do RetroAchievements
              para os seus jogos. Pega a sua chave em{' '}
              <b>retroachievements.org → Settings → Web API</b>.
            </p>
          </div>
        </div>

        <div className="ra-form">
          <div className="ra-field">
            <label>Usuário (opcional)</label>
            <input
              placeholder="Seu usuário do RA"
              value={ra.username}
              onChange={(e) => setRa({ ...ra, username: e.target.value })}
            />
          </div>
          <div className="ra-field">
            <label>Chave de API *</label>
            <input
              type="password"
              placeholder="Chave do Web API"
              value={ra.apiKey}
              onChange={(e) => setRa({ ...ra, apiKey: e.target.value })}
            />
          </div>
          <button
            className="btn primary"
            onClick={handleRaConnect}
            disabled={raStatus === 'checking'}
          >
            {raStatus === 'checking' ? 'Conectando...' : 'Conectar'}
          </button>
        </div>

        {raMsg && (
          <p className={`ra-status ${raStatus === 'error' ? 'error' : 'ok'}`}>
            {raStatus === 'error' ? '⚠️ ' : '✅ '}{raMsg}
          </p>
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
