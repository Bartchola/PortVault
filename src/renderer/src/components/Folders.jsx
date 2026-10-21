import React, { useEffect, useState } from 'react'

export default function Folders() {
  const [folders, setFolders] = useState([])
  const [scanning, setScanning] = useState(false)

  useEffect(() => { window.api.listFolders().then(setFolders) }, [])

  async function handleAdd() {
    setFolders(await window.api.addFolder())
  }

  async function handleRemove(folder) {
    setFolders(await window.api.removeFolder(folder))
  }

  async function handleScan() {
    setScanning(true)
    const result = await window.api.scanFolders()
    setScanning(false)
    alert(`Scan concluído! ${result.added} jogo(s) novo(s) adicionado(s) à biblioteca.`)
  }

  return (
    <div>
      <header className="page-header">
        <h1>Pastas de jogos</h1>
        <button className="btn primary" onClick={handleScan} disabled={scanning || folders.length === 0}>
          {scanning ? 'Escaneando...' : '🔍 Escanear agora'}
        </button>
      </header>

      <p className="muted">
        Adicione as pastas onde seus ports e recomps estão. O PortVault procura os executáveis e monta sua biblioteca.
      </p>

      <button className="btn" onClick={handleAdd}>+ Adicionar pasta</button>

      <ul className="folder-list">
        {folders.map((folder) => (
          <li key={folder} className="folder-item">
            <span title={folder}>📁 {folder}</span>
            <button className="btn small danger" onClick={() => handleRemove(folder)}>✕</button>
          </li>
        ))}
      </ul>

      {folders.length === 0 && <p className="muted">Nenhuma pasta adicionada ainda.</p>}
    </div>
  )
}
