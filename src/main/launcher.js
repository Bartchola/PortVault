// Executa os jogos. Um detalhe importante: muitos ports precisam rodar
// com o "working directory" igual à pasta do .exe, senão não acha os assets.

import path from 'path'
import { spawn, exec } from 'child_process'

export function launchGame(game) {
  return new Promise((resolve, reject) => {
    const child = spawn(game.exePath, [], {
      cwd: path.dirname(game.exePath),
      detached: true, // deixa o jogo rodar independente do launcher
      stdio: 'ignore'
    })

    child.on('error', reject)
    child.unref() // o launcher pode fechar que o jogo continua
    resolve({ ok: true, pid: child.pid })
  })
}

// Abre a pasta do jogo no Explorer (útil pra achar saves e configs)
export function openGameFolder(game) {
  const dir = path.dirname(game.exePath)
  exec(`explorer "${dir}"`)
}
