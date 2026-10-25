import React, { useEffect, useState } from 'react'
import { useI18n } from '../i18n'

export default function Folders() {
  const [folders, setFolders] = useState([])
  const [scanning, setScanning] = useState(false)
  const { t } = useI18n()

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
    alert(t('folders.scanDone', { added: result.added }))
  }

  return (
    <div>
      <header className="page-header">
        <h1>{t('folders.title')}</h1>
        <button className="btn primary" onClick={handleScan} disabled={scanning || folders.length === 0}>
          {scanning ? t('folders.scanning') : t('folders.scanNow')}
        </button>
      </header>

      <p className="muted">{t('folders.hint')}</p>

      <button className="btn" onClick={handleAdd}>{t('folders.add')}</button>

      <ul className="folder-list">
        {folders.map((folder) => (
          <li key={folder} className="folder-item">
            <span title={folder}>📁 {folder}</span>
            <button className="btn small danger" onClick={() => handleRemove(folder)}>✕</button>
          </li>
        ))}
      </ul>

      {folders.length === 0 && <p className="muted">{t('folders.empty')}</p>}
    </div>
  )
}
