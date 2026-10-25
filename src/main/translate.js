// Tradução automática das conquistas do RetroAchievements — que são em inglês —
// para português, usando o endpoint público do Google Translate (sem chave e
// sem cadastro).
//
// COMO FUNCIONA:
// - Juntamos vários textos separando por \n, mandamos tudo numa requisição só
//   (lote) e separamos de volta. O Google preserva as quebras de linha, então um
//   jogo inteiro leva poucas requisições em vez de uma por conquista.
// - O Google limita por "client" (gtx toma 429 rápido), então tentamos vários
//   clients em sequência e lembramos qual deu certo da última vez.
// - Se todos falharem, devolvemos `null` e o chamador fica com o inglês
//   original — nunca fica "metade traduzido, metade não".

const ENDPOINT = 'https://translate.googleapis.com/translate_a/single'
const TARGET = 'pt' // destino: as conquistas do RA são em inglês
const CHUNK = 20 // textos por requisição (evita URL gigante)
const CLIENTS = ['dict-chrome-ex', 'gtx', 'at']

// Índice do client que deu certo por último (evita começar sempre pelo que está limitado)
let preferred = 0

async function translateChunk(texts) {
  const q = encodeURIComponent(texts.join('\n'))
  // começa pelo que funcionou da vez passada, depois tenta os outros
  const order = [preferred, ...CLIENTS.map((_, i) => i).filter((i) => i !== preferred)]
  let lastError = 'sem rota disponível'

  for (const idx of order) {
    try {
      const res = await fetch(`${ENDPOINT}?client=${CLIENTS[idx]}&sl=en&tl=${TARGET}&dt=t&q=${q}`)
      if (!res.ok) { lastError = `HTTP ${res.status}`; continue } // 429/erro: próximo client
      const json = await res.json()
      // A resposta vem em segmentos: juntamos e separamos de volta por linha
      const parts = (json[0] || []).map((s) => s[0]).join('').split('\n')
      if (parts.length !== texts.length) { lastError = 'linhas mudaram no lote'; continue }
      preferred = idx // lembra que esse client está de pé
      return parts
    } catch (e) {
      lastError = e.message
    }
  }
  throw new Error(lastError)
}

// Traduz uma lista de textos. Devolve a lista com as traduções, ou `null`
// se nenhuma rota funcionou (aí o chamador mantém os originais).
export async function translateList(texts) {
  const original = texts.map((t) => String(t ?? ''))
  // Só traduz o que tem texto — linhas vazias sairiam do padrão do lote
  const todo = []
  const where = []
  original.forEach((t, i) => {
    if (t.trim()) { todo.push(t); where.push(i) }
  })
  if (todo.length === 0) return original

  const out = original.slice()
  try {
    for (let i = 0; i < todo.length; i += CHUNK) {
      const done = await translateChunk(todo.slice(i, i + CHUNK))
      done.forEach((text, k) => { out[where[i + k]] = text })
    }
    return out
  } catch (e) {
    // Falhou em todas as rotas: mantém o inglês original. Deixa o log porque é
    // a primeira pergunta do usuário quando as conquistas aparecem em inglês.
    console.log(`[PortVault] tradução das conquistas falhou: ${e.message}`)
    return null
  }
}
