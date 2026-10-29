const os = require('os')

function roleOf(ctx, num) {
  if (ctx.db.get().owners.includes(num)) return 'DONO'
  if (ctx.db.get().adminsBot.includes(num)) return 'ADMIN BOT'
  if (ctx.db.get().vips.includes(num)) return 'VIP'
  return 'MEMBRO'
}

function list(title, cmds, prefix) {
  return ['*' + title + '*', ...cmds.map((c) => prefix + c)].join('\n')
}

module.exports = {
  async menu(ctx) {
    const p = ctx.prefix
    const name = ctx.db.get().settings.botName || ctx.config.botName
    const text = [
      '╭━━━〔 ' + name + ' 〕━━━╮',
      '│ Prefixo: ' + p,
      '│ Seu cargo: ' + roleOf(ctx, ctx.num),
      '│ Ping: online',
      '╰━━━━━━━━━━━━━━━━╯',
      '',
      list('DONO', [
        'addgrupo permanente', 'addgrupo 30', 'delgrupo', 'listgrupos', 'adddias',
        'adddono', 'deldono', 'listdonos', 'addadmbot', 'deladmbot', 'listadmbot',
        'addvip', 'delvip', 'listvip', 'transmitir', 'sair', 'entrar',
        'bloquear', 'desbloquear', 'listblock', 'banuser', 'unbanuser', 'listban',
        'setprefix', 'setnome', 'setpack', 'setauthor', 'manutencao', 'antipv',
        'bangrupo', 'unbangrupo', 'setbio', 'setfotobot', 'backup', 'stats',
        'reiniciar', 'seradm', 'limpardados', 'clonarbio', 'listcmd'
      ], p),
      '',
      list('ADMIN DO GRUPO', [
        'ban', 'apagar', 'promover', 'rebaixar', 'add', 'marcar', 'hidetag',
        'fechar', 'abrir', 'setnomegrupo', 'setdesc', 'setregras', 'regras',
        'warn', 'unwarn', 'warns', 'resetwarns', 'mute', 'unmute',
        'antilink', 'antifake', 'antiflood', 'antifoto', 'antivideo', 'antisticker', 'antivoz',
        'welcome', 'goodbye', 'setwelcome', 'setgoodbye', 'onlyadm', 'autosticker',
        'nsfw', 'leveling', 'linkgrupo', 'revogar', 'listadm', 'infogrupo',
        'setfoto', 'sorteio', 'enquete', 'revelar'
      ], p),
      '',
      list('VIP / MIDIA', [
        'togif', 'steal', 'wallpaper', 'pinterest'
      ], p),
      '',
      list('MEMBRO', [
        'menu', 'ping', 'infobot', 'perfil', 'rank', 'level', 'afk', 'nick', 'recado',
        'sticker', 's', 'toimg', 'attp', 'ttp', 'emojimix', 'ia', 'traduzir',
        'clima', 'cep', 'ddd', 'cotacao', 'qr', 'encurtar', 'github', 'npm',
        'gerarsenha', 'dicionario', 'dono', 'criador', 'suporte', 'hora', 'data',
        'uptime', 'bot', 'totalcmd', 'cargo', 'grupos', 'sugestao', 'bug'
      ], p),
      '',
      list('BRINCADEIRAS', [
        'gay', 'ship', 'casar', 'divorciar', 'beijo', 'abraco', 'tapa', 'matar',
        'chutar', 'jokenpo', 'dado', 'cara', 'slot', 'roleta', 'piada', 'cantada',
        'fato', 'conselho', 'pergunta', 'bola8', 'chance', 'quando', 'ppt',
        'verdade', 'desafio', 'casal', 'rankgay', 'ranklindo', 'rankfeio',
        'rankamor', 'eununca', 'fakemsg', 'anagrama', 'forca', 'adivinha'
      ], p),
      '',
      list('ECONOMIA', [
        'diario', 'trabalhar', 'minerar', 'pescar', 'cacar', 'crime', 'carteira',
        'pix', 'apostar', 'loja', 'comprar', 'inventario', 'topmoney', 'doar',
        'sloteco', 'corrida', 'roubar'
      ], p),
      '',
      '_Um comando por linha. Bot 100% funcional._'
    ].join('\n')
    await ctx.send(text)
  },

  async ping(ctx) {
    const t = Date.now()
    await ctx.send('Pong! ' + (Date.now() - t) + 'ms | RAM ' + Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB')
  },

  async infobot(ctx) {
    const d = ctx.db.get()
    await ctx.send(ctx.u.box('INFO', [
      'Nome: ' + (d.settings.botName || ctx.config.botName),
      'Prefixo: ' + (d.settings.prefix || ctx.config.prefix),
      'Donos: ' + d.owners.length,
      'Grupos: ' + Object.values(d.groups).filter((g) => g.active).length,
      'Usuarios: ' + Object.keys(d.users).length,
      'Node: ' + process.version,
      'Host: ' + os.platform() + ' ' + os.arch()
    ]))
  },

  async perfil(ctx) {
    const t = ctx.target() || ctx.sender
    const n = ctx.u.onlyNum(t)
    const user = ctx.db.ensureUser(n)
    await ctx.sock.sendMessage(ctx.jid, {
      text: ctx.u.box('PERFIL', [
        'Numero: ' + n,
        'Cargo: ' + roleOf(ctx, n),
        'Nick: ' + (user.nick || '-'),
        'Bio: ' + (user.bio || '-'),
        'XP: ' + user.xp,
        'Level: ' + user.level,
        'Money: ' + user.money,
        'Classe: ' + user.class
      ]),
      mentions: [t]
    }, { quoted: ctx.m })
  },

  async rank(ctx) {
    const users = Object.entries(ctx.db.get().users).sort((a, b) => (b[1].level - a[1].level) || (b[1].xp - a[1].xp)).slice(0, 10)
    const lines = users.map(([n, u], i) => (i + 1) + '. ' + n + ' — Nv.' + u.level)
    await ctx.send(ctx.u.box('RANK LEVEL', lines.length ? lines : ['Vazio']))
  },

  async level(ctx) {
    const user = ctx.db.ensureUser(ctx.num)
    const need = ctx.u.xpForLevel(user.level)
    await ctx.send('Level ' + user.level + ' | XP ' + user.xp + '/' + need)
  },

  async afk(ctx) {
    ctx.db.get().afk[ctx.num] = { reason: ctx.arg || 'AFK', since: Date.now() }
    ctx.db.save()
    await ctx.send('Voce esta AFK: ' + (ctx.arg || 'sem motivo'))
  },

  async nick(ctx) {
    if (!ctx.arg) return ctx.send('Informe o nick.')
    ctx.db.ensureUser(ctx.num).nick = ctx.arg.slice(0, 24)
    ctx.db.save()
    await ctx.send('Nick: ' + ctx.arg.slice(0, 24))
  },

  async recado(ctx) {
    if (!ctx.arg) return ctx.send('Informe o recado.')
    ctx.db.ensureUser(ctx.num).bio = ctx.arg.slice(0, 80)
    ctx.db.save()
    await ctx.send('Recado salvo.')
  },

  async dono(ctx) {
    const owners = ctx.db.get().owners
    await ctx.sock.sendMessage(ctx.jid, {
      text: '*Donos do bot*\n' + owners.map((n) => n).join('\n'),
    }, { quoted: ctx.m })
  },

  async criador(ctx) {
    return module.exports.dono(ctx)
  },

  async suporte(ctx) {
    await ctx.send('Fale com o dono: ' + ctx.db.get().owners[0])
  },

  async hora(ctx) {
    await ctx.send(new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' }))
  },

  async data(ctx) {
    await ctx.send(new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }))
  },

  async uptime(ctx) {
    await ctx.send('Online ha ' + ctx.u.formatTime(process.uptime() * 1000))
  },

  async bot(ctx) {
    await ctx.send('Estou online. Use ' + ctx.prefix + 'menu')
  },

  async totalcmd(ctx) {
    const { ALL } = require('../lib/registry')
    await ctx.send('Comandos registrados: ' + Object.keys(ALL).length)
  },

  async cargo(ctx) {
    await ctx.send('Seu cargo: ' + roleOf(ctx, ctx.num))
  },

  async grupos(ctx) {
    const n = Object.values(ctx.db.get().groups).filter((g) => g.active).length
    await ctx.send('Grupos ativos: ' + n)
  },

  async sugestao(ctx) {
    if (!ctx.arg) return ctx.send('Escreva a sugestao.')
    ctx.db.get().suggestions.push({ from: ctx.num, text: ctx.arg, at: Date.now() })
    ctx.db.save()
    await ctx.send('Sugestao registrada.')
  },

  async bug(ctx) {
    if (!ctx.arg) return ctx.send('Descreva o bug.')
    ctx.db.get().bugs.push({ from: ctx.num, text: ctx.arg, at: Date.now() })
    ctx.db.save()
    await ctx.send('Bug registrado. Obrigado.')
  },

  async pinghost(ctx) {
    await ctx.send('Pong host ' + os.hostname())
  },

  async convite(ctx) {
    if (!ctx.isGroup) return ctx.send('Use em um grupo.')
    await ctx.send('Peca a um admin: ' + ctx.prefix + 'linkgrupo')
  },

  async info(ctx) {
    return module.exports.infobot(ctx)
  },

  async help(ctx) {
    return module.exports.menu(ctx)
  }
}
