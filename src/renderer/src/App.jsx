import React, { useState } from 'react'
import Library from './components/Library'
import Downloads from './components/Downloads'
import Folders from './components/Folders'

// Ícones em emoji pra não depender de biblioteca externa no MVP
const ICONS = { library: '🎮', downloads: '⬇️', folders: '📁' }

export default function App() {
  const [tab, setTab] = useState('library')

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-icon">🕹️</span>
          <span className="logo-text">PortVault</span>
        </div>
        <nav>
          {[
            ['library', 'Biblioteca'],
            ['downloads', 'Downloads'],
            ['folders', 'Pastas']
          ].map(([key, label]) => (
            <button
              key={key}
              className={`nav-btn ${tab === key ? 'active' : ''}`}
              onClick={() => setTab(key)}
            >
              <span>{ICONS[key]}</span> {label}
            </button>
          ))}
        </nav>
        <footer className="sidebar-footer">v0.1.0 • MVP</footer>
      </aside>

      <main className="content">
        {tab === 'library' && <Library />}
        {tab === 'downloads' && <Downloads onInstalled={() => setTab('library')} />}
        {tab === 'folders' && <Folders />}
      </main>
    </div>
  )
}
