function cooldown(user, key, ms) {
  const now = Date.now()
  if (user[key] && now - user[key] < ms) return ms - (now - user[key])
  user[key] = now
  return 0
}

const shop = {
  pico: { price: 150, desc: 'Aumenta mineracao' },
  vara: { price: 120, desc: 'Aumenta pesca' },
  rifle: { price: 200, desc: 'Aumenta caca' },
  escudo: { price: 300, desc: 'Protege de roubo' },
  pocao: { price: 80, desc: 'XP extra' },
  anel: { price: 500, desc: 'Item de casamento' },
  caixa: { price: 100, desc: 'Caixa misteriosa' }
}

module.exports = {
  async diario(ctx) {
    const user = ctx.db.ensureUser(ctx.num)
    const left = cooldown(user, 'daily', 20 * 3600000)
    if (left) return ctx.send('Aguarde ' + ctx.u.formatTime(left))
    const gain = ctx.u.rand(80, 180)
    user.money += gain
    ctx.db.save()
    await ctx.send('Diario coletado: +' + gain)
  },

  async trabalhar(ctx) {
    const user = ctx.db.ensureUser(ctx.num)
    const left = cooldown(user, 'work', 10 * 60000)
    if (left) return ctx.send('Descanso. ' + ctx.u.formatTime(left))
    const jobs = ['programador', 'entregador', 'cozinheiro', 'motorista', 'designer']
    const gain = ctx.u.rand(30, 90)
    user.money += gain
    ctx.db.save()
    await ctx.send('Voce trabalhou de ' + ctx.u.pick(jobs) + ' e ganhou ' + gain)
  },

  async minerar(ctx) {
    const user = ctx.db.ensureUser(ctx.num)
    const left = cooldown(user, 'mine', 8 * 60000)
    if (left) return ctx.send('Picaretando... ' + ctx.u.formatTime(left))
    const bonus = user.inventory.pico ? 20 : 0
    const gain = ctx.u.rand(15, 50) + bonus
    user.money += gain
    ctx.db.save()
    await ctx.send('Minerou e achou ' + gain)
  },

  async pescar(ctx) {
    const user = ctx.db.ensureUser(ctx.num)
    const left = cooldown(user, 'fish', 8 * 60000)
    if (left) return ctx.send('Agua calma. ' + ctx.u.formatTime(left))
    const bonus = user.inventory.vara ? 15 : 0
    const gain = ctx.u.rand(10, 45) + bonus
    user.money += gain
    ctx.db.save()
    await ctx.send('Pescou e vendeu por ' + gain)
  },

  async cacar(ctx) {
    const user = ctx.db.ensureUser(ctx.num)
    const left = cooldown(user, 'hunt', 8 * 60000)
    if (left) return ctx.send('Floresta vazia. ' + ctx.u.formatTime(left))
    const bonus = user.inventory.rifle ? 25 : 0
    const gain = ctx.u.rand(12, 55) + bonus
    user.money += gain
    ctx.db.save()
    await ctx.send('Cacou e faturou ' + gain)
  },

  async crime(ctx) {
    const user = ctx.db.ensureUser(ctx.num)
    const left = cooldown(user, 'crime', 15 * 60000)
    if (left) return ctx.send('Policia de olho. ' + ctx.u.formatTime(left))
    if (Math.random() < 0.45) {
      const loss = ctx.u.rand(20, 70)
      user.money = Math.max(0, user.money - loss)
      ctx.db.save()
      return ctx.send('Voce foi pego e perdeu ' + loss)
    }
    const gain = ctx.u.rand(40, 140)
    user.money += gain
    ctx.db.save()
    await ctx.send('Crime sucesso: +' + gain)
  },

  async carteira(ctx) {
    const t = ctx.target() ? ctx.u.onlyNum(ctx.target()) : ctx.num
    const user = ctx.db.ensureUser(t)
    await ctx.send('Carteira de ' + t + ': ' + user.money)
  },

  async pix(ctx) {
    const t = ctx.target()
    const val = parseInt(ctx.args.find((a) => /^\d+$/.test(a)) || '0', 10)
    if (!t || !val) return ctx.send('Use: ' + ctx.prefix + 'pix @user 50')
    if (val < 1) return ctx.send('Valor invalido.')
    const from = ctx.db.ensureUser(ctx.num)
    const to = ctx.db.ensureUser(ctx.u.onlyNum(t))
    if (from.money < val) return ctx.send('Saldo insuficiente.')
    from.money -= val
    to.money += val
    ctx.db.save()
    await ctx.sock.sendMessage(ctx.jid, { text: 'PIX ' + val + ' para @' + ctx.u.onlyNum(t), mentions: [t] })
  },

  async doar(ctx) {
    return module.exports.pix(ctx)
  },

  async apostar(ctx) {
    const val = parseInt(ctx.args[0] || '0', 10)
    if (val < 5) return ctx.send('Aposte no minimo 5.\n' + ctx.prefix + 'apostar 20')
    const user = ctx.db.ensureUser(ctx.num)
    if (user.money < val) return ctx.send('Saldo insuficiente.')
    if (Math.random() < 0.48) {
      user.money += val
      ctx.db.save()
      return ctx.send('Ganhou +' + val + ' | Saldo ' + user.money)
    }
    user.money -= val
    ctx.db.save()
    await ctx.send('Perdeu ' + val + ' | Saldo ' + user.money)
  },

  async loja(ctx) {
    const lines = Object.entries(shop).map(([k, v]) => k + ' — ' + v.price + ' (' + v.desc + ')')
    await ctx.send(ctx.u.box('LOJA', lines) + '\n' + ctx.prefix + 'comprar pico')
  },

  async comprar(ctx) {
    const item = (ctx.args[0] || '').toLowerCase()
    if (!shop[item]) return ctx.send('Item invalido. Veja ' + ctx.prefix + 'loja')
    const user = ctx.db.ensureUser(ctx.num)
    if (user.money < shop[item].price) return ctx.send('Sem saldo.')
    user.money -= shop[item].price
    user.inventory[item] = (user.inventory[item] || 0) + 1
    if (item === 'caixa') {
      const prize = ctx.u.rand(20, 180)
      user.money += prize
      ctx.db.save()
      return ctx.send('Abriu a caixa e ganhou ' + prize)
    }
    ctx.db.save()
    await ctx.send('Comprou ' + item + '. Saldo ' + user.money)
  },

  async inventario(ctx) {
    const user = ctx.db.ensureUser(ctx.num)
    const items = Object.entries(user.inventory || {}).filter(([, n]) => n > 0)
    await ctx.send(items.length ? items.map(([k, n]) => k + ' x' + n).join('\n') : 'Inventario vazio.')
  },

  async topmoney(ctx) {
    const users = Object.entries(ctx.db.get().users).sort((a, b) => b[1].money - a[1].money).slice(0, 10)
    await ctx.send(ctx.u.box('TOP MONEY', users.map(([n, u], i) => (i + 1) + '. ' + n + ' — ' + u.money)))
  },

  async sloteco(ctx) {
    const val = parseInt(ctx.args[0] || '10', 10)
    const user = ctx.db.ensureUser(ctx.num)
    if (val < 5 || user.money < val) return ctx.send('Aposte 5+ com saldo.')
    const s = ['A', 'B', 'C', '7']
    const a = ctx.u.pick(s), b = ctx.u.pick(s), c = ctx.u.pick(s)
    if (a === b && b === c) {
      user.money += val * 4
      ctx.db.save()
      return ctx.send(a + b + c + ' JACKPOT +' + (val * 4))
    }
    user.money -= val
    ctx.db.save()
    await ctx.send(a + b + c + ' perdeu ' + val)
  },

  async corrida(ctx) {
    const val = parseInt(ctx.args[0] || '10', 10)
    const user = ctx.db.ensureUser(ctx.num)
    if (user.money < val || val < 5) return ctx.send('Aposte 5+.')
    const win = Math.random() < 0.4
    if (win) user.money += val * 2
    else user.money -= val
    ctx.db.save()
    await ctx.send(win ? 'Seu cavalo ganhou +' + (val * 2) : 'Perdeu a corrida -' + val)
  },

  async roubar(ctx) {
    const t = ctx.target()
    if (!t) return ctx.send('Marque a vitima.')
    const from = ctx.db.ensureUser(ctx.num)
    const to = ctx.db.ensureUser(ctx.u.onlyNum(t))
    if (to.inventory.escudo) return ctx.send('Alvo tem escudo.')
    if (to.money < 20) return ctx.send('Alvo pobre demais.')
    if (Math.random() < 0.5) {
      const steal = Math.min(40, Math.floor(to.money * 0.15))
      to.money -= steal
      from.money += steal
      ctx.db.save()
      return ctx.sock.sendMessage(ctx.jid, { text: 'Roubou ' + steal + ' de @' + ctx.u.onlyNum(t), mentions: [t] })
    }
    const fine = ctx.u.rand(10, 30)
    from.money = Math.max(0, from.money - fine)
    ctx.db.save()
    await ctx.send('Roubo falhou. Multa ' + fine)
  },

  async classe(ctx) {
    const ops = ['aventureiro', 'mago', 'guerreiro', 'ladino']
    const c = (ctx.args[0] || '').toLowerCase()
    if (!ops.includes(c)) return ctx.send('Classes: ' + ops.join(', '))
    const user = ctx.db.ensureUser(ctx.num)
    user.class = c
    ctx.db.save()
    await ctx.send('Classe: ' + c)
  },

  async banco(ctx) {
    const user = ctx.db.ensureUser(ctx.num)
    await ctx.send('Saldo: ' + user.money + '\nLevel: ' + user.level)
  },

  async reseteco(ctx) {
    if (!ctx.isOwner) return ctx.send('So dono.')
    const t = ctx.target()
    if (!t) return ctx.send('Marque o usuario.')
    const user = ctx.db.ensureUser(ctx.u.onlyNum(t))
    user.money = 0
    user.inventory = {}
    ctx.db.save()
    await ctx.send('Economia resetada.')
  }
}
