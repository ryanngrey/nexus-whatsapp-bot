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
let sock = null
let pairingTried = false

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

  sock.ev.on('connection.update', async (u) => {
    const { connection, lastDisconnect, qr } = u

    if (qr) {
      console.log('\n================ QR CODE ================\n')
      qrcode.generate(qr, { small: true })
      console.log('\nEscaneie o QR com o WhatsApp do numero ' + config.botNumber)
      console.log('WhatsApp > Aparelhos conectados > Conectar um aparelho\n')

      const wantPair = process.argv.includes('--pair') || process.env.PAIRING === '1'
      if (wantPair && !pairingTried && !state.creds.registered) {
        pairingTried = true
        try {
          const code = await sock.requestPairingCode(config.botNumber)
          console.log('\nCODIGO DE EMPARELHAMENTO: ' + code + '\n')
        } catch (e) {
          console.log('Falha no pairing code, use o QR.', e.message)
        }
      }
    }

    if (connection === 'open') {
      const me = sock.user?.id || ''
      console.log('\n[' + config.botName + '] conectado: ' + me)
      console.log('Prefixo: ' + (db.get().settings.prefix || config.prefix))
      console.log('Donos: ' + db.get().owners.join(', '))
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode
      const reason = lastDisconnect?.error?.output?.payload?.error || lastDisconnect?.error?.message
      console.log('Conexao fechada:', code, reason || '')
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
