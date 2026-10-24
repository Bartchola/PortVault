import React, { useState, useEffect } from 'react'
import Library from './components/Library'
import Downloads from './components/Downloads'
import Folders from './components/Folders'
import Settings from './components/Settings'
import Achievements from './components/Achievements'
import UpdateModal from './components/UpdateModal'

// Ícones em emoji pra não depender de biblioteca externa no MVP
const ICONS = { library: '🎮', achievements: '🏆', downloads: '⬇️', folders: '📁', settings: '⚙️' }

const TABS = [
  ['library', 'Biblioteca'],
  ['achievements', 'Conquistas'],
  ['downloads', 'Downloads'],
  ['folders', 'Pastas'],
  ['settings', 'Configurações']
]

export default function App() {
  const [tab, setTab] = useState('library')
  const [version, setVersion] = useState('...')
  const [updateInfo, setUpdateInfo] = useState(null) // dados pro pop-up (versão disponível)
  const [upPhase, setUpPhase] = useState('idle') // idle | downloading | installing | error
  const [upProgress, setUpProgress] = useState(0) // 0-100 durante o download

  // Busca a versão real (do package.json) pro rodapé nunca dessincronizar
  useEffect(() => {
    window.api.getVersion().then(setVersion)
  }, [])

  // Registrados UMA vez: recebem os eventos do updater lá no processo principal
  useEffect(() => {
    const offs = [
      window.api.onUpdaterProgress((p) => {
        setUpProgress(Math.round(p?.percent || 0))
        setUpPhase('downloading')
      }),
      window.api.onUpdaterDownloaded(() => {
        // Download pronto: instala na hora de forma silenciosa e reabre
        setUpPhase('installing')
        try { window.api.installUpdate() } catch { setUpPhase('error') }
      }),
      window.api.onUpdaterError(() => setUpPhase('error'))
    ]
    return () => offs.forEach((off) => off && off())
  }, [])

  // Checa atualização automaticamente ao abrir o launcher
  useEffect(() => {
    let cancelled = false
    async function check() {
      const result = await window.api.checkForUpdates()
      // Só mostra o pop-up se achou versão mais nova. Erros de rede são
      // ignorados na abertura pra não incomodar (dá pra checar em Configurações).
      if (!cancelled && result.ok && result.hasUpdate) setUpdateInfo(result)
    }
    check()
    return () => { cancelled = true }
  }, [])

  // Inicia o download da nova versão (o progresso chega pelos eventos acima)
  function startUpdate() {
    setUpProgress(0)
    setUpPhase('downloading')
    window.api.downloadUpdate().catch(() => setUpPhase('error'))
  }

  const updater = {
    info: updateInfo,
    phase: upPhase,
    progress: upProgress,
    start: startUpdate,
    dismiss: () => setUpdateInfo(null)
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-icon">🕹️</span>
          <span className="logo-text">PortVault</span>
        </div>
        <nav>
          {TABS.map(([key, label]) => (
            <button
              key={key}
              className={`nav-btn ${tab === key ? 'active' : ''}`}
              onClick={() => setTab(key)}
            >
              <span>{ICONS[key]}</span> {label}
            </button>
          ))}
        </nav>
        <footer className="sidebar-footer">v{version} • MVP</footer>
      </aside>

      <main className="content">
        {tab === 'library' && <Library />}
        {tab === 'achievements' && <Achievements />}
        {tab === 'downloads' && <Downloads onInstalled={() => setTab('library')} />}
        {tab === 'folders' && <Folders />}
        {tab === 'settings' && <Settings updater={updater} />}
      </main>

      {/* Pop-up de nova versão, se houver atualização disponível */}
      <UpdateModal updater={updater} />
    </div>
  )
}
