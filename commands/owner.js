const fs = require('fs')
const { exec } = require('child_process')

function numFrom(ctx) {
  const t = ctx.target()
  if (t) return ctx.u.onlyNum(t)
  if (ctx.args[0]) return ctx.u.onlyNum(ctx.args[0])
  return null
}

module.exports = {
  async addgrupo(ctx) {
    if (!ctx.isGroup) return ctx.send('Use este comando dentro do grupo que deseja autorizar.')
    const days = ctx.u.parseDays(ctx.args[0] || 'permanente')
    if (days === null) return ctx.send('Use:\n' + ctx.prefix + 'addgrupo permanente\n' + ctx.prefix + 'addgrupo 7\n' + ctx.prefix + 'addgrupo 30')
    const g = ctx.db.ensureGroup(ctx.jid)
    g.active = true
    g.banned = false
    g.expire = days === 0 ? 0 : Date.now() + days * 86400000
    ctx.db.save()
    const meta = ctx.meta
    await ctx.send(
      ctx.u.box('GRUPO AUTORIZADO', [
        'Grupo: ' + (meta?.subject || ctx.jid),
        'Duracao: ' + (days === 0 ? 'permanente' : days + ' dias'),
        'Expira: ' + ctx.u.expireText(g.expire)
      ])
    )
  },

  async delgrupo(ctx) {
    if (!ctx.isGroup && !ctx.args[0]) return ctx.send('Use no grupo ou passe o ID.')
    const id = ctx.isGroup ? ctx.jid : ctx.args[0]
    const g = ctx.db.ensureGroup(id)
    g.active = false
    ctx.db.save()
    await ctx.send('Grupo desativado.')
  },

  async listgrupos(ctx) {
    const groups = ctx.db.get().groups
    const lines = []
    for (const [id, g] of Object.entries(groups)) {
      if (!g.active) continue
      lines.push((id.slice(0, 18) + '... | ' + ctx.u.expireText(g.expire)))
    }
    await ctx.send(lines.length ? ctx.u.box('GRUPOS ATIVOS', lines) : 'Nenhum grupo ativo.')
  },

  async adddono(ctx) {
    const n = numFrom(ctx)
    if (!n) return ctx.send('Marque, responda ou envie o numero.\n' + ctx.prefix + 'adddono @user')
    const d = ctx.db.get()
    if (d.owners.includes(n)) return ctx.send('Ja e dono.')
    d.owners.push(n)
    ctx.db.save()
    await ctx.send('Novo dono adicionado: ' + n)
  },

  async deldono(ctx) {
    const n = numFrom(ctx)
    if (!n) return ctx.send('Marque o dono para remover.')
    const d = ctx.db.get()
    if (ctx.config.owners.includes(n)) return ctx.send('Nao e possivel remover um dono principal.')
    d.owners = d.owners.filter((x) => x !== n)
    ctx.db.save()
    await ctx.send('Dono removido: ' + n)
  },

  async listdonos(ctx) {
    await ctx.send(ctx.u.box('DONOS', ctx.db.get().owners.map((n, i) => (i + 1) + '. ' + n)))
  },

  async addadmbot(ctx) {
    const n = numFrom(ctx)
    if (!n) return ctx.send('Marque o usuario.')
    const d = ctx.db.get()
    if (!d.adminsBot.includes(n)) d.adminsBot.push(n)
    ctx.db.save()
    await ctx.send('Admin do bot adicionado: ' + n)
  },

  async deladmbot(ctx) {
    const n = numFrom(ctx)
    if (!n) return ctx.send('Marque o usuario.')
    const d = ctx.db.get()
    d.adminsBot = d.adminsBot.filter((x) => x !== n)
    ctx.db.save()
    await ctx.send('Admin do bot removido: ' + n)
  },

  async listadmbot(ctx) {
    const list = ctx.db.get().adminsBot
    await ctx.send(list.length ? ctx.u.box('ADMINS DO BOT', list) : 'Nenhum admin extra.')
  },

  async addvip(ctx) {
    const n = numFrom(ctx)
    if (!n) return ctx.send('Marque o usuario.\n' + ctx.prefix + 'addvip @user')
    const d = ctx.db.get()
    if (!d.vips.includes(n)) d.vips.push(n)
    ctx.db.save()
    await ctx.send('VIP adicionado: ' + n)
  },

  async delvip(ctx) {
    const n = numFrom(ctx)
    if (!n) return ctx.send('Marque o usuario.')
    const d = ctx.db.get()
    d.vips = d.vips.filter((x) => x !== n)
    ctx.db.save()
    await ctx.send('VIP removido: ' + n)
  },

  async listvip(ctx) {
    const list = ctx.db.get().vips
    await ctx.send(list.length ? ctx.u.box('VIPS', list) : 'Nenhum VIP.')
  },

  async transmitir(ctx) {
    if (!ctx.arg) return ctx.send('Digite a mensagem.\n' + ctx.prefix + 'transmitir texto')
    const groups = Object.entries(ctx.db.get().groups).filter(([, g]) => g.active)
    let ok = 0
    for (const [id] of groups) {
      try {
        await ctx.sock.sendMessage(id, { text: '*TRANSMISSAO*\n\n' + ctx.arg })
        ok++
        await ctx.u.sleep(400)
      } catch {}
    }
    await ctx.send('Enviado para ' + ok + ' grupos.')
  },

  async sair(ctx) {
    if (!ctx.isGroup) return ctx.send('Use no grupo.')
    await ctx.send('Saindo do grupo...')
    await ctx.sock.groupLeave(ctx.jid)
  },

  async entrar(ctx) {
    const link = ctx.arg.match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/)
    if (!link) return ctx.send('Envie o convite.\n' + ctx.prefix + 'entrar https://chat.whatsapp.com/xxxx')
    try {
      const res = await ctx.sock.groupAcceptInvite(link[1])
      await ctx.send('Entrei no grupo: ' + res)
    } catch (e) {
      await ctx.send('Falha ao entrar: ' + e.message)
    }
  },

  async bloquear(ctx) {
    const t = ctx.target()
    if (!t) return ctx.send('Marque quem bloquear.')
    await ctx.sock.updateBlockStatus(t, 'block')
    const d = ctx.db.get()
    const n = ctx.u.onlyNum(t)
    if (!d.blocked.includes(n)) d.blocked.push(n)
    ctx.db.save()
    await ctx.send('Bloqueado: ' + n)
  },

  async desbloquear(ctx) {
    const t = ctx.target()
    if (!t) return ctx.send('Marque quem desbloquear.')
    await ctx.sock.updateBlockStatus(t, 'unblock')
    const d = ctx.db.get()
    const n = ctx.u.onlyNum(t)
    d.blocked = d.blocked.filter((x) => x !== n)
    ctx.db.save()
    await ctx.send('Desbloqueado: ' + n)
  },

  async listblock(ctx) {
    const list = ctx.db.get().blocked
    await ctx.send(list.length ? ctx.u.box('BLOQUEADOS', list) : 'Ninguem bloqueado.')
  },

  async banuser(ctx) {
    const n = numFrom(ctx)
    if (!n) return ctx.send('Marque o usuario.')
    const d = ctx.db.get()
    if (!d.bannedUsers.includes(n)) d.bannedUsers.push(n)
    ctx.db.save()
    await ctx.send('Usuario banido do bot: ' + n)
  },

  async unbanuser(ctx) {
    const n = numFrom(ctx)
    if (!n) return ctx.send('Marque o usuario.')
    const d = ctx.db.get()
    d.bannedUsers = d.bannedUsers.filter((x) => x !== n)
    ctx.db.save()
    await ctx.send('Usuario desbanido: ' + n)
  },

  async listban(ctx) {
    const list = ctx.db.get().bannedUsers
    await ctx.send(list.length ? ctx.u.box('BANIDOS', list) : 'Ninguem banido.')
  },

  async setprefix(ctx) {
    if (!ctx.args[0]) return ctx.send('Informe o prefixo.\n' + ctx.prefix + 'setprefix !')
    ctx.db.get().settings.prefix = ctx.args[0]
    ctx.db.save()
    await ctx.send('Prefixo alterado para: ' + ctx.args[0])
  },

  async setnome(ctx) {
    if (!ctx.arg) return ctx.send('Informe o nome.')
    ctx.db.get().settings.botName = ctx.arg
    ctx.db.save()
    await ctx.send('Nome do bot: ' + ctx.arg)
  },

  async setpack(ctx) {
    if (!ctx.arg) return ctx.send('Informe o nome do pack.')
    ctx.db.get().settings.packName = ctx.arg
    ctx.db.save()
    await ctx.send('Pack: ' + ctx.arg)
  },

  async setauthor(ctx) {
    if (!ctx.arg) return ctx.send('Informe o autor.')
    ctx.db.get().settings.packAuthor = ctx.arg
    ctx.db.save()
    await ctx.send('Autor: ' + ctx.arg)
  },

  async manutencao(ctx) {
    const s = ctx.db.get().settings
    s.maintenance = !s.maintenance
    ctx.db.save()
    await ctx.send('Manutencao: ' + (s.maintenance ? 'ligada' : 'desligada'))
  },

  async antipv(ctx) {
    const s = ctx.db.get().settings
    s.antiPv = !s.antiPv
    ctx.db.save()
    await ctx.send('Anti PV: ' + (s.antiPv ? 'ligado' : 'desligado'))
  },

  async adddias(ctx) {
    if (!ctx.isGroup) return ctx.send('Use no grupo.')
    const n = parseInt(ctx.args[0], 10)
    if (!n) return ctx.send('Informe os dias.\n' + ctx.prefix + 'adddias 15')
    const g = ctx.db.ensureGroup(ctx.jid)
    if (!g.expire) g.expire = Date.now()
    if (g.expire < Date.now()) g.expire = Date.now()
    g.expire += n * 86400000
    g.active = true
    ctx.db.save()
    await ctx.send('Adicionados ' + n + ' dias. Expira em: ' + ctx.u.expireText(g.expire))
  },

  async bangrupo(ctx) {
    if (!ctx.isGroup) return ctx.send('Use no grupo.')
    const g = ctx.db.ensureGroup(ctx.jid)
    g.banned = true
    g.active = false
    ctx.db.save()
    await ctx.send('Grupo banido do bot.')
  },

  async unbangrupo(ctx) {
    if (!ctx.isGroup) return ctx.send('Use no grupo.')
    const g = ctx.db.ensureGroup(ctx.jid)
    g.banned = false
    ctx.db.save()
    await ctx.send('Grupo desbanido. Use /addgrupo para reativar.')
  },

  async setbio(ctx) {
    if (!ctx.arg) return ctx.send('Informe a bio.')
    await ctx.sock.updateProfileStatus(ctx.arg)
    await ctx.send('Bio atualizada.')
  },

  async setfotobot(ctx) {
    const src = ctx.q || ctx.um
    const t = ctx.media.typeOf(src)
    if (t !== 'image') return ctx.send('Envie ou responda uma foto.')
    const buf = await ctx.media.download(ctx.sock, src)
    await ctx.sock.updateProfilePicture(ctx.botJid, buf)
    await ctx.send('Foto do bot atualizada.')
  },

  async backup(ctx) {
    const data = fs.readFileSync(ctx.db.file)
    await ctx.sock.sendMessage(ctx.jid, {
      document: data,
      mimetype: 'application/json',
      fileName: 'nexus-backup.json'
    }, { quoted: ctx.m })
  },

  async stats(ctx) {
    const d = ctx.db.get()
    const ativos = Object.values(d.groups).filter((g) => g.active).length
    await ctx.send(ctx.u.box('STATS', [
      'Usuarios: ' + Object.keys(d.users).length,
      'Grupos ativos: ' + ativos,
      'Donos: ' + d.owners.length,
      'VIPs: ' + d.vips.length,
      'Banidos: ' + d.bannedUsers.length,
      'Memoria: ' + Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB'
    ]))
  },

  async reiniciar(ctx) {
    await ctx.send('Reiniciando...')
    ctx.db.saveNow()
    process.exit(0)
  },

  async exec(ctx) {
    if (!ctx.arg) return ctx.send('Informe o comando do sistema.')
    exec(ctx.arg, { timeout: 8000 }, async (err, stdout, stderr) => {
      const out = (stdout || stderr || err?.message || 'sem saida').slice(0, 3500)
      await ctx.send('```' + out + '```')
    })
  },

  async seradm(ctx) {
    if (!ctx.isGroup) return ctx.send('Use no grupo.')
    try {
      await ctx.sock.groupParticipantsUpdate(ctx.jid, [ctx.botJid], 'promote')
      await ctx.send('Tentei me promover a admin.')
    } catch (e) {
      await ctx.send('Nao consegui. Me coloque como admin manualmente.')
    }
  },

  async limpardados(ctx) {
    if (ctx.args[0] !== 'confirmar') return ctx.send('Para apagar warns/mutes use:\n' + ctx.prefix + 'limpardados confirmar')
    const d = ctx.db.get()
    d.warns = {}
    d.mutes = {}
    ctx.db.save()
    await ctx.send('Warns e mutes limpos.')
  },

  async clonarbio(ctx) {
    const t = ctx.target()
    if (!t) return ctx.send('Marque o usuario.')
    try {
      const st = await ctx.sock.fetchStatus(t)
      if (st?.status) await ctx.sock.updateProfileStatus(st.status)
      await ctx.send('Bio clonada.')
    } catch {
      await ctx.send('Nao foi possivel clonar.')
    }
  },

  async listcmd(ctx) {
    const { ALL } = require('../lib/registry')
    await ctx.send('Total de comandos: ' + Object.keys(ALL).length)
  }
}
