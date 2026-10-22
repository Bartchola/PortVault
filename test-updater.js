// Teste da lógica do updater, sem Electron (espelha src/main/updater.js)
const https = require('https')

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
  return false
}

const casos = [
  ['0.1.1', '0.2.0', false, 'latest(0.1.1) < atual(0.2.0): sem update'],
  ['0.2.0', '0.1.1', true, 'latest(0.2.0) > atual(0.1.1): TEM update'],
  ['v1.0.0', '0.9.9', true, 'major maior: TEM update'],
  ['1.0.0', '1.0.0', false, 'igual: sem update'],
  ['1.10.0', '1.9.0', true, '1.10 > 1.9 (não é texto): TEM update'],
  ['0.2.1', '0.2.0', true, 'patch maior: TEM update']
]

let falhas = 0
for (const [latest, current, esperado, desc] of casos) {
  const obtido = isNewer(latest, current)
  const ok = obtido === esperado
  if (!ok) falhas++
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${desc} (latest=${latest}, atual=${current}, obtido=${obtido}, esperado=${esperado})`)
}

// Teste real do fetch da tag via redirect
const LATEST_URL = 'https://github.com/Bartchola/PortVault/releases/latest'
function fetchLatestTag() {
  return new Promise((resolve, reject) => {
    const req = https.request(LATEST_URL, { method: 'HEAD', timeout: 8000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const m = res.headers.location.match(/\/tag\/(.+)$/)
        if (m) return resolve(decodeURIComponent(m[1]))
        return reject(new Error('redirect sem tag'))
      }
      reject(new Error(`status ${res.statusCode}`))
    })
    req.on('timeout', () => req.destroy(new Error('timeout')))
    req.on('error', reject)
    req.end()
  })
}

fetchLatestTag()
  .then((tag) => {
    console.log(`PASS | fetch da tag real: ${tag}`)
    console.log(`INFO | nossa versão atual é 0.2.0 -> tem update? ${isNewer(tag.replace(/^v/, ''), '0.2.0')} (esperado: false, pois 0.2.0 > 0.1.1)`)
    console.log(falhas === 0 ? '\nTODOS OS TESTES PASSARAM' : `\n${falhas} FALHAS`)
    process.exit(falhas === 0 ? 0 : 1)
  })
  .catch((e) => {
    console.log(`FAIL | fetch: ${e.message}`)
    process.exit(1)
  })
