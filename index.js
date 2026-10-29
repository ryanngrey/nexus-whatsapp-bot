const fs = require('fs')
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
let pairingSent = false

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function formatPairCode(code) {
  const c = String(code || '').replace(/[^A-Z0-9]/gi, '').toUpperCase()
  if (c.length === 8) return c.slice(0, 4) + '-' + c.slice(4)
  return String(code)
}

async function askPairingCode(socket) {
  if (pairingSent) return
  if (socket.authState?.creds?.registered) return
  pairingSent = true
  try {
    await sleep(2000)
    const raw = await socket.requestPairingCode(PAIR_NUMBER)
    const code = formatPairCode(raw)
    console.log('\n========================================')
    console.log('  CODIGO DE PAREAMENTO')
    console.log('  Numero: ' + PAIR_NUMBER)
    console.log('  Codigo: ' + code)
    console.log('========================================')
    console.log('No celular desse numero:')
    console.log('WhatsApp > Aparelhos conectados')
    console.log('> Conectar um aparelho')
    console.log('> Conectar com numero de telefone')
    console.log('Digite o codigo: ' + code)
    console.log('========================================\n')
  } catch (e) {
    pairingSent = false
    console.log('Falha ao gerar codigo de pareamento:', e.message)
  }
}

async function start() {
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
    browser: Browsers.ubuntu('Chrome'),
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: true,
    msgRetryCounterCache: msgRetry,
    syncFullHistory: false,
    getMessage: async () => undefined
  })

  sock.ev.on('creds.update', saveCreds)

  if (!state.creds.registered && !useQr) {
    askPairingCode(sock).catch((e) => console.error('pairing:', e))
  }

  sock.ev.on('connection.update', async (u) => {
    const { connection, lastDisconnect, qr } = u

    if (qr && useQr) {
      console.log('\n================ QR CODE ================\n')
      qrcode.generate(qr, { small: true })
      console.log('\nEscaneie o QR com o WhatsApp do numero ' + PAIR_NUMBER)
      console.log('WhatsApp > Aparelhos conectados > Conectar um aparelho\n')
    }

    if (qr && !useQr && !state.creds.registered) {
      askPairingCode(sock).catch((e) => console.error('pairing:', e))
    }

    if (connection === 'open') {
      const me = sock.user?.id || ''
      console.log('\n[' + config.botName + '] conectado: ' + me)
      console.log('Numero configurado: ' + PAIR_NUMBER)
      console.log('Prefixo: ' + (db.get().settings.prefix || config.prefix))
      console.log('Donos: ' + db.get().owners.join(', '))
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode
      const reason = lastDisconnect?.error?.output?.payload?.error || lastDisconnect?.error?.message
      console.log('Conexao fechada:', code, reason || '')
      pairingSent = false
      if (code === DisconnectReason.loggedOut) {
        console.log('Sessao deslogada. Apague a pasta session e conecte de novo.')
        return
      }
      setTimeout(() => start().catch(console.error), 2500)
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

start().catch((e) => {
  console.error('Falha ao iniciar:', e)
  process.exit(1)
})
