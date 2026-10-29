const axios = require('axios')

function tgt(ctx) {
  return ctx.target() || ctx.sender
}

module.exports = {
  async gay(ctx) {
    const t = tgt(ctx)
    const n = ctx.u.rand(0, 100)
    await ctx.sock.sendMessage(ctx.jid, { text: '@' + ctx.u.onlyNum(t) + ' e ' + n + '% gay', mentions: [t] }, { quoted: ctx.m })
  },

  async lesbica(ctx) {
    const t = tgt(ctx)
    await ctx.sock.sendMessage(ctx.jid, { text: '@' + ctx.u.onlyNum(t) + ' e ' + ctx.u.rand(0, 100) + '% lesbica', mentions: [t] }, { quoted: ctx.m })
  },

  async hetero(ctx) {
    const t = tgt(ctx)
    await ctx.sock.sendMessage(ctx.jid, { text: '@' + ctx.u.onlyNum(t) + ' e ' + ctx.u.rand(0, 100) + '% hetero', mentions: [t] }, { quoted: ctx.m })
  },

  async corno(ctx) {
    const t = tgt(ctx)
    await ctx.sock.sendMessage(ctx.jid, { text: '@' + ctx.u.onlyNum(t) + ' e ' + ctx.u.rand(0, 100) + '% corno', mentions: [t] }, { quoted: ctx.m })
  },

  async gostoso(ctx) {
    const t = tgt(ctx)
    await ctx.sock.sendMessage(ctx.jid, { text: '@' + ctx.u.onlyNum(t) + ' e ' + ctx.u.rand(0, 100) + '% gostoso(a)', mentions: [t] }, { quoted: ctx.m })
  },

  async feio(ctx) {
    const t = tgt(ctx)
    await ctx.sock.sendMessage(ctx.jid, { text: '@' + ctx.u.onlyNum(t) + ' e ' + ctx.u.rand(0, 100) + '% feio(a)', mentions: [t] }, { quoted: ctx.m })
  },

  async lindo(ctx) {
    const t = tgt(ctx)
    await ctx.sock.sendMessage(ctx.jid, { text: '@' + ctx.u.onlyNum(t) + ' e ' + ctx.u.rand(0, 100) + '% lindo(a)', mentions: [t] }, { quoted: ctx.m })
  },

  async inteligente(ctx) {
    const t = tgt(ctx)
    await ctx.sock.sendMessage(ctx.jid, { text: '@' + ctx.u.onlyNum(t) + ' tem QI ' + ctx.u.rand(70, 180), mentions: [t] }, { quoted: ctx.m })
  },

  async burro(ctx) {
    const t = tgt(ctx)
    await ctx.sock.sendMessage(ctx.jid, { text: '@' + ctx.u.onlyNum(t) + ' e ' + ctx.u.rand(0, 100) + '% burro(a) (brincadeira)', mentions: [t] }, { quoted: ctx.m })
  },

  async ship(ctx) {
    const ments = ctx.media.mentioned(ctx.um)
    let a = ments[0] || ctx.sender
    let b = ments[1]
    if (!b) b = ctx.q?.participant || ctx.q?.sender
    if (!b) return ctx.send('Marque duas pessoas ou responda alguem.\n' + ctx.prefix + 'ship @a @b')
    const n = ctx.u.rand(0, 100)
    const bar = '█'.repeat(Math.round(n / 10)) + '░'.repeat(10 - Math.round(n / 10))
    await ctx.sock.sendMessage(ctx.jid, {
      text: 'SHIP\n@' + ctx.u.onlyNum(a) + ' + @' + ctx.u.onlyNum(b) + '\n[' + bar + '] ' + n + '%',
      mentions: [a, b]
    }, { quoted: ctx.m })
  },

  async casar(ctx) {
    const t = ctx.target()
    if (!t) return ctx.send('Marque com quem casar.')
    if (ctx.u.onlyNum(t) === ctx.num) return ctx.send('Nao pode casar consigo.')
    const d = ctx.db.get()
    if (d.marriages[ctx.num]) return ctx.send('Voce ja e casado. Use /divorciar')
    d.marriages[ctx.num] = ctx.u.onlyNum(t)
    d.marriages[ctx.u.onlyNum(t)] = ctx.num
    ctx.db.save()
    await ctx.sock.sendMessage(ctx.jid, { text: 'Casamento: @' + ctx.num + ' e @' + ctx.u.onlyNum(t), mentions: [ctx.sender, t] })
  },

  async divorciar(ctx) {
    const d = ctx.db.get()
    const other = d.marriages[ctx.num]
    if (!other) return ctx.send('Voce nao e casado.')
    delete d.marriages[ctx.num]
    delete d.marriages[other]
    ctx.db.save()
    await ctx.send('Divorcio concluido.')
  },

  async beijo(ctx) {
    const t = ctx.target()
    if (!t) return ctx.send('Marque alguem.')
    await ctx.sock.sendMessage(ctx.jid, { text: '@' + ctx.num + ' beijou @' + ctx.u.onlyNum(t), mentions: [ctx.sender, t] })
  },

  async abraco(ctx) {
    const t = ctx.target()
    if (!t) return ctx.send('Marque alguem.')
    await ctx.sock.sendMessage(ctx.jid, { text: '@' + ctx.num + ' abraçou @' + ctx.u.onlyNum(t), mentions: [ctx.sender, t] })
  },

  async tapa(ctx) {
    const t = ctx.target()
    if (!t) return ctx.send('Marque alguem.')
    await ctx.sock.sendMessage(ctx.jid, { text: '@' + ctx.num + ' deu um tapa em @' + ctx.u.onlyNum(t), mentions: [ctx.sender, t] })
  },

  async matar(ctx) {
    const t = ctx.target()
    if (!t) return ctx.send('Marque alguem.')
    await ctx.sock.sendMessage(ctx.jid, { text: '@' + ctx.num + ' eliminou @' + ctx.u.onlyNum(t) + ' (fake)', mentions: [ctx.sender, t] })
  },

  async chutar(ctx) {
    const t = ctx.target()
    if (!t) return ctx.send('Marque alguem.')
    await ctx.sock.sendMessage(ctx.jid, { text: '@' + ctx.num + ' chutou @' + ctx.u.onlyNum(t), mentions: [ctx.sender, t] })
  },

  async jokenpo(ctx) {
    const escolha = (ctx.args[0] || '').toLowerCase()
    const ops = ['pedra', 'papel', 'tesoura']
    if (!ops.includes(escolha)) return ctx.send('Use: ' + ctx.prefix + 'jokenpo pedra|papel|tesoura')
    const bot = ctx.u.pick(ops)
    let r = 'empate'
    if (escolha === 'pedra' && bot === 'tesoura') r = 'voce ganhou'
    if (escolha === 'papel' && bot === 'pedra') r = 'voce ganhou'
    if (escolha === 'tesoura' && bot === 'papel') r = 'voce ganhou'
    if (escolha !== bot && r === 'empate') r = 'voce perdeu'
    const user = ctx.db.ensureUser(ctx.num)
    if (r === 'voce ganhou') { user.wins++; user.money += 10 }
    if (r === 'voce perdeu') user.losses++
    ctx.db.save()
    await ctx.send('Voce: ' + escolha + '\nBot: ' + bot + '\nResultado: ' + r)
  },

  async dado(ctx) {
    const faces = parseInt(ctx.args[0] || '6', 10) || 6
    await ctx.send('Dado d' + faces + ': ' + ctx.u.rand(1, Math.min(100, faces)))
  },

  async cara(ctx) {
    await ctx.send(ctx.u.pick(['Cara', 'Coroa']))
  },

  async slot(ctx) {
    const s = ['🍒', '🍋', '🍇', '⭐', '💎', '7️⃣']
    const a = ctx.u.pick(s), b = ctx.u.pick(s), c = ctx.u.pick(s)
    const win = a === b && b === c
    if (win) {
      const user = ctx.db.ensureUser(ctx.num)
      user.money += 80
      ctx.db.save()
    }
    await ctx.send(a + ' | ' + b + ' | ' + c + '\n' + (win ? 'JACKPOT +80' : 'Tente de novo'))
  },

  async roleta(ctx) {
    const n = ctx.u.rand(0, 36)
    const cor = n === 0 ? 'verde' : n % 2 === 0 ? 'preto' : 'vermelho'
    await ctx.send('Roleta: ' + n + ' (' + cor + ')')
  },

  async piada(ctx) {
    const list = [
      'Por que o livro de matematica ficou triste? Porque tinha muitos problemas.',
      'O que o pato disse para a pata? Vem qua!',
      'Qual o contrario de palindromo? Oromidnilap.',
      'Por que o computador foi ao medico? Porque estava com virus.',
      'O que e um pontinho amarelo no ceu? Um yellowcoptero.',
      'Por que o jacare tirou o filho da escola? Porque ele réptil de ano.',
      'Qual e a peca de carro que e feita de doce? O pirulito.',
      'O que a impressora falou para a outra? Essa folha e sua ou e impressao minha?'
    ]
    await ctx.send(ctx.u.pick(list))
  },

  async cantada(ctx) {
    const list = [
      'Seu nome e Wi-Fi? Porque sinto uma conexao.',
      'Voce e um recibo? Porque nao tenho como te pagar.',
      'Se eu fosse um gato, passaria as 7 vidas com voce.',
      'Nao sou fotografico, mas posso te revelar um sorriso.',
      'Voce e GPS? Porque me perdi no seu olhar.'
    ]
    const t = ctx.target()
    const txt = ctx.u.pick(list)
    if (t) await ctx.sock.sendMessage(ctx.jid, { text: '@' + ctx.u.onlyNum(t) + ', ' + txt, mentions: [t] })
    else await ctx.send(txt)
  },

  async fato(ctx) {
    const list = [
      'Mel e o unico alimento que nao estraga.',
      'Polvos tem 3 coracoes.',
      'Bananas sao bagas.',
      'O coracao de um camaraco fica na cabeca.',
      'Luz do sol leva 8 minutos para chegar na Terra.'
    ]
    await ctx.send(ctx.u.pick(list))
  },

  async conselho(ctx) {
    const list = [
      'Beba agua.',
      'Durma cedo hoje.',
      'Nao discuta com gente cansada.',
      'Salve o trabalho a cada 5 minutos.',
      'Seja gentil, custa pouco.'
    ]
    await ctx.send(ctx.u.pick(list))
  },

  async pergunta(ctx) {
    if (!ctx.arg) return ctx.send('Faca uma pergunta.')
    await ctx.send(ctx.u.pick(['Sim', 'Nao', 'Talvez', 'Com certeza', 'Nem pensar', 'Pergunte de novo', 'As estrelas dizem que sim']))
  },

  async bola8(ctx) {
    return module.exports.pergunta(ctx)
  },

  async chance(ctx) {
    if (!ctx.arg) return ctx.send('Chance de o que?')
    await ctx.send('Chance de "' + ctx.arg + '": ' + ctx.u.rand(0, 100) + '%')
  },

  async quando(ctx) {
    await ctx.send(ctx.u.pick(['Hoje', 'Amanha', 'Nunca', 'Ano que vem', 'Daqui 3 dias', 'Quando o sol nascer no oeste']))
  },

  async ppt(ctx) {
    return module.exports.jokenpo(ctx)
  },

  async verdade(ctx) {
    const list = [
      'Qual foi a ultima mentira que voce contou?',
      'Quem e sua paixao secreta?',
      'Qual seu maior medo?',
      'Ja fingiu estar doente?',
      'Qual musica voce canta no chuveiro?'
    ]
    await ctx.send('*Verdade:* ' + ctx.u.pick(list))
  },

  async desafio(ctx) {
    const list = [
      'Mande um audio cantando.',
      'Troque seu nick por 10 min.',
      'Elogie a pessoa acima.',
      'Conte uma piada ruim.',
      'Fale um fato aleatorio sobre voce.'
    ]
    await ctx.send('*Desafio:* ' + ctx.u.pick(list))
  },

  async casal(ctx) {
    if (!ctx.isGroup) return ctx.send('So em grupo.')
    const parts = ctx.meta.participants.map((p) => p.id)
    const a = ctx.u.pick(parts)
    let b = ctx.u.pick(parts)
    let i = 0
    while (b === a && i++ < 8) b = ctx.u.pick(parts)
    await ctx.sock.sendMessage(ctx.jid, { text: 'Casal do dia: @' + ctx.u.onlyNum(a) + ' e @' + ctx.u.onlyNum(b), mentions: [a, b] })
  },

  async rankgay(ctx) {
    if (!ctx.isGroup) return ctx.send('So em grupo.')
    const parts = [...ctx.meta.participants].sort(() => Math.random() - 0.5).slice(0, 5)
    const text = '*Rank gay (fake)*\n' + parts.map((p, i) => (i + 1) + '. @' + ctx.u.onlyNum(p.id)).join('\n')
    await ctx.sock.sendMessage(ctx.jid, { text, mentions: parts.map((p) => p.id) })
  },

  async ranklindo(ctx) {
    if (!ctx.isGroup) return ctx.send('So em grupo.')
    const parts = [...ctx.meta.participants].sort(() => Math.random() - 0.5).slice(0, 5)
    const text = '*Rank lindo*\n' + parts.map((p, i) => (i + 1) + '. @' + ctx.u.onlyNum(p.id)).join('\n')
    await ctx.sock.sendMessage(ctx.jid, { text, mentions: parts.map((p) => p.id) })
  },

  async rankfeio(ctx) {
    if (!ctx.isGroup) return ctx.send('So em grupo.')
    const parts = [...ctx.meta.participants].sort(() => Math.random() - 0.5).slice(0, 5)
    const text = '*Rank feio (brincadeira)*\n' + parts.map((p, i) => (i + 1) + '. @' + ctx.u.onlyNum(p.id)).join('\n')
    await ctx.sock.sendMessage(ctx.jid, { text, mentions: parts.map((p) => p.id) })
  },

  async rankamor(ctx) {
    if (!ctx.isGroup) return ctx.send('So em grupo.')
    const parts = [...ctx.meta.participants].sort(() => Math.random() - 0.5).slice(0, 5)
    const text = '*Rank amor*\n' + parts.map((p, i) => (i + 1) + '. @' + ctx.u.onlyNum(p.id)).join('\n')
    await ctx.sock.sendMessage(ctx.jid, { text, mentions: parts.map((p) => p.id) })
  },

  async eununca(ctx) {
    const list = [
      'Eu nunca menti para um amigo.',
      'Eu nunca finji que estava ocupado.',
      'Eu nunca comi algo que caiu no chao.',
      'Eu nunca stalkeei alguem.',
      'Eu nunca cantei no chuveiro.'
    ]
    await ctx.send(ctx.u.pick(list))
  },

  async fakemsg(ctx) {
    if (!ctx.arg) return ctx.send('Use: ' + ctx.prefix + 'fakemsg texto')
    await ctx.send('*[FAKE]* ' + ctx.arg)
  },

  async anagrama(ctx) {
    const palavras = ['bot', 'grupo', 'whatsapp', 'nexus', 'javascript', 'figurinha', 'comando']
    const w = ctx.u.pick(palavras)
    const mix = w.split('').sort(() => Math.random() - 0.5).join('')
    await ctx.send('Anagrama: *' + mix + '*\nResponda no chat a palavra original.')
  },

  async forca(ctx) {
    const w = ctx.u.pick(['banana', 'programacao', 'whatsapp', 'javascript', 'nexus'])
    await ctx.send('Forca: ' + w.replace(/[a-z]/g, '_ ') + '\nDica: ' + w.length + ' letras. Palavra: use o cerebro :)')
  },

  async adivinha(ctx) {
    const n = ctx.u.rand(1, 10)
    const g = parseInt(ctx.args[0], 10)
    if (!g) return ctx.send('Tente: ' + ctx.prefix + 'adivinha 7  (1 a 10)')
    await ctx.send(g === n ? 'Acertou! Era ' + n : 'Errou. Era ' + n)
  },

  async namorado(ctx) {
    const t = tgt(ctx)
    await ctx.sock.sendMessage(ctx.jid, { text: '@' + ctx.u.onlyNum(t) + ' seria ' + ctx.u.rand(0, 100) + '% bom namorado(a)', mentions: [t] })
  },

  async personalidade(ctx) {
    const t = tgt(ctx)
    const p = ctx.u.pick(['extrovertido', 'introvertido', 'criativo', 'logico', 'caotico', 'zen'])
    await ctx.sock.sendMessage(ctx.jid, { text: '@' + ctx.u.onlyNum(t) + ' parece ' + p, mentions: [t] })
  },

  async signo(ctx) {
    const s = ['aries', 'touro', 'gemeos', 'cancer', 'leao', 'virgem', 'libra', 'escorpiao', 'sagitario', 'capricornio', 'aquario', 'peixes']
    await ctx.send('Signo sorteado: ' + ctx.u.pick(s))
  },

  async horoscopo(ctx) {
    await ctx.send(ctx.u.pick([
      'Hoje e um bom dia para comecar.',
      'Cuidado com palavras duras.',
      'Uma surpresa positiva vem ai.',
      'Foque no que voce controla.'
    ]))
  },

  async meme(ctx) {
    try {
      const { data } = await axios.get('https://picsum.photos/500/500', { responseType: 'arraybuffer', timeout: 10000 })
      await ctx.sock.sendMessage(ctx.jid, { image: Buffer.from(data), caption: 'Meme aleatorio' }, { quoted: ctx.m })
    } catch {
      await ctx.send('Falha ao puxar meme.')
    }
  },

  async gato(ctx) {
    try {
      const { data } = await axios.get('https://cataas.com/cat', { responseType: 'arraybuffer', timeout: 10000 })
      await ctx.sock.sendMessage(ctx.jid, { image: Buffer.from(data), caption: 'miau' }, { quoted: ctx.m })
    } catch {
      await ctx.send('Falha ao buscar gato.')
    }
  },

  async cachorro(ctx) {
    try {
      const { data } = await axios.get('https://dog.ceo/api/breeds/image/random', { timeout: 8000 })
      const img = await axios.get(data.message, { responseType: 'arraybuffer', timeout: 10000 })
      await ctx.sock.sendMessage(ctx.jid, { image: Buffer.from(img.data), caption: 'au au' }, { quoted: ctx.m })
    } catch {
      await ctx.send('Falha ao buscar cachorro.')
    }
  },

  async flip(ctx) {
    return module.exports.cara(ctx)
  },

  async copiar(ctx) {
    if (!ctx.q) return ctx.send('Responda uma mensagem.')
    const t = ctx.media.textOf(ctx.q)
    await ctx.send(t || '(sem texto)')
  },

  async maiusculo(ctx) {
    if (!ctx.arg) return ctx.send('Digite o texto.')
    await ctx.send(ctx.arg.toUpperCase())
  },

  async minusculo(ctx) {
    if (!ctx.arg) return ctx.send('Digite o texto.')
    await ctx.send(ctx.arg.toLowerCase())
  },

  async reverso(ctx) {
    if (!ctx.arg) return ctx.send('Digite o texto.')
    await ctx.send(ctx.arg.split('').reverse().join(''))
  },

  async contar(ctx) {
    if (!ctx.arg) return ctx.send('Digite o texto.')
    await ctx.send('Caracteres: ' + ctx.arg.length + ' | Palavras: ' + ctx.arg.trim().split(/\s+/).length)
  },

  async emojify(ctx) {
    if (!ctx.arg) return ctx.send('Digite o texto.')
    await ctx.send(ctx.arg.split('').join(' ') + ' ' + ctx.u.pick(['🔥', '✨', '💜']))
  },

  async escolher(ctx) {
    const ops = ctx.arg.split('|').map((s) => s.trim()).filter(Boolean)
    if (ops.length < 2) return ctx.send('Use: ' + ctx.prefix + 'escolher a | b | c')
    await ctx.send('Eu escolho: *' + ctx.u.pick(ops) + '*')
  },

  async calcular(ctx) {
    if (!ctx.arg) return ctx.send('Ex: ' + ctx.prefix + 'calcular 2+2*3')
    const expr = ctx.arg.replace(/[^0-9+\-*/().% ]/g, '')
    if (!expr) return ctx.send('Expressao invalida.')
    try {
      const r = Function('"use strict"; return (' + expr + ')')()
      await ctx.send('Resultado: ' + r)
    } catch {
      await ctx.send('Nao consegui calcular.')
    }
  }
}
