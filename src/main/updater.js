// Checagem de atualização usando os releases do GitHub.
//
// Estratégia: usamos o redirect da página "releases/latest" em vez da API
// do GitHub. A API autenticada tem "rate limit" (limite de chamadas) e
// bloquearia quem abre o launcher muitas vezes. O redirect abaixo é leve,
// público e sempre aponta pra última versão estável.

import https from 'https'
import { shell, app, Notification } from 'electron'

// Dono e repositório do projeto no GitHub
const OWNER = 'Bartchola'
const REPO = 'PortVault'
const LATEST_URL = `https://github.com/${OWNER}/${REPO}/releases/latest`
const RELEASES_URL = `https://github.com/${OWNER}/${REPO}/releases`

// Comparação simples de versão "semver" (ex: 0.2.0 > 0.1.1)
function isNewer(latest, current) {
  const parse = (v) => String(v).replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0)
  const a = parse(latest)
  const b = parse(current)
  const len = Math.max(a.length, b.length)
  for (let i = 0; i < len; i++) {
    const x = a[i] ?? 0
    const y = b[i] ?? 0
    if (x > y) return true
    if (x < y) return false
  }
  return false // igual ou anterior
}

// Faz uma requisição HEAD seguindo o redirect até achar a tag da release
function fetchLatestTag() {
  return new Promise((resolve, reject) => {
    const request = (url, depth = 0) => {
      if (depth > 5) return reject(new Error('Muitos redirects'))

      const req = https.request(url, { method: 'HEAD', timeout: 8000 }, (res) => {
        // 302/301 = redireciona pra /releases/tag/vX.Y.Z
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const location = new URL(res.headers.location, url).toString()
          const match = location.match(/\/tag\/(.+)$/)
          if (match) return resolve(decodeURIComponent(match[1]))
          return request(location, depth + 1)
        }
        reject(new Error(`Resposta inesperada do GitHub (${res.statusCode})`))
      })

      req.on('timeout', () => req.destroy(new Error('Tempo esgotado')))
      req.on('error', reject)
      req.end()
    }

    request(LATEST_URL)
  })
}

/**
 * Compara a versão instalado com a última release.
 * Retorna { ok, hasUpdate, currentVersion, latestVersion, url }
 */
export async function checkForUpdates() {
  const currentVersion = app.getVersion()

  try {
    const latestTag = await fetchLatestTag()
    const latestVersion = latestTag.replace(/^v/, '')

    return {
      ok: true,
      hasUpdate: isNewer(latestVersion, currentVersion),
      currentVersion,
      latestVersion,
      url: LATEST_URL
    }
  } catch (err) {
    // Sem internet ou GitHub fora do ar: não é um erro fatal, só avisamos.
    return { ok: false, error: err.message, currentVersion }
  }
}

// Abre a página de downloads no navegador do usuário
export function openReleasePage() {
  return shell.openExternal(RELEASES_URL)
}

// Mostra um aviso nativo do Windows (usado em alguns casos)
export function notifyUpdate(info) {
  if (!Notification.isSupported()) return
  const n = new Notification({
    title: 'Nova versão disponível',
    body: `PortVault ${info.latestVersion} já está disponível. Clique para baixar.`
  })
  n.on('click', () => openReleasePage())
  n.show()
}
