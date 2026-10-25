import React, { createContext, useContext, useEffect, useState } from 'react'

// Internacionalização do PortVault (inglês e português).
//
// COMO FUNCIONA:
// - Todo texto visível vira uma chave aqui. Os componentes chamam `t('chave')`.
// - O processo principal (cérebro) também manda CHAVES de erro ('err.ra.http|404')
//   em vez de frases prontas; assim nada fica "metade PT, metade EN". Pra isso
//   existe o `tr()`, que traduz se for chave e repassa cru se não for (mensagem
//   vinda de fora, tipo erro de rede do electron-updater).
// - O idioma escolhido fica salvo em library.json ('locale') e é lido pelo provider.

export const LANGS = [
  { id: 'pt', label: 'Português' },
  { id: 'en', label: 'English' }
]

const MESSAGES = {
  pt: {
    // ---------- comum ----------
    'common.loading': 'Carregando...',
    'common.save': 'Salvar',
    'common.cancel': 'Cancelar',
    'common.close': 'Fechar',
    'common.retry': '↻ Tentar de novo',
    'common.checkConnection': 'Verifique sua conexão e tente de novo.',
    'common.searching': 'Buscando...',
    'common.search': 'Buscar',
    'common.back': '← Voltar',

    // ---------- navegação ----------
    'nav.library': 'Biblioteca',
    'nav.achievements': 'Conquistas',
    'nav.downloads': 'Downloads',
    'nav.folders': 'Pastas',
    'nav.settings': 'Configurações',

    // ---------- biblioteca ----------
    'library.add': '+ Adicionar jogo',
    'library.empty': 'Nenhum jogo na biblioteca ainda.',
    'library.emptyHintA': 'Vá em ',
    'library.emptyHintB': ' para escanear seus jogos, ou ',
    'library.emptyHintC': ' para instalar um port.',
    'library.play': 'Jogar',
    'library.openFolder': 'Abrir pasta do jogo',
    'library.importRa': 'Importar conquistas do RetroAchievements',
    'library.remove': 'Remover da biblioteca',
    'library.launchError': 'Não foi possível abrir o jogo:',
    'library.confirmRemove': 'Remover "{name}" da biblioteca? (O jogo não será apagado do PC)',

    // ---------- conquistas ----------
    'ach.title': 'Conquistas',
    'ach.summaryOf': '/ {total} desbloqueadas',
    'ach.empty': 'Nenhum jogo na biblioteca ainda.',
    'ach.emptyHintA': 'Adicione jogos na ',
    'ach.emptyHintB': ' para ver as conquistas de cada um.',
    'ach.emptyGame': 'Este jogo ainda não tem conquistas.',
    'ach.unlockedAt': 'Desbloqueada em {date}',
    'ach.pts': '{points} pts',
    'ach.unlock': 'Desbloquear',
    'ach.markLocked': 'Marcar como bloqueada',
    'ach.remove': 'Remover conquista',
    'ach.add': '+ Adicionar conquista',
    'ach.formEmoji': 'Emoji da conquista',
    'ach.formName': 'Nome da conquista',
    'ach.formDesc': 'Descrição (opcional)',
    'ach.syncRa': '↻ Sincronizar com o RetroAchievements',
    'ach.syncRaHint': 'Importa o que você já desbloqueou no emulador, com a data real.',
    'ach.syncRaDone': 'Sincronizadas {n} conquistas novas do RetroAchievements.',
    'ach.syncRaUptodate': 'Tudo em dia — nada novo no RetroAchievements.',

    // ---------- downloads ----------
    'dl.title': 'Downloads',
    'dl.placeholder': 'Cole o link direto de um port/recomp (.zip ou .exe)...',
    'dl.downloadInstall': 'Baixar e instalar',
    'dl.downloading': 'Baixando...',
    'dl.hint': 'Funciona com links diretos (.zip, .exe). O jogo é extraído e adicionado à biblioteca automaticamente.',
    'dl.starting': 'Iniciando...',
    'dl.error': 'Erro: {msg}',
    'stage.baixando': 'Baixando',
    'stage.extraindo': 'Extraindo',
    'stage.registrando': 'Adicionando à biblioteca',
    'stage.concluido': 'Concluído ✅',

    // ---------- pastas ----------
    'folders.title': 'Pastas de jogos',
    'folders.hint': 'Adicione as pastas onde seus ports e recomps estão. O PortVault procura os executáveis e monta sua biblioteca.',
    'folders.add': '+ Adicionar pasta',
    'folders.empty': 'Nenhuma pasta adicionada ainda.',
    'folders.scanNow': '🔍 Escanear agora',
    'folders.scanning': 'Escaneando...',
    'folders.scanDone': 'Scan concluído! {added} jogo(s) novo(s) adicionado(s) à biblioteca.',

    // ---------- configurações ----------
    'settings.title': 'Configurações',
    'settings.language': '🌐 Idioma',
    'settings.languageDesc': 'Idioma do launcher. As conquistas do RetroAchievements são traduzidas automaticamente para o português.',
    'settings.languageLabel': 'Idioma do launcher',
    'settings.updates': '🔄 Atualizações',
    'settings.installedVersion': 'Versão instalada',
    'settings.checkUpdate': 'Verificar atualização',
    'settings.checking': 'Verificando...',
    'settings.latestVersion': 'Última versão disponível: ',
    'settings.updateFailed': 'Falha no download da atualização.',
    'settings.downloading': 'Baixando nova versão...',
    'settings.installing': 'Instalando... o launcher vai reabrir sozinho.',
    'settings.pct': '{pct}%',
    'settings.updateNow': '⬇ Atualizar',
    'settings.status.checking': 'Procurando atualizações...',
    'settings.status.update': 'Atualização disponível!',
    'settings.status.uptodate': 'Você está na versão mais recente.',
    'settings.status.error': 'Não foi possível verificar agora.',
    'settings.status.idle': 'Clique para verificar se há novas versões.',
    'settings.ra': '🕹️ RetroAchievements',
    'settings.raTitle': 'Importar conquistas oficiais',
    'settings.raDescA': 'Conecte sua conta pra puxar as conquistas do RetroAchievements para os seus jogos. Pega a sua chave em ',
    'settings.raDescB': ' → ',
    'settings.raDescC': '.',
    'settings.raKeyWhere': 'retroachievements.org',
    'settings.raKeyWhere2': 'Control Panel → Keys',
    'settings.raUser': 'Usuário',
    'settings.raUserPh': 'Seu usuário do RA',
    'settings.raUserHint': 'Usuário necessário pra sincronizar seus desbloqueios; pra importar a lista de conquistas, só a chave.',
    'settings.raKey': 'Chave de API *',
    'settings.raKeyPh': 'Chave do Web API',
    'settings.connect': 'Conectar',
    'settings.connecting': 'Conectando...',
    'settings.raConnected': 'Conectado! {consoles} consoles disponíveis.',
    'settings.about': 'ℹ️ Sobre',
    'settings.aboutSubtitle': 'Launcher de ports e recomps',
    'settings.aboutDesc': 'Feito pela comunidade, para a comunidade. Código aberto no GitHub.',
    'settings.viewGithub': 'Ver no GitHub',

    // ---------- pop-up de atualização ----------
    'update.newVersion': 'Nova versão disponível!',
    'update.installingTitle': 'Instalando...',
    'update.downloading': 'Baixando a nova versão...',
    'update.installing': 'Instalando a atualização. O PortVault vai reabrir sozinho em instantes...',
    'update.failed': 'Não foi possível baixar agora. Verifique sua conexão e tente de novo.',
    'update.description': 'Uma nova versão do PortVault foi publicada. Baixe e instale direto aqui, sem sair do launcher.',
    'update.downloadingPct': 'Baixando {pct}%',
    'update.notNow': 'Agora não',
    'update.updateNow': '⬇ Atualizar agora',

    // ---------- modal do RetroAchievements ----------
    'ra.importTitle': 'Importar conquistas',
    'ra.doneTitle': 'Conquistas importadas!',
    'ra.doneBody': ' conquistas do RetroAchievements foram adicionadas a ',
    'ra.notConnectedTitle': 'RetroAchievements não conectado',
    'ra.notConnectedBody': 'Antes de importar, conecte sua conta em ',
    'ra.notConnectedWhere': 'Configurações → RetroAchievements',
    'ra.gotIt': 'Entendi',
    'ra.chooseGameA': 'Jogo: ',
    'ra.chooseGameB': ' — escolha a versão certa no RetroAchievements.',
    'ra.tabSearch': '🔎 Buscar por nome',
    'ra.tabLink': '🔗 Colar link',
    'ra.chooseConsole': 'Escolha o console...',
    'ra.gameName': 'Nome do jogo',
    'ra.use': 'Usar',
    'ra.pickConsoleFirst': 'Escolha o console primeiro.',
    'ra.badLink': 'Não consegui ler o ID. Cole o link tipo retroachievements.org/game/12345 (ou só o número).',
    'ra.notFound': 'Nada encontrado. Tente outro nome ou a aba "Colar link".',
    'ra.fetchingAchievements': 'Buscando conquistas...',
    'ra.foundCount': ' conquistas encontradas. Substituir as atuais?',
    'ra.more': '... e mais {n}',
    'ra.importN': 'Importar {n} conquistas',
    'ra.importing': 'Importando...',
    'ra.noAchievements': 'Esse jogo do RA não retornou conquistas.',
    'ra.needConfig': 'Configure sua chave do RetroAchievements em Configurações.',

    // ---------- erros vindos do processo principal ----------
    'err.gameNotFound': 'Jogo não encontrado',
    'err.achievementNotFound': 'Conquista não encontrada',
    'err.achievementNoName': 'Dê um nome para a conquista',
    'err.ra.http': 'Erro {status} ao falar com o RetroAchievements.',
    'err.ra.badJson': 'Resposta inválida do RetroAchievements.',
    'err.ra.emptyKey': 'Chave de API vazia.',
    'err.ra.badResponse': 'Resposta inesperada da API.',
    'err.ra.noAchievements': 'Esse jogo do RA não retornou conquistas.',
    'err.ra.needUser': 'Preencha seu usuário do RetroAchievements nas Configurações.',
    'err.ra.notLinked': 'Este jogo ainda não está vinculado ao RetroAchievements.',
    'err.download.http': 'Servidor respondeu {status}.'
  },

  en: {
    // ---------- common ----------
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.close': 'Close',
    'common.retry': '↻ Try again',
    'common.checkConnection': 'Check your connection and try again.',
    'common.searching': 'Searching...',
    'common.search': 'Search',
    'common.back': '← Back',

    // ---------- navigation ----------
    'nav.library': 'Library',
    'nav.achievements': 'Achievements',
    'nav.downloads': 'Downloads',
    'nav.folders': 'Folders',
    'nav.settings': 'Settings',

    // ---------- library ----------
    'library.add': '+ Add game',
    'library.empty': 'No games in your library yet.',
    'library.emptyHintA': 'Go to ',
    'library.emptyHintB': ' to scan your games, or ',
    'library.emptyHintC': ' to install a port.',
    'library.play': 'Play',
    'library.openFolder': 'Open game folder',
    'library.importRa': 'Import achievements from RetroAchievements',
    'library.remove': 'Remove from library',
    'library.launchError': 'Could not open the game:',
    'library.confirmRemove': 'Remove "{name}" from your library? (The game will not be deleted from your PC)',

    // ---------- achievements ----------
    'ach.title': 'Achievements',
    'ach.summaryOf': '/ {total} unlocked',
    'ach.empty': 'No games in your library yet.',
    'ach.emptyHintA': 'Add games to your ',
    'ach.emptyHintB': ' to see the achievements for each one.',
    'ach.emptyGame': 'This game has no achievements yet.',
    'ach.unlockedAt': 'Unlocked on {date}',
    'ach.pts': '{points} pts',
    'ach.unlock': 'Unlock',
    'ach.markLocked': 'Mark as locked',
    'ach.remove': 'Remove achievement',
    'ach.add': '+ Add achievement',
    'ach.formEmoji': 'Achievement emoji',
    'ach.formName': 'Achievement name',
    'ach.formDesc': 'Description (optional)',
    'ach.syncRa': '↻ Sync with RetroAchievements',
    'ach.syncRaHint': 'Imports what you already unlocked in the emulator, with the real date.',
    'ach.syncRaDone': 'Synced {n} new achievements from RetroAchievements.',
    'ach.syncRaUptodate': 'All up to date — nothing new on RetroAchievements.',

    // ---------- downloads ----------
    'dl.title': 'Downloads',
    'dl.placeholder': 'Paste a direct link to a port/recomp (.zip or .exe)...',
    'dl.downloadInstall': 'Download and install',
    'dl.downloading': 'Downloading...',
    'dl.hint': 'Works with direct links (.zip, .exe). The game is extracted and added to your library automatically.',
    'dl.starting': 'Starting...',
    'dl.error': 'Error: {msg}',
    'stage.baixando': 'Downloading',
    'stage.extraindo': 'Extracting',
    'stage.registrando': 'Adding to library',
    'stage.concluido': 'Done ✅',

    // ---------- folders ----------
    'folders.title': 'Game folders',
    'folders.hint': 'Add the folders where your ports and recomps live. PortVault finds the executables and builds your library.',
    'folders.add': '+ Add folder',
    'folders.empty': 'No folders added yet.',
    'folders.scanNow': '🔍 Scan now',
    'folders.scanning': 'Scanning...',
    'folders.scanDone': 'Scan finished! {added} new game(s) added to your library.',

    // ---------- settings ----------
    'settings.title': 'Settings',
    'settings.language': '🌐 Language',
    'settings.languageDesc': "Launcher language. RetroAchievements achievements are automatically translated to Portuguese.",
    'settings.languageLabel': 'Launcher language',
    'settings.updates': '🔄 Updates',
    'settings.installedVersion': 'Installed version',
    'settings.checkUpdate': 'Check for updates',
    'settings.checking': 'Checking...',
    'settings.latestVersion': 'Latest version available: ',
    'settings.updateFailed': 'Failed to download the update.',
    'settings.downloading': 'Downloading the new version...',
    'settings.installing': 'Installing... the launcher will reopen by itself.',
    'settings.pct': '{pct}%',
    'settings.updateNow': '⬇ Update',
    'settings.status.checking': 'Looking for updates...',
    'settings.status.update': 'Update available!',
    'settings.status.uptodate': 'You are on the latest version.',
    'settings.status.error': 'Could not check right now.',
    'settings.status.idle': 'Click to check for new versions.',
    'settings.ra': '🕹️ RetroAchievements',
    'settings.raTitle': 'Import official achievements',
    'settings.raDescA': 'Connect your account to pull RetroAchievements into your games. Get your key at ',
    'settings.raDescB': ' → ',
    'settings.raDescC': '.',
    'settings.raKeyWhere': 'retroachievements.org',
    'settings.raKeyWhere2': 'Control Panel → Keys',
    'settings.raUser': 'Username',
    'settings.raUserPh': 'Your RA username',
    'settings.raUserHint': 'Username is required to sync your unlocks; importing the achievement list only needs the key.',
    'settings.raKey': 'API key *',
    'settings.raKeyPh': 'Web API key',
    'settings.connect': 'Connect',
    'settings.connecting': 'Connecting...',
    'settings.raConnected': 'Connected! {consoles} consoles available.',
    'settings.about': 'ℹ️ About',
    'settings.aboutSubtitle': 'Launcher for ports and recomps',
    'settings.aboutDesc': 'Made by the community, for the community. Open source on GitHub.',
    'settings.viewGithub': 'View on GitHub',

    // ---------- update pop-up ----------
    'update.newVersion': 'New version available!',
    'update.installingTitle': 'Installing...',
    'update.downloading': 'Downloading the new version...',
    'update.installing': 'Installing the update. PortVault will reopen by itself in a moment...',
    'update.failed': 'Could not download right now. Check your connection and try again.',
    'update.description': 'A new version of PortVault has been released. Download and install it right here, without leaving the launcher.',
    'update.downloadingPct': 'Downloading {pct}%',
    'update.notNow': 'Not now',
    'update.updateNow': '⬇ Update now',

    // ---------- RetroAchievements modal ----------
    'ra.importTitle': 'Import achievements',
    'ra.doneTitle': 'Achievements imported!',
    'ra.doneBody': ' achievements from RetroAchievements were added to ',
    'ra.notConnectedTitle': 'RetroAchievements not connected',
    'ra.notConnectedBody': 'Before importing, connect your account in ',
    'ra.notConnectedWhere': 'Settings → RetroAchievements',
    'ra.gotIt': 'Got it',
    'ra.chooseGameA': 'Game: ',
    'ra.chooseGameB': ' — pick the right version on RetroAchievements.',
    'ra.tabSearch': '🔎 Search by name',
    'ra.tabLink': '🔗 Paste link',
    'ra.chooseConsole': 'Choose a console...',
    'ra.gameName': 'Game name',
    'ra.use': 'Use',
    'ra.pickConsoleFirst': 'Choose a console first.',
    'ra.badLink': "Couldn't read the ID. Paste a link like retroachievements.org/game/12345 (or just the number).",
    'ra.notFound': 'Nothing found. Try another name or the "Paste link" tab.',
    'ra.fetchingAchievements': 'Fetching achievements...',
    'ra.foundCount': ' achievements found. Replace the current ones?',
    'ra.more': '... and {n} more',
    'ra.importN': 'Import {n} achievements',
    'ra.importing': 'Importing...',
    'ra.noAchievements': 'That RA game returned no achievements.',
    'ra.needConfig': 'Set your RetroAchievements API key in Settings.',

    // ---------- errors from the main process ----------
    'err.gameNotFound': 'Game not found',
    'err.achievementNotFound': 'Achievement not found',
    'err.achievementNoName': 'Give the achievement a name',
    'err.ra.http': 'Error {status} while talking to RetroAchievements.',
    'err.ra.badJson': 'Invalid response from RetroAchievements.',
    'err.ra.emptyKey': 'Empty API key.',
    'err.ra.badResponse': 'Unexpected response from the API.',
    'err.ra.noAchievements': 'That RA game returned no achievements.',
    'err.ra.needUser': 'Enter your RetroAchievements username in Settings.',
    'err.ra.notLinked': 'This game is not linked to RetroAchievements yet.',
    'err.download.http': 'The server responded {status}.'
  }
}

// Traduz uma chave. Se não for uma chave (mensagem crua de fora), devolve como está.
export function translate(lang, key, params) {
  const dict = MESSAGES[lang] || MESSAGES.pt
  let s = dict[key]
  if (s === undefined) s = MESSAGES.pt[key]
  if (s === undefined) return key
  if (params) {
    for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v))
  }
  return s
}

// Pra mensagens de erro/status vindas do processo principal ou de fora:
// - 'err.ra.http|404'  -> traduz a chave passando 'status'
// - 'err.ra.noKey'     -> traduz a chave
// - 'Something failed' -> repassa cru (mensagem de terceiros, ex.: electron-updater)
//
// Detalhe importante: quando o processo principal LANÇA um erro, o Electron
// embrulha a mensagem antes de chegar aqui:
//   "Error invoking remote method 'ra:sync': Error: err.ra.needUser"
// Sem tirar esse casaco, nenhuma chave de erro era reconhecida e o usuário
// via o texto cru. Desembrulhamos aqui pra valer em todos os chamadores.
const EMBRULHO_IPC = /^Error invoking remote method '[^']*':\s*(?:Error:\s*)?/

export function tr(lang, raw) {
  const msg = String(raw ?? '').replace(EMBRULHO_IPC, '')
  const i = msg.indexOf('|')
  if (i > 0) {
    const key = msg.slice(0, i)
    const dict = MESSAGES[lang] || MESSAGES.pt
    if (dict[key] !== undefined || MESSAGES.pt[key] !== undefined) {
      return translate(lang, key, { status: msg.slice(i + 1) })
    }
  }
  return translate(lang, msg)
}

// Escolhe a versão certa de uma conquista: em português usa a tradução salva
// (quando existir); em inglês usa o original do RetroAchievements.
export function pickAchievement(lang, original, translatedPt) {
  return lang === 'pt' && translatedPt ? translatedPt : original
}

const I18nContext = createContext({ lang: 'pt', t: (k) => k })

// Prove o idioma atual pra árvore inteira e permite trocar (salva em library.json)
export function I18nProvider({ children }) {
  const [lang, setLangState] = useState('pt')

  useEffect(() => {
    window.api.getLocale().then((l) => setLangState(l || 'pt')).catch(() => {})
  }, [])

  async function setLang(l) {
    setLangState(l) // troca na hora (feedback imediato)
    try { await window.api.setLocale(l) } catch { /* mantém só em memória */ }
  }

  const value = { lang, setLang, t: (k, p) => translate(lang, k, p), tr: (m) => tr(lang, m) }
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export const useI18n = () => useContext(I18nContext)
