import React, { useEffect, useState } from 'react'
import { useI18n, LANGS } from '../i18n'

// Cada estado guarda a CHAVE do texto e o ícone (o texto é traduzido na hora)
const STATUS = {
  checking: 'settings.status.checking',
  update: 'settings.status.update',
  uptodate: 'settings.status.uptodate',
  error: 'settings.status.error',
  idle: 'settings.status.idle'
}
const STATUS_ICON = { checking: '🔄', update: '🚀', uptodate: '✅', error: '⚠️', idle: '🔍' }

// `updater` vem do App (compartilha o progresso do download com o pop-up).
export default function Settings({ updater }) {
  const [status, setStatus] = useState('idle')
  const [info, setInfo] = useState(null)
  const [version, setVersion] = useState('...')
  // RetroAchievements (credenciais + estado da conexão)
  const [ra, setRa] = useState({ username: '', apiKey: '' })
  const [raStatus, setRaStatus] = useState('idle') // idle | checking | ok | error
  const [raMsg, setRaMsg] = useState(null) // { k: chave, p?: params }
  const { t, tr, lang, setLang } = useI18n()

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
    setRaMsg(null)
    await window.api.raConfigSave(ra)
    const result = await window.api.raVerify()
    if (result.ok) {
      setRaStatus('ok')
      setRaMsg({ k: 'settings.raConnected', p: { consoles: result.consoles } })
    } else {
      setRaStatus('error')
      setRaMsg({ k: result.error })
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

  // Ícone muda conforme o que está acontecendo agora
  const icon = downloading ? '⬇️' : installing ? '⚙️' : failed ? '⚠️' : STATUS_ICON[status]

  return (
    <div>
      <header className="page-header">
        <h1>{t('settings.title')}</h1>
      </header>

      {/* ---------- Seção de idioma ---------- */}
      <section className="settings-section">
        <h2>{t('settings.language')}</h2>
        <div className="setting-card">
          <div className="setting-info">
            <p className="setting-label">{t('settings.languageLabel')}</p>
            <p className="setting-desc">{t('settings.languageDesc')}</p>
          </div>
          <select
            aria-label={t('settings.languageLabel')}
            value={lang}
            onChange={(e) => setLang(e.target.value)}
          >
            {LANGS.map((l) => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </select>
        </div>
      </section>

      {/* ---------- Seção de atualização ---------- */}
      <section className="settings-section">
        <h2>{t('settings.updates')}</h2>
        <div className="setting-card">
          <div className="setting-info">
            <p className="setting-label">{t('settings.installedVersion')}</p>
            <p className="setting-value">v{version}</p>
          </div>
          <button className="btn primary" onClick={handleCheck} disabled={status === 'checking' || downloading || installing}>
            {status === 'checking' ? t('settings.checking') : t('settings.checkUpdate')}
          </button>
        </div>

        {/* Resultado da verificação / progresso do download */}
        {status !== 'idle' && (
          <div className={`update-status ${failed ? 'error' : downloading || installing ? 'update' : status}`}>
            <span className="update-status-icon">{icon}</span>
            <div className="update-status-main">
              {downloading ? (
                <>
                  <p className="update-status-text">{t('settings.downloading')}</p>
                  <div className="progress-bar update-progress">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                </>
              ) : installing ? (
                <p className="update-status-text">{t('settings.installing')}</p>
              ) : failed ? (
                <>
                  <p className="update-status-text">{t('settings.updateFailed')}</p>
                  <p className="update-status-detail muted">{t('common.checkConnection')}</p>
                </>
              ) : (
                <>
                  <p className="update-status-text">{t(STATUS[status])}</p>
                  {info?.latestVersion && (
                    <p className="update-status-detail">
                      {t('settings.latestVersion')}<b>v{info.latestVersion}</b>
                    </p>
                  )}
                  {status === 'error' && info?.error && (
                    <p className="update-status-detail muted">{tr(info.error)}</p>
                  )}
                </>
              )}
            </div>

            {/* Ação à direita */}
            {downloading ? (
              <button className="btn" disabled>{t('settings.pct', { pct: progress })}</button>
            ) : installing ? (
              <button className="btn" disabled>{t('update.installingTitle')}</button>
            ) : failed ? (
              <button className="btn primary" onClick={updater.start}>{t('common.retry')}</button>
            ) : status === 'update' ? (
              <button className="btn primary" onClick={updater.start}>{t('settings.updateNow')}</button>
            ) : null}
          </div>
        )}
      </section>

      {/* ---------- RetroAchievements ---------- */}
      <section className="settings-section">
        <h2>{t('settings.ra')}</h2>
        <div className="setting-card">
          <div className="setting-info">
            <p className="setting-label">{t('settings.raTitle')}</p>
            <p className="setting-desc">
              {t('settings.raDescA')}
              <b>{t('settings.raKeyWhere')}{t('settings.raDescB')}{t('settings.raKeyWhere2')}</b>
              {t('settings.raDescC')}
            </p>
          </div>
        </div>

        <div className="ra-form">
          <div className="ra-field">
            <label>{t('settings.raUser')}</label>
            <input
              placeholder={t('settings.raUserPh')}
              value={ra.username}
              onChange={(e) => setRa({ ...ra, username: e.target.value })}
            />
          </div>
          <div className="ra-field">
            <label>{t('settings.raKey')}</label>
            <input
              type="password"
              placeholder={t('settings.raKeyPh')}
              value={ra.apiKey}
              onChange={(e) => setRa({ ...ra, apiKey: e.target.value })}
            />
          </div>
          <button
            className="btn primary"
            onClick={handleRaConnect}
            disabled={raStatus === 'checking'}
          >
            {raStatus === 'checking' ? t('settings.connecting') : t('settings.connect')}
          </button>
        </div>

        {raMsg && (
          <p className={`ra-status ${raStatus === 'error' ? 'error' : 'ok'}`}>
            {raStatus === 'error' ? '⚠️ ' : '✅ '}
            {raMsg.p ? t(raMsg.k, raMsg.p) : tr(raMsg.k)}
          </p>
        )}
      </section>

      {/* ---------- Sobre ---------- */}
      <section className="settings-section">
        <h2>{t('settings.about')}</h2>
        <div className="setting-card">
          <div className="setting-info">
            <p className="setting-label">PortVault</p>
            <p className="setting-value">{t('settings.aboutSubtitle')}</p>
            <p className="setting-desc">{t('settings.aboutDesc')}</p>
          </div>
          <button className="btn" onClick={() => window.api.openReleasePage()}>
            {t('settings.viewGithub')}
          </button>
        </div>
      </section>
    </div>
  )
}
