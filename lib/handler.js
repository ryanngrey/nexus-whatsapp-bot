const config = require('../config')
const db = require('./database')
const u = require('./utils')
const media = require('./media')
const { ALL, OWNER_ONLY, ADMIN_ONLY, VIP_ONLY } = require('./registry')

const flood = new Map()

function isOwner(num) {
  return db.get().owners.map(u.onlyNum).includes(u.onlyNum(num))
}

function isBotAdmin(num) {
  if (isOwner(num)) return true
  return db.get().adminsBot.map(u.onlyNum).includes(u.onlyNum(num))
}

function isVip(num) {
  if (isOwner(num) || isBotAdmin(num)) return true
  return db.get().vips.map(u.onlyNum).includes(u.onlyNum(num))
}

function isBanned(num) {
  return db.get().bannedUsers.map(u.onlyNum).includes(u.onlyNum(num))
}

async function groupMeta(sock, jid) {
  try {
    return await sock.groupMetadata(jid)
  } catch {
    return null
  }
}

function participant(meta, jid) {
  if (!meta) return null
  const n = u.onlyNum(jid)
  return (meta.participants || []).find((p) => u.onlyNum(p.id) === n || u.onlyNum(p.jid || '') === n)
}

function isGroupAdm(meta, jid) {
  const p = participant(meta, jid)
  if (!p) return false
  return p.admin === 'admin' || p.admin === 'superadmin'
}

function botJid(sock) {
  return sock.user?.id || ''
}

function replyKey(m) {
  return { quoted: m }
}

async function send(sock, jid, content, m) {
  return sock.sendMessage(jid, typeof content === 'string' ? { text: content } : content, m ? replyKey(m) : undefined)
}

async function react(sock, m, emoji) {
  try {
    await sock.sendMessage(m.key.remoteJid, { react: { text: emoji, key: m.key } })
  } catch {}
}

function checkFlood(id) {
  const now = Date.now()
  const rec = flood.get(id) || []
  const fresh = rec.filter((t) => now - t < config.floodSeconds * 1000)
  fresh.push(now)
  flood.set(id, fresh)
  return fresh.length > config.floodLimit
}

async function handleMessage(sock, m) {
  if (!m?.message) return
  if (m.key.remoteJid === 'status@broadcast') return
  if (m.key.fromMe) return

  const um = media.unwrap(m)
  const jid = m.key.remoteJid
  const isGroup = jid.endsWith('@g.us')
  const sender = isGroup ? (m.key.participant || um.participant || jid) : jid
  const num = u.onlyNum(sender)
  const text = media.textOf(um).trim()
  const prefix = db.get().settings.prefix || config.prefix
  const type = media.typeOf(um)

  db.ensureUser(num)

  if (isBanned(num) && !isOwner(num)) return

  const g = isGroup ? db.ensureGroup(jid) : null

  if (isGroup && g.antiflood && checkFlood(jid + ':' + num) && !isOwner(num)) {
    try { await sock.sendMessage(jid, { delete: m.key }) } catch {}
    return
  }

  if (isGroup && g.antilink && !isOwner(num) && u.extractUrl(text)) {
    const meta = await groupMeta(sock, jid)
    if (meta && !isGroupAdm(meta, sender)) {
      try { await sock.sendMessage(jid, { delete: m.key }) } catch {}
      try { await sock.groupParticipantsUpdate(jid, [sender], 'remove') } catch {}
      await send(sock, jid, 'Link detectado. Mensagem apagada e usuario removido.', m)
      return
    }
  }

  if (isGroup && g.antifake && u.isFake(num) && !isOwner(num)) {
    const meta = await groupMeta(sock, jid)
    if (meta && !isGroupAdm(meta, sender)) {
      try { await sock.groupParticipantsUpdate(jid, [sender], 'remove') } catch {}
      return
    }
  }

  if (isGroup && g.antifoto && type === 'image' && !isOwner(num)) {
    const meta = await groupMeta(sock, jid)
    if (meta && !isGroupAdm(meta, sender)) {
      try { await sock.sendMessage(jid, { delete: m.key }) } catch {}
      return
    }
  }
  if (isGroup && g.antivideo && type === 'video' && !isOwner(num)) {
    const meta = await groupMeta(sock, jid)
    if (meta && !isGroupAdm(meta, sender)) {
      try { await sock.sendMessage(jid, { delete: m.key }) } catch {}
      return
    }
  }
  if (isGroup && g.antisticker && type === 'sticker' && !isOwner(num)) {
    const meta = await groupMeta(sock, jid)
    if (meta && !isGroupAdm(meta, sender)) {
      try { await sock.sendMessage(jid, { delete: m.key }) } catch {}
      return
    }
  }
  if (isGroup && g.antivoz && type === 'audio' && !isOwner(num)) {
    const meta = await groupMeta(sock, jid)
    if (meta && !isGroupAdm(meta, sender)) {
      try { await sock.sendMessage(jid, { delete: m.key }) } catch {}
      return
    }
  }

  if (isGroup && g.autosticker && (type === 'image' || type === 'video') && !text.startsWith(prefix)) {
    try {
      const sticker = require('./sticker')
      const buf = await media.download(sock, um)
      const webp = type === 'video' ? await sticker.vidToWebp(buf) : await sticker.imgToWebp(buf)
      await sock.sendMessage(jid, { sticker: webp }, { quoted: m })
    } catch {}
  }

  if (isGroup && g.leveling && text && !text.startsWith(prefix)) {
    const user = db.ensureUser(num)
    const up = u.addXp(user, config.xpPerMessage)
    db.save()
    if (up) await send(sock, jid, 'Parabens ' + u.mention(sender) + '! Subiu para o nivel ' + user.level, m)
  }

  const muteUntil = db.get().mutes[jid + ':' + num]
  if (muteUntil && Date.now() < muteUntil && !isOwner(num)) {
    try { await sock.sendMessage(jid, { delete: m.key }) } catch {}
    return
  }

  if (!text.startsWith(prefix)) {
    const afk = db.get().afk
    const mentions = media.mentioned(um)
    for (const mj of mentions) {
      const mn = u.onlyNum(mj)
      if (afk[mn]) {
        await send(sock, jid, u.mention(mj) + ' esta AFK: ' + afk[mn].reason + '\nDesde: ' + new Date(afk[mn].since).toLocaleString('pt-BR'), m)
      }
    }
    if (afk[num]) {
      const tempo = u.formatTime(Date.now() - afk[num].since)
      delete afk[num]
      db.save()
      await send(sock, jid, 'Voce voltou do AFK. Tempo ausente: ' + tempo, m)
    }
    return
  }

  if (db.get().settings.antiPv && !isGroup && !isOwner(num)) {
    await send(sock, jid, 'PV fechado. Fale comigo em um grupo autorizado.', m)
    return
  }

  if (db.get().settings.maintenance && !isOwner(num)) {
    await send(sock, jid, 'Bot em manutencao. Tente mais tarde.', m)
    return
  }

  const body = text.slice(prefix.length).trim()
  const [rawCmd, ...args] = body.split(/\s+/)
  const cmd = (rawCmd || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const arg = args.join(' ')
  const q = media.quoted(um)

  const aliases = {
    s: 'sticker', figu: 'sticker', f: 'sticker', figurinha: 'sticker',
    toimg: 'toimg', toimage: 'toimg',
    del: 'apagar', delete: 'apagar', d: 'apagar',
    kick: 'ban', expulsar: 'ban',
    adm: 'promover',
    demote: 'rebaixar',
    tag: 'marcar', tagall: 'marcar',
    h: 'hidetag',
    menu: 'menu', help: 'menu', ajuda: 'menu', comandos: 'menu',
    p: 'ping',
    daily: 'diario',
    inv: 'inventario',
    ppt: 'jokenpo',
    casar: 'casar',
    gay: 'gay',
    ship: 'ship',
    bola8: 'bola8',
    '8ball': 'bola8',
    bc: 'transmitir'
  }
  const name = aliases[cmd] || cmd
  const fn = ALL[name]
  if (!fn) return

  if (isGroup && !db.isGroupActive(jid) && !OWNER_ONLY.has(name) && name !== 'menu' && name !== 'ping' && name !== 'infobot') {
    if (!isOwner(num)) {
      await send(sock, jid, 'Este grupo nao esta autorizado.\nO dono deve usar:\n' + prefix + 'addgrupo permanente\nou\n' + prefix + 'addgrupo 30', m)
      return
    }
  }

  if (isGroup && g.onlyAdm && !isOwner(num)) {
    const meta = await groupMeta(sock, jid)
    if (meta && !isGroupAdm(meta, sender) && name !== 'menu' && name !== 'regras') return
  }

  let meta = null
  if (isGroup) meta = await groupMeta(sock, jid)

  if (OWNER_ONLY.has(name) && !isOwner(num)) {
    await send(sock, jid, 'Somente o dono do bot pode usar este comando.', m)
    return
  }
  if (ADMIN_ONLY.has(name)) {
    const ok = isOwner(num) || isBotAdmin(num) || (isGroup && isGroupAdm(meta, sender))
    if (!ok) {
      await send(sock, jid, 'Somente administradores podem usar este comando.', m)
      return
    }
  }
  if (VIP_ONLY.has(name) && !isVip(num)) {
    await send(sock, jid, 'Comando exclusivo VIP. peca a um dono: ' + prefix + 'addvip @user', m)
    return
  }

  const ctx = {
    sock, m, jid, isGroup, sender, num, args, arg, prefix, q, um, type,
    meta, config, db, u, media,
    isOwner: isOwner(num),
    isBotAdmin: isBotAdmin(num),
    isVip: isVip(num),
    isAdm: isGroup ? isGroupAdm(meta, sender) : false,
    botIsAdm: isGroup ? isGroupAdm(meta, botJid(sock)) : false,
    botJid: botJid(sock),
    send: (c) => send(sock, jid, c, m),
    sendRaw: (c) => sock.sendMessage(jid, typeof c === 'string' ? { text: c } : c),
    react: (e) => react(sock, m, e),
    mention: (id) => u.mention(id),
    target: () => {
      const ments = media.mentioned(um)
      if (ments[0]) return ments[0]
      if (q?.participant) return q.participant
      if (q?.sender) return q.sender
      if (args[0] && /\d{8,}/.test(args[0])) return u.toJid(args[0])
      return null
    }
  }

  try {
    await fn(ctx)
    const user = db.ensureUser(num)
    u.addXp(user, config.xpPerCommand)
    db.save()
  } catch (e) {
    console.error('cmd ' + name, e)
    await send(sock, jid, 'Erro ao executar ' + prefix + name + '.\n' + (e.message || e), m)
  }
}

async function handleParticipants(sock, ev) {
  const { id, participants, action } = ev
  const g = db.ensureGroup(id)
  if (!db.isGroupActive(id)) return
  let meta = null
  try { meta = await sock.groupMetadata(id) } catch { return }
  const gname = meta.subject || 'grupo'

  if (action === 'add' && g.antifake) {
    for (const p of participants) {
      if (u.isFake(p) && !isOwner(u.onlyNum(p))) {
        try { await sock.groupParticipantsUpdate(id, [p], 'remove') } catch {}
      }
    }
  }

  if (action === 'add' && g.welcome) {
    for (const p of participants) {
      const txt = (g.welcomeText || 'Bem-vindo @user')
        .replace(/@user/g, '@' + u.onlyNum(p))
        .replace(/\{grupo\}/g, gname)
      try {
        await sock.sendMessage(id, { text: txt, mentions: [p] })
      } catch {}
    }
  }

  if (action === 'remove' && g.goodbye) {
    for (const p of participants) {
      const txt = (g.goodbyeText || '@user saiu')
        .replace(/@user/g, '@' + u.onlyNum(p))
        .replace(/\{grupo\}/g, gname)
      try {
        await sock.sendMessage(id, { text: txt, mentions: [p] })
      } catch {}
    }
  }
}

module.exports = { handleMessage, handleParticipants, isOwner, isVip, ALL }
