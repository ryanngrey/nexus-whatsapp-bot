const fs = require('fs')
const path = require('path')
const pino = require('pino')
const qrcode = require('qrcode-terminal')
const NodeCache = require('node-cache')
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers
} = require('@whiskeysockets/baileys')

const config = require('./config')
const db = require('./lib/database')
const { handleMessage, handleParticipants } = require('./lib/handler')

for (const d of [config.sessionFolder, config.tempFolder, './database']) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true })
}

const logger = pino({ level: 'silent' })
const msgRetry = new NodeCache({ stdTTL: 600 })
const PAIR_NUMBER = String(config.botNumber).replace(/\D/g, '')
const useQr = process.argv.includes('--qr') || process.env.USE_QR === '1'

let sock = null
let pairingBusy = false
let reconnecting = false

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function formatPairCode(code) {
  const c = String(code || '').replace(/[^A-Z0-9]/gi, '').toUpperCase()
  if (c.length === 8) return c.slice(0, 4) + '-' + c.slice(4)
  return String(code)
}

function printPairing(code) {
  console.log('\n========================================')
  console.log('  CODIGO DE PAREAMENTO')
  console.log('  WhatsApp: +' + PAIR_NUMBER)
  console.log('  Codigo:   ' + code)
  console.log('========================================')
  console.log('No celular de +' + PAIR_NUMBER + ':')
  console.log('1. Abra o WhatsApp (esse numero recebe a notificacao)')
  console.log('2. Aparelhos conectados')
  console.log('3. Conectar um aparelho')
  console.log('4. Conectar com numero de telefone')
  console.log('5. Digite: ' + code)
  console.log('Se o codigo expirar, o bot gera outro e o WhatsApp avisa de novo.')
  console.log('========================================\n')
}

async function askPairingCode(socket) {
  if (useQr) return
  if (!socket || pairingBusy) return
  if (socket.authState?.creds?.registered) return
  pairingBusy = true
  try {
    await sleep(1200)
    const raw = await socket.requestPairingCode(PAIR_NUMBER)
    printPairing(formatPairCode(raw))
  } catch (e) {
    console.log('Falha ao gerar codigo de pareamento:', e.message || e)
    console.log('Tentando de novo em alguns segundos...')
  } finally {
    pairingBusy = false
  }
}

function clearSessionFiles() {
  try {
    for (const f of fs.readdirSync(config.sessionFolder)) {
      if (f === '.gitkeep') continue
      fs.unlinkSync(path.join(config.sessionFolder, f))
    }
  } catch {}
}

async function start() {
  pairingBusy = false
  const { state, saveCreds } = await useMultiFileAuthState(config.sessionFolder)
  const { version } = await fetchLatestBaileysVersion()

  sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    browser: ['Ubuntu', 'Chrome', '22.04.4'],
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    msgRetryCounterCache: msgRetry,
    syncFullHistory: false,
    getMessage: async () => undefined
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (u) => {
    const { connection, lastDisconnect, qr } = u

    if (qr && useQr) {
      console.log('\n================ QR CODE ================\n')
      qrcode.generate(qr, { small: true })
      console.log('\nEscaneie o QR com o WhatsApp de +' + PAIR_NUMBER + '\n')
    }

    if (qr && !useQr && !sock.authState?.creds?.registered) {
      await askPairingCode(sock)
    }

    if (connection === 'open') {
      reconnecting = false
      const me = sock.user?.id || ''
      console.log('\n[' + config.botName + '] conectado: ' + me)
      console.log('Numero do bot: +' + PAIR_NUMBER)
      console.log('Prefixo: ' + (db.get().settings.prefix || config.prefix))
      console.log('Donos: ' + db.get().owners.join(', '))
      try {
        await sock.sendMessage(PAIR_NUMBER + '@s.whatsapp.net', {
          text: '[' + config.botName + '] conectado neste numero.\nPrefixo: ' + (db.get().settings.prefix || config.prefix) + '\nUse /menu'
        })
      } catch {}
    }

    if (connection === 'close') {
      const status = lastDisconnect?.error?.output?.statusCode
      const reason = lastDisconnect?.error?.output?.payload?.error || lastDisconnect?.error?.message
      console.log('Conexao fechada:', status, reason || '')
      pairingBusy = false

      if (status === DisconnectReason.loggedOut) {
        console.log('Sessao deslogada. Preparando pareamento novo no +' + PAIR_NUMBER)
        clearSessionFiles()
      } else if (!sock.authState?.creds?.registered) {
        console.log('Codigo expirou ou nao foi usado. Gerando outro para +' + PAIR_NUMBER)
      }

      if (reconnecting) return
      reconnecting = true
      setTimeout(() => {
        reconnecting = false
        start().catch(console.error)
      }, 3000)
    }
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    for (const m of messages) {
      try {
        await handleMessage(sock, m)
      } catch (e) {
        console.error('handler:', e)
      }
    }
  })

  sock.ev.on('group-participants.update', async (ev) => {
    try {
      await handleParticipants(sock, ev)
    } catch (e) {
      console.error('participants:', e)
    }
  })
}

process.on('uncaughtException', (e) => console.error('uncaught', e))
process.on('unhandledRejection', (e) => console.error('unhandled', e))

console.log('Iniciando ' + config.botName)
console.log('Pareamento no WhatsApp: +' + PAIR_NUMBER)

start().catch((e) => {
  console.error('Falha ao iniciar:', e)
  process.exit(1)
})
