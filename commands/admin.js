function needGroup(ctx) {
  if (!ctx.isGroup) {
    ctx.send('Este comando so funciona em grupo.')
    return false
  }
  return true
}

function needBotAdm(ctx) {
  if (!ctx.botIsAdm) {
    ctx.send('Eu preciso ser administrador do grupo.')
    return false
  }
  return true
}

function toggle(ctx, key, label) {
  if (!needGroup(ctx)) return
  const g = ctx.db.ensureGroup(ctx.jid)
  if (ctx.args[0] === 'on' || ctx.args[0] === 'ligar') g[key] = true
  else if (ctx.args[0] === 'off' || ctx.args[0] === 'desligar') g[key] = false
  else g[key] = !g[key]
  ctx.db.save()
  return ctx.send(label + ': ' + (g[key] ? 'ligado' : 'desligado'))
}

module.exports = {
  async ban(ctx) {
    if (!needGroup(ctx) || !needBotAdm(ctx)) return
    const t = ctx.target()
    if (!t) return ctx.send('Marque, responda ou envie o numero.\n' + ctx.prefix + 'ban @user')
    if (ctx.u.onlyNum(t) === ctx.u.onlyNum(ctx.botJid)) return ctx.send('Nao posso me banir.')
    if (ctx.db.get().owners.includes(ctx.u.onlyNum(t))) return ctx.send('Nao posso banir o dono.')
    try {
      await ctx.sock.groupParticipantsUpdate(ctx.jid, [t], 'remove')
      await ctx.sock.sendMessage(ctx.jid, { text: 'Banido: @' + ctx.u.onlyNum(t), mentions: [t] })
    } catch (e) {
      await ctx.send('Falha ao banir. ' + e.message)
    }
  },

  async apagar(ctx) {
    if (!needGroup(ctx) || !needBotAdm(ctx)) return
    if (!ctx.q) return ctx.send('Responda a mensagem que deseja apagar.\n' + ctx.prefix + 'apagar')
    try {
      const key = {
        remoteJid: ctx.jid,
        fromMe: Boolean(ctx.q.key?.fromMe),
        id: ctx.q.key.id,
        participant: ctx.q.participant || ctx.q.key.participant
      }
      await ctx.sock.sendMessage(ctx.jid, { delete: key })
      try { await ctx.sock.sendMessage(ctx.jid, { delete: ctx.m.key }) } catch {}
    } catch (e) {
      await ctx.send('Nao consegui apagar. Preciso ser admin.')
    }
  },

  async promover(ctx) {
    if (!needGroup(ctx) || !needBotAdm(ctx)) return
    const t = ctx.target()
    if (!t) return ctx.send('Marque quem promover.')
    await ctx.sock.groupParticipantsUpdate(ctx.jid, [t], 'promote')
    await ctx.sock.sendMessage(ctx.jid, { text: 'Promovido: @' + ctx.u.onlyNum(t), mentions: [t] })
  },

  async rebaixar(ctx) {
    if (!needGroup(ctx) || !needBotAdm(ctx)) return
    const t = ctx.target()
    if (!t) return ctx.send('Marque quem rebaixar.')
    await ctx.sock.groupParticipantsUpdate(ctx.jid, [t], 'demote')
    await ctx.sock.sendMessage(ctx.jid, { text: 'Rebaixado: @' + ctx.u.onlyNum(t), mentions: [t] })
  },

  async add(ctx) {
    if (!needGroup(ctx) || !needBotAdm(ctx)) return
    const n = ctx.u.onlyNum(ctx.args[0] || '')
    if (!n) return ctx.send('Informe o numero.\n' + ctx.prefix + 'add 5599999999999')
    try {
      const res = await ctx.sock.groupParticipantsUpdate(ctx.jid, [n + '@s.whatsapp.net'], 'add')
      await ctx.send('Convite/adicao enviada para ' + n)
    } catch (e) {
      await ctx.send('Falha ao adicionar: ' + e.message)
    }
  },

  async marcar(ctx) {
    if (!needGroup(ctx)) return
    const parts = ctx.meta.participants.map((p) => p.id)
    const text = (ctx.arg || 'Chamando todos') + '\n\n' + parts.map((p) => '@' + ctx.u.onlyNum(p)).join('\n')
    await ctx.sock.sendMessage(ctx.jid, { text, mentions: parts })
  },

  async hidetag(ctx) {
    if (!needGroup(ctx)) return
    const parts = ctx.meta.participants.map((p) => p.id)
    await ctx.sock.sendMessage(ctx.jid, { text: ctx.arg || 'aviso', mentions: parts })
  },

  async fechar(ctx) {
    if (!needGroup(ctx) || !needBotAdm(ctx)) return
    await ctx.sock.groupSettingUpdate(ctx.jid, 'announcement')
    await ctx.send('Grupo fechado. So admins falam.')
  },

  async abrir(ctx) {
    if (!needGroup(ctx) || !needBotAdm(ctx)) return
    await ctx.sock.groupSettingUpdate(ctx.jid, 'not_announcement')
    await ctx.send('Grupo aberto.')
  },

  async setnomegrupo(ctx) {
    if (!needGroup(ctx) || !needBotAdm(ctx)) return
    if (!ctx.arg) return ctx.send('Informe o nome.')
    await ctx.sock.groupUpdateSubject(ctx.jid, ctx.arg)
    await ctx.send('Nome do grupo alterado.')
  },

  async setdesc(ctx) {
    if (!needGroup(ctx) || !needBotAdm(ctx)) return
    if (!ctx.arg) return ctx.send('Informe a descricao.')
    await ctx.sock.groupUpdateDescription(ctx.jid, ctx.arg)
    await ctx.send('Descricao alterada.')
  },

  async setregras(ctx) {
    if (!needGroup(ctx)) return
    if (!ctx.arg) return ctx.send('Informe as regras.')
    const g = ctx.db.ensureGroup(ctx.jid)
    g.regras = ctx.arg
    ctx.db.save()
    await ctx.send('Regras salvas.')
  },

  async regras(ctx) {
    if (!needGroup(ctx)) return
    const g = ctx.db.ensureGroup(ctx.jid)
    await ctx.send('*Regras do grupo*\n\n' + g.regras)
  },

  async warn(ctx) {
    if (!needGroup(ctx)) return
    const t = ctx.target()
    if (!t) return ctx.send('Marque quem advertir.')
    const n = ctx.u.onlyNum(t)
    const key = ctx.jid + ':' + n
    const d = ctx.db.get()
    d.warns[key] = (d.warns[key] || 0) + 1
    ctx.db.save()
    const w = d.warns[key]
    await ctx.sock.sendMessage(ctx.jid, { text: 'Advertencia ' + w + '/' + ctx.config.maxWarns + ' para @' + n, mentions: [t] })
    if (w >= ctx.config.maxWarns && ctx.botIsAdm) {
      try {
        await ctx.sock.groupParticipantsUpdate(ctx.jid, [t], 'remove')
        d.warns[key] = 0
        ctx.db.save()
        await ctx.send('Limite de advertencias. Usuario removido.')
      } catch {}
    }
  },

  async unwarn(ctx) {
    if (!needGroup(ctx)) return
    const t = ctx.target()
    if (!t) return ctx.send('Marque o usuario.')
    const key = ctx.jid + ':' + ctx.u.onlyNum(t)
    const d = ctx.db.get()
    d.warns[key] = Math.max(0, (d.warns[key] || 0) - 1)
    ctx.db.save()
    await ctx.send('Advertencia removida. Atual: ' + d.warns[key])
  },

  async warns(ctx) {
    if (!needGroup(ctx)) return
    const t = ctx.target() || ctx.sender
    const key = ctx.jid + ':' + ctx.u.onlyNum(t)
    const w = ctx.db.get().warns[key] || 0
    await ctx.send('Advertencias: ' + w + '/' + ctx.config.maxWarns)
  },

  async resetwarns(ctx) {
    if (!needGroup(ctx)) return
    const t = ctx.target()
    if (!t) return ctx.send('Marque o usuario.')
    ctx.db.get().warns[ctx.jid + ':' + ctx.u.onlyNum(t)] = 0
    ctx.db.save()
    await ctx.send('Advertencias zeradas.')
  },

  async mute(ctx) {
    if (!needGroup(ctx)) return
    const t = ctx.target()
    if (!t) return ctx.send('Marque quem silenciar. Opcional: minutos\n' + ctx.prefix + 'mute @user 10')
    const min = parseInt(ctx.args.find((a) => /^\d+$/.test(a)) || '10', 10)
    ctx.db.get().mutes[ctx.jid + ':' + ctx.u.onlyNum(t)] = Date.now() + min * 60000
    ctx.db.save()
    await ctx.sock.sendMessage(ctx.jid, { text: '@' + ctx.u.onlyNum(t) + ' silenciado por ' + min + ' min.', mentions: [t] })
  },

  async unmute(ctx) {
    if (!needGroup(ctx)) return
    const t = ctx.target()
    if (!t) return ctx.send('Marque o usuario.')
    delete ctx.db.get().mutes[ctx.jid + ':' + ctx.u.onlyNum(t)]
    ctx.db.save()
    await ctx.send('Usuario dessilenciado.')
  },

  async antilink(ctx) { return toggle(ctx, 'antilink', 'Antilink') },
  async antifake(ctx) { return toggle(ctx, 'antifake', 'Antifake') },
  async antiflood(ctx) { return toggle(ctx, 'antiflood', 'Antiflood') },
  async antifoto(ctx) { return toggle(ctx, 'antifoto', 'Antifoto') },
  async antivideo(ctx) { return toggle(ctx, 'antivideo', 'Antivideo') },
  async antisticker(ctx) { return toggle(ctx, 'antisticker', 'Antisticker') },
  async antivoz(ctx) { return toggle(ctx, 'antivoz', 'Antivoz') },
  async welcome(ctx) { return toggle(ctx, 'welcome', 'Boas-vindas') },
  async goodbye(ctx) { return toggle(ctx, 'goodbye', 'Despedida') },
  async onlyadm(ctx) { return toggle(ctx, 'onlyAdm', 'Modo so admin') },
  async autosticker(ctx) { return toggle(ctx, 'autosticker', 'Auto figurinha') },
  async nsfw(ctx) { return toggle(ctx, 'nsfw', 'NSFW') },
  async leveling(ctx) { return toggle(ctx, 'leveling', 'Leveling') },
  async antiviewonce(ctx) { return toggle(ctx, 'antiviewonce', 'Anti view once') },

  async setwelcome(ctx) {
    if (!needGroup(ctx)) return
    if (!ctx.arg) return ctx.send('Use @user e {grupo} no texto.')
    const g = ctx.db.ensureGroup(ctx.jid)
    g.welcomeText = ctx.arg
    ctx.db.save()
    await ctx.send('Mensagem de boas-vindas salva.')
  },

  async setgoodbye(ctx) {
    if (!needGroup(ctx)) return
    if (!ctx.arg) return ctx.send('Use @user no texto.')
    const g = ctx.db.ensureGroup(ctx.jid)
    g.goodbyeText = ctx.arg
    ctx.db.save()
    await ctx.send('Mensagem de despedida salva.')
  },

  async linkgrupo(ctx) {
    if (!needGroup(ctx) || !needBotAdm(ctx)) return
    const code = await ctx.sock.groupInviteCode(ctx.jid)
    await ctx.send('https://chat.whatsapp.com/' + code)
  },

  async revogar(ctx) {
    if (!needGroup(ctx) || !needBotAdm(ctx)) return
    await ctx.sock.groupRevokeInvite(ctx.jid)
    const code = await ctx.sock.groupInviteCode(ctx.jid)
    await ctx.send('Link revogado.\nNovo: https://chat.whatsapp.com/' + code)
  },

  async listadm(ctx) {
    if (!needGroup(ctx)) return
    const adms = ctx.meta.participants.filter((p) => p.admin)
    const text = '*Admins*\n\n' + adms.map((p) => '@' + ctx.u.onlyNum(p.id)).join('\n')
    await ctx.sock.sendMessage(ctx.jid, { text, mentions: adms.map((p) => p.id) })
  },

  async infogrupo(ctx) {
    if (!needGroup(ctx)) return
    const g = ctx.db.ensureGroup(ctx.jid)
    const m = ctx.meta
    await ctx.send(ctx.u.box('GRUPO', [
      'Nome: ' + m.subject,
      'Membros: ' + m.participants.length,
      'Criacao: ' + new Date((m.creation || 0) * 1000).toLocaleDateString('pt-BR'),
      'Ativo: ' + (g.active ? 'sim' : 'nao'),
      'Expira: ' + ctx.u.expireText(g.expire),
      'Antilink: ' + (g.antilink ? 'on' : 'off'),
      'Welcome: ' + (g.welcome ? 'on' : 'off'),
      'OnlyAdm: ' + (g.onlyAdm ? 'on' : 'off')
    ]))
  },

  async setfoto(ctx) {
    if (!needGroup(ctx) || !needBotAdm(ctx)) return
    const src = ctx.q || ctx.um
    if (ctx.media.typeOf(src) !== 'image') return ctx.send('Envie ou responda uma foto.')
    const buf = await ctx.media.download(ctx.sock, src)
    await ctx.sock.updateProfilePicture(ctx.jid, buf)
    await ctx.send('Foto do grupo atualizada.')
  },

  async sorteio(ctx) {
    if (!needGroup(ctx)) return
    const parts = ctx.meta.participants.map((p) => p.id)
    const win = ctx.u.pick(parts)
    await ctx.sock.sendMessage(ctx.jid, { text: 'Sorteado: @' + ctx.u.onlyNum(win), mentions: [win] })
  },

  async enquete(ctx) {
    if (!needGroup(ctx)) return
    const parts = ctx.arg.split('|').map((s) => s.trim()).filter(Boolean)
    if (parts.length < 3) return ctx.send('Use:\n' + ctx.prefix + 'enquete Pergunta | opc1 | opc2')
    await ctx.sock.sendMessage(ctx.jid, {
      poll: { name: parts[0], values: parts.slice(1), selectableCount: 1 }
    })
  },

  async anuncios(ctx) {
    if (!needGroup(ctx)) return
    await ctx.send(ctx.arg || 'Sem anuncio.')
  },

  async revelar(ctx) {
    const src = ctx.q
    if (!src) return ctx.send('Responda uma mensagem de visualizacao unica.')
    try {
      const buf = await ctx.media.download(ctx.sock, src)
      const t = ctx.media.typeOf(src)
      if (t === 'image') await ctx.sock.sendMessage(ctx.jid, { image: buf, caption: 'Revelado' }, { quoted: ctx.m })
      else if (t === 'video') await ctx.sock.sendMessage(ctx.jid, { video: buf, caption: 'Revelado' }, { quoted: ctx.m })
      else await ctx.send('Tipo nao suportado.')
    } catch (e) {
      await ctx.send('Nao consegui revelar.')
    }
  },

  async todos(ctx) {
    return module.exports.marcar(ctx)
  },

  async silenciar(ctx) {
    return module.exports.fechar(ctx)
  },

  async kick(ctx) {
    return module.exports.ban(ctx)
  }
}
