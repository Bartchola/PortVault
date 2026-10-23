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
  const [updateInfo, setUpdateInfo] = useState(null)

  // Busca a versão real (do package.json) pro rodapé nunca dessincronizar
  useEffect(() => {
    window.api.getVersion().then(setVersion)
  }, [])

  // Checa atualização automaticamente ao abrir o launcher
  useEffect(() => {
    let cancelled = false

    async function check() {
      const result = await window.api.checkForUpdates()
      // Só mostra o pop-up se achou versão mais nova. Erros de rede
      // são ignorados na abertura pra não incomodar (dá pra checar
      // manualmente na aba Configurações).
      if (!cancelled && result.ok && result.hasUpdate) {
        setUpdateInfo(result)
      }
    }

    check()
    return () => { cancelled = true }
  }, [])

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
        {tab === 'settings' && <Settings />}
      </main>

      {/* Pop-up de nova versão, se houver atualização disponível */}
      <UpdateModal info={updateInfo} onDismiss={() => setUpdateInfo(null)} />
    </div>
  )
}
