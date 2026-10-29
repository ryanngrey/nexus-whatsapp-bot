const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const pino = require('pino')

const logger = pino({ level: 'silent' })

function typeOf(m) {
  const msg = m.message || {}
  if (msg.conversation) return 'text'
  if (msg.extendedTextMessage) return 'text'
  if (msg.imageMessage) return 'image'
  if (msg.videoMessage) return 'video'
  if (msg.stickerMessage) return 'sticker'
  if (msg.audioMessage) return 'audio'
  if (msg.documentMessage) return 'document'
  if (msg.contactMessage) return 'contact'
  if (msg.viewOnceMessageV2) return typeOf({ message: msg.viewOnceMessageV2.message })
  if (msg.viewOnceMessage) return typeOf({ message: msg.viewOnceMessage.message })
  if (msg.ephemeralMessage) return typeOf({ message: msg.ephemeralMessage.message })
  if (msg.buttonsMessage) return 'buttons'
  if (msg.templateMessage) return 'template'
  return Object.keys(msg)[0] || 'unknown'
}

function unwrap(m) {
  let msg = m.message || {}
  if (msg.ephemeralMessage) msg = msg.ephemeralMessage.message || {}
  if (msg.viewOnceMessageV2) msg = msg.viewOnceMessageV2.message || {}
  if (msg.viewOnceMessage) msg = msg.viewOnceMessage.message || {}
  if (msg.documentWithCaptionMessage) msg = msg.documentWithCaptionMessage.message || {}
  return { ...m, message: msg }
}

function textOf(m) {
  const msg = unwrap(m).message || {}
  return (
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    msg.documentMessage?.caption ||
    msg.buttonsResponseMessage?.selectedButtonId ||
    msg.listResponseMessage?.singleSelectReply?.selectedRowId ||
    ''
  )
}

async function download(sock, m) {
  const u = unwrap(m)
  return downloadMediaMessage(u, 'buffer', {}, { logger, reuploadRequest: sock.updateMediaMessage })
}

function quoted(m) {
  const ctx = unwrap(m).message?.extendedTextMessage?.contextInfo
  if (!ctx?.quotedMessage) return null
  return {
    key: {
      remoteJid: m.key.remoteJid,
      fromMe: false,
      id: ctx.stanzaId,
      participant: ctx.participant
    },
    message: ctx.quotedMessage,
    participant: ctx.participant,
    sender: ctx.participant || m.key.remoteJid
  }
}

function mentioned(m) {
  const ctx = unwrap(m).message?.extendedTextMessage?.contextInfo
  return ctx?.mentionedJid || []
}

module.exports = { typeOf, unwrap, textOf, download, quoted, mentioned }
