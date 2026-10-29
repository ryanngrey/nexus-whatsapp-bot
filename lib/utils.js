const config = require('../config')

function onlyNum(j) {
  return String(j || '').replace(/@s\.whatsapp\.net|@g\.us|@lid|:.*$/g, '').replace(/\D/g, '')
}

function toJid(n) {
  const num = onlyNum(n)
  return num + '@s.whatsapp.net'
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function formatTime(ms) {
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const parts = []
  if (d) parts.push(d + 'd')
  if (h) parts.push(h + 'h')
  if (m) parts.push(m + 'm')
  parts.push(sec + 's')
  return parts.join(' ')
}

function xpForLevel(level) {
  return 100 + (level - 1) * 85
}

function addXp(user, amount) {
  user.xp += amount
  let up = 0
  while (user.xp >= xpForLevel(user.level)) {
    user.xp -= xpForLevel(user.level)
    user.level += 1
    up += 1
  }
  return up
}

function mention(jid) {
  return '@' + onlyNum(jid)
}

function parseDays(arg) {
  if (!arg) return null
  const a = String(arg).toLowerCase().trim()
  if (['permanente', 'eterno', 'forever', 'perm', 'infinito', '0'].includes(a)) return 0
  const n = parseInt(a, 10)
  if (Number.isNaN(n) || n < 1) return null
  return n
}

function expireText(expire) {
  if (!expire) return 'permanente'
  const left = expire - Date.now()
  if (left <= 0) return 'expirado'
  return formatTime(left)
}

function box(title, lines) {
  const width = 32
  const t = String(title || config.botName)
  const head = '╭━━━〔 ' + t + ' 〕━━━╮'
  const body = lines.map((l) => '│ ' + l)
  const foot = '╰' + '━'.repeat(Math.max(width, 18)) + '╯'
  return [head, ...body, foot].join('\n')
}

function cmdList(title, cmds) {
  const lines = ['', '*' + title + '*', ...cmds.map((c) => config.prefix + c)]
  return lines
}

function getQuoted(m) {
  const ctx = m.message?.extendedTextMessage?.contextInfo
  if (!ctx?.quotedMessage) return null
  return {
    key: {
      remoteJid: m.key.remoteJid,
      fromMe: ctx.participant === undefined && ctx.remoteJid !== m.key.remoteJid ? false : Boolean(ctx.participant && false),
      id: ctx.stanzaId,
      participant: ctx.participant
    },
    message: ctx.quotedMessage,
    participant: ctx.participant,
    sender: ctx.participant || m.key.remoteJid
  }
}

function extractUrl(text) {
  const r = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(chat\.whatsapp\.com\/[^\s]+)/i
  return r.test(text || '')
}

function isFake(num) {
  const n = onlyNum(num)
  return !n.startsWith('55')
}

const emojis = ['😀', '🔥', '✨', '💜', '🖤', '⚡', '🌟', '🎯', '👑', '💎']

module.exports = {
  onlyNum,
  toJid,
  sleep,
  pick,
  rand,
  formatTime,
  xpForLevel,
  addXp,
  mention,
  parseDays,
  expireText,
  box,
  cmdList,
  getQuoted,
  extractUrl,
  isFake,
  emojis
}
