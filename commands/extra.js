module.exports = {
  async idade(ctx) {
    const n = parseInt(ctx.args[0], 10)
    if (!n || n < 1900) return ctx.send('Informe o ano de nascimento.\n' + ctx.prefix + 'idade 2000')
    const ano = new Date().getFullYear()
    await ctx.send('Idade aproximada: ' + (ano - n) + ' anos')
  },

  async anonymo(ctx) {
    if (!ctx.arg) return ctx.send('Digite a mensagem anonima.')
    await ctx.sock.sendMessage(ctx.jid, { text: '*Anonimo:*\n' + ctx.arg })
  },

  async dizer(ctx) {
    if (!ctx.arg) return ctx.send('Digite o que eu devo dizer.')
    await ctx.sendRaw(ctx.arg)
  },

  async repetir(ctx) {
    if (!ctx.arg) return ctx.send('Digite o texto.')
    await ctx.send(ctx.arg + '\n' + ctx.arg)
  },

  async cor(ctx) {
    const hex = (ctx.args[0] || '#7c3aed').replace('#', '')
    await ctx.send('Cor: #' + hex.slice(0, 6))
  },

  async moeda(ctx) {
    await ctx.send(ctx.u.pick(['Cara', 'Coroa']))
  },

  async sorte(ctx) {
    await ctx.send('Sua sorte hoje: ' + ctx.u.rand(1, 100) + '/100')
  },

  async amor(ctx) {
    const t = ctx.target()
    if (!t) return ctx.send('Marque alguem.')
    await ctx.sock.sendMessage(ctx.jid, { text: 'Amor entre voces: ' + ctx.u.rand(0, 100) + '%', mentions: [ctx.sender, t] })
  },

  async odio(ctx) {
    const t = ctx.target()
    if (!t) return ctx.send('Marque alguem.')
    await ctx.sock.sendMessage(ctx.jid, { text: 'Odio (fake): ' + ctx.u.rand(0, 100) + '%', mentions: [ctx.sender, t] })
  },

  async amigo(ctx) {
    if (!ctx.isGroup) return ctx.send('So em grupo.')
    const p = ctx.u.pick(ctx.meta.participants).id
    await ctx.sock.sendMessage(ctx.jid, { text: 'Seu amigo secreto: @' + ctx.u.onlyNum(p), mentions: [p] })
  },

  async inimigo(ctx) {
    if (!ctx.isGroup) return ctx.send('So em grupo.')
    const p = ctx.u.pick(ctx.meta.participants).id
    await ctx.sock.sendMessage(ctx.jid, { text: 'Inimigo do dia (brincadeira): @' + ctx.u.onlyNum(p), mentions: [p] })
  },

  async beber(ctx) {
    await ctx.send(ctx.u.pick(['Agua', 'Suco', 'Cafe', 'Cha', 'Refri']) + ' gelado pra voce.')
  },

  async comer(ctx) {
    await ctx.send('Hoje o cardapio e: ' + ctx.u.pick(['pizza', 'churrasco', 'strogonoff', 'feijoada', 'lasanha']))
  },

  async dormir(ctx) {
    await ctx.send('Boa noite. Relogio: ' + new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' }))
  },

  async acordar(ctx) {
    await ctx.send('Bom dia! Cafe pronto.')
  },

  async treinar(ctx) {
    await ctx.send(ctx.u.pick(['10 flexoes', '20 agachamentos', '15 abdominais', 'corrida 1km']))
  },

  async meta(ctx) {
    if (!ctx.arg) return ctx.send('Qual sua meta?')
    await ctx.send('Meta registrada: ' + ctx.arg)
  },

  async lembrete(ctx) {
    const min = parseInt(ctx.args[0], 10)
    const msg = ctx.args.slice(1).join(' ')
    if (!min || !msg) return ctx.send(ctx.prefix + 'lembrete 5 beber agua')
    await ctx.send('Lembrete em ' + min + ' min.')
    setTimeout(() => {
      ctx.sock.sendMessage(ctx.jid, { text: 'Lembrete: ' + msg, mentions: [ctx.sender] }).catch(() => {})
    }, Math.min(min, 120) * 60000)
  },

  async contagem(ctx) {
    const n = Math.min(5, parseInt(ctx.args[0] || '3', 10) || 3)
    for (let i = n; i >= 1; i--) {
      await ctx.sendRaw(String(i))
      await ctx.u.sleep(800)
    }
    await ctx.send('Ja!')
  },

  async senhaforte(ctx) {
    return ctx.send('Use ' + ctx.prefix + 'gerarsenha 16')
  },

  async uuid(ctx) {
    const id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
    await ctx.send(id)
  },

  async base64(ctx) {
    if (!ctx.arg) return ctx.send('Digite o texto.')
    await ctx.send(Buffer.from(ctx.arg).toString('base64'))
  },

  async decode64(ctx) {
    if (!ctx.arg) return ctx.send('Cole o base64.')
    try {
      await ctx.send(Buffer.from(ctx.arg, 'base64').toString('utf8').slice(0, 1500))
    } catch {
      await ctx.send('Base64 invalido.')
    }
  },

  async md5fake(ctx) {
    if (!ctx.arg) return ctx.send('Digite o texto.')
    const crypto = require('crypto')
    await ctx.send(crypto.createHash('md5').update(ctx.arg).digest('hex'))
  },

  async sha256(ctx) {
    if (!ctx.arg) return ctx.send('Digite o texto.')
    const crypto = require('crypto')
    await ctx.send(crypto.createHash('sha256').update(ctx.arg).digest('hex'))
  },

  async ascii(ctx) {
    const t = (ctx.arg || 'NEXUS').slice(0, 12)
    await ctx.send('```\n' + t.split('').join(' ') + '\n```')
  },

  async tabela(ctx) {
    await ctx.send('Prefixo atual: ' + ctx.prefix + '\nMenu: ' + ctx.prefix + 'menu')
  },

  async statusbot(ctx) {
    await ctx.send('Status: online\nManutencao: ' + (ctx.db.get().settings.maintenance ? 'sim' : 'nao'))
  },

  async versao(ctx) {
    await ctx.send('NEXUS BOT v1.0.0')
  },

  async pingms(ctx) {
    const t = Date.now()
    await ctx.send(String(Date.now() - t) + 'ms')
  },

  async ram(ctx) {
    await ctx.send(Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB')
  },

  async cpu(ctx) {
    const os = require('os')
    await ctx.send('CPU cores: ' + os.cpus().length)
  },

  async plataforma(ctx) {
    const os = require('os')
    await ctx.send(os.platform() + ' ' + os.release())
  },

  async nodev(ctx) {
    await ctx.send(process.version)
  },

  async conv(ctx) {
    const n = parseFloat(ctx.args[0])
    const de = (ctx.args[1] || '').toLowerCase()
    const para = (ctx.args[2] || '').toLowerCase()
    if (!n || !de || !para) return ctx.send(ctx.prefix + 'conv 10 km milha')
    let r = null
    if (de === 'km' && para === 'milha') r = n * 0.621371
    if (de === 'milha' && para === 'km') r = n / 0.621371
    if (de === 'c' && para === 'f') r = n * 9 / 5 + 32
    if (de === 'f' && para === 'c') r = (n - 32) * 5 / 9
    if (de === 'kg' && para === 'lb') r = n * 2.20462
    if (de === 'lb' && para === 'kg') r = n / 2.20462
    if (r === null) return ctx.send('Pares: km milha | c f | kg lb')
    await ctx.send(n + ' ' + de + ' = ' + r.toFixed(2) + ' ' + para)
  },

  async porcento(ctx) {
    const a = parseFloat(ctx.args[0])
    const b = parseFloat(ctx.args[1])
    if (isNaN(a) || isNaN(b) || !b) return ctx.send(ctx.prefix + 'porcento 25 200')
    await ctx.send(((a / b) * 100).toFixed(2) + '%')
  },

  async media(ctx) {
    const nums = ctx.args.map(Number).filter((n) => !isNaN(n))
    if (!nums.length) return ctx.send(ctx.prefix + 'media 7 8 9')
    const m = nums.reduce((s, n) => s + n, 0) / nums.length
    await ctx.send('Media: ' + m.toFixed(2))
  },

  async maxmin(ctx) {
    const nums = ctx.args.map(Number).filter((n) => !isNaN(n))
    if (!nums.length) return ctx.send(ctx.prefix + 'maxmin 3 9 1')
    await ctx.send('Max ' + Math.max(...nums) + ' | Min ' + Math.min(...nums))
  },

  async palindromo(ctx) {
    const s = (ctx.arg || '').toLowerCase().replace(/\s/g, '')
    if (!s) return ctx.send('Digite uma palavra.')
    await ctx.send(s === s.split('').reverse().join('') ? 'E palindromo' : 'Nao e palindromo')
  },

  async senhaint(ctx) {
    await ctx.send(String(ctx.u.rand(100000, 999999)))
  },

  async dado20(ctx) {
    await ctx.send('d20: ' + ctx.u.rand(1, 20))
  },

  async dado100(ctx) {
    await ctx.send('d100: ' + ctx.u.rand(1, 100))
  },

  async carta(ctx) {
    const n = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
    const naipe = ['copas', 'ouros', 'espadas', 'paus']
    await ctx.send(ctx.u.pick(n) + ' de ' + ctx.u.pick(naipe))
  },

  async rpg(ctx) {
    await ctx.send('Voce encontrou um ' + ctx.u.pick(['goblin', 'bau', 'pocoes', 'dragao bebe', 'npc misterioso']))
  },

  async missao(ctx) {
    await ctx.send('Missao: ' + ctx.u.pick(['derrote 3 slimes', 'entregue uma carta', 'mine 10 pedras', 'pesque um lendario']))
  },

  async pet(ctx) {
    const d = ctx.db.get()
    if (!d.pets[ctx.num]) d.pets[ctx.num] = { name: ctx.arg || 'Bolt', xp: 0 }
    else if (ctx.arg) d.pets[ctx.num].name = ctx.arg
    d.pets[ctx.num].xp += 1
    ctx.db.save()
    const p = d.pets[ctx.num]
    await ctx.send('Pet: ' + p.name + ' | XP ' + p.xp)
  },

  async alimentar(ctx) {
    const d = ctx.db.get()
    if (!d.pets[ctx.num]) return ctx.send('Crie um pet com ' + ctx.prefix + 'pet nome')
    d.pets[ctx.num].xp += 5
    ctx.db.save()
    await ctx.send(d.pets[ctx.num].name + ' comeu. XP ' + d.pets[ctx.num].xp)
  },

  async apelido(ctx) {
    const t = ctx.target()
    if (!t) return ctx.send('Marque alguem.')
    const nicks = ['Capitao', 'Ninja', 'Profeta', 'Relampago', 'Mestre', 'Sombra']
    await ctx.sock.sendMessage(ctx.jid, { text: '@' + ctx.u.onlyNum(t) + ' agora e ' + ctx.u.pick(nicks), mentions: [t] })
  },

  async toque(ctx) {
    const t = ctx.target()
    if (!t) return ctx.send('Marque alguem.')
    await ctx.sock.sendMessage(ctx.jid, { text: '@' + ctx.num + ' tocou @' + ctx.u.onlyNum(t), mentions: [ctx.sender, t] })
  },

  async piscadinha(ctx) {
    const t = ctx.target()
    if (!t) return ctx.send('Marque alguem.')
    await ctx.sock.sendMessage(ctx.jid, { text: '@' + ctx.num + ' deu uma piscadinha para @' + ctx.u.onlyNum(t), mentions: [ctx.sender, t] })
  },

  async dancar(ctx) {
    await ctx.send(ctx.u.pick(['quebrando', 'twerk de bot', 'passinho do nexus', 'robot']))
  },

  async cantar(ctx) {
    await ctx.send('la la la... ' + (ctx.arg || 'sem letra'))
  },

  async gritar(ctx) {
    await ctx.send((ctx.arg || 'aaaa').toUpperCase() + '!!!!')
  },

  async sussurrar(ctx) {
    await ctx.send('_' + (ctx.arg || 'psiu') + '_')
  },

  async citacao(ctx) {
    await ctx.send(ctx.u.pick([
      'A persistencia realiza o impossivel.',
      'Quem nao arrisca nao petisca.',
      'O segredo e comecar.',
      'Feito e melhor que perfeito.'
    ]))
  },

  async motivacao(ctx) {
    await ctx.send(ctx.u.pick([
      'Voce consegue.',
      'Um passo de cada vez.',
      'Disciplina vence talento.',
      'Hoje e um otimo dia para evoluir.'
    ]))
  },

  async desmotivar(ctx) {
    await ctx.send('(ironia) Desiste nunca. Agora vai.')
  },

  async piadaruim(ctx) {
    await ctx.send('Por que o zero foi ao medico? Porque estava oito.')
  },

  async charada(ctx) {
    await ctx.send(ctx.u.pick([
      'O que e o que e: cai em pe e corre deitado? A chuva.',
      'Quanto mais se tira, maior fica? O buraco.',
      'Tem coroa mas nao e rei? O abacaxi.'
    ]))
  },

  async adivinhar(ctx) {
    await ctx.send('Estou pensando em um numero de 1 a 5. Use ' + ctx.prefix + 'chute 3')
  },

  async chute(ctx) {
    const n = parseInt(ctx.args[0], 10)
    const s = ctx.u.rand(1, 5)
    await ctx.send(n === s ? 'Acertou!' : 'Era ' + s)
  },

  async simnao(ctx) {
    await ctx.send(ctx.u.pick(['Sim', 'Nao']))
  },

  async talvez(ctx) {
    await ctx.send('Talvez...')
  },

  async rate(ctx) {
    await ctx.send('Nota: ' + ctx.u.rand(0, 10) + '/10')
  },

  async nota(ctx) {
    return module.exports.rate(ctx)
  },

  async zoeira(ctx) {
    const t = ctx.target() || ctx.sender
    await ctx.sock.sendMessage(ctx.jid, { text: 'Zoeira com @' + ctx.u.onlyNum(t) + ' liberada.', mentions: [t] })
  },

  async stonks(ctx) {
    await ctx.send('STONKS +' + ctx.u.rand(1, 99) + '%')
  },

  async notstonks(ctx) {
    await ctx.send('NOT STONKS -' + ctx.u.rand(1, 99) + '%')
  },

  async climaemoji(ctx) {
    await ctx.send(ctx.u.pick(['sol', 'chuva', 'nublado', 'trovoada', 'vento']))
  },

  async sorteio2(ctx) {
    const ops = ctx.arg.split('|').map((s) => s.trim()).filter(Boolean)
    if (ops.length < 2) return ctx.send(ctx.prefix + 'sorteio2 a | b | c')
    await ctx.send('Sorteado: ' + ctx.u.pick(ops))
  },

  async duo(ctx) {
    if (!ctx.isGroup) return ctx.send('So em grupo.')
    const parts = ctx.meta.participants.map((p) => p.id)
    const a = ctx.u.pick(parts)
    let b = ctx.u.pick(parts)
    await ctx.sock.sendMessage(ctx.jid, { text: 'Duo: @' + ctx.u.onlyNum(a) + ' + @' + ctx.u.onlyNum(b), mentions: [a, b] })
  },

  async trio(ctx) {
    if (!ctx.isGroup) return ctx.send('So em grupo.')
    const parts = [...ctx.meta.participants].sort(() => Math.random() - 0.5).slice(0, 3)
    const text = 'Trio: ' + parts.map((p) => '@' + ctx.u.onlyNum(p.id)).join(' ')
    await ctx.sock.sendMessage(ctx.jid, { text, mentions: parts.map((p) => p.id) })
  },

  async top5(ctx) {
    if (!ctx.isGroup) return ctx.send('So em grupo.')
    const parts = [...ctx.meta.participants].sort(() => Math.random() - 0.5).slice(0, 5)
    const text = '*Top 5*\n' + parts.map((p, i) => (i + 1) + '. @' + ctx.u.onlyNum(p.id)).join('\n')
    await ctx.sock.sendMessage(ctx.jid, { text, mentions: parts.map((p) => p.id) })
  },

  async recadoaleatorio(ctx) {
    await ctx.send(ctx.u.pick(['Beba agua', 'Estique as pernas', 'Salve o arquivo', 'Mande um oi para alguem']))
  },

  async bomdia(ctx) {
    await ctx.send('Bom dia, grupo!')
  },

  async boatarde(ctx) {
    await ctx.send('Boa tarde!')
  },

  async boanoite(ctx) {
    await ctx.send('Boa noite, durmam bem.')
  },

  async obg(ctx) {
    await ctx.send('De nada!')
  },

  async desculpa(ctx) {
    await ctx.send('Tudo certo.')
  },

  async tchau(ctx) {
    await ctx.send('Ate logo.')
  },

  async oi(ctx) {
    await ctx.send('Oi! Use ' + ctx.prefix + 'menu')
  },

  async hello(ctx) {
    await ctx.send('Hello! ' + ctx.prefix + 'menu')
  }
}
