const axios = require('axios')

module.exports = {
  async sticker(ctx) {
    const src = ctx.q || ctx.um
    const t = ctx.media.typeOf(src)
    if (!['image', 'video'].includes(t)) return ctx.send('Envie ou responda uma imagem/video.\n' + ctx.prefix + 'sticker')
    try {
      await ctx.react('⏳')
      const buf = await ctx.media.download(ctx.sock, src)
      const sticker = require('../lib/sticker')
      const webp = t === 'video' ? await sticker.vidToWebp(buf) : await sticker.imgToWebp(buf)
      await ctx.sock.sendMessage(ctx.jid, { sticker: webp }, { quoted: ctx.m })
      await ctx.react('✅')
    } catch (e) {
      await ctx.send('Falha ao criar figurinha. Instale ffmpeg. ' + (e.message || ''))
    }
  },

  async toimg(ctx) {
    const src = ctx.q
    if (!src || ctx.media.typeOf(src) !== 'sticker') return ctx.send('Responda uma figurinha.')
    try {
      const sticker = require('../lib/sticker')
      const buf = await ctx.media.download(ctx.sock, src)
      const png = await sticker.webpToPng(buf)
      await ctx.sock.sendMessage(ctx.jid, { image: png, caption: 'Convertido' }, { quoted: ctx.m })
    } catch (e) {
      await ctx.send('Falha ao converter.')
    }
  },

  async togif(ctx) {
    const src = ctx.q
    if (!src || ctx.media.typeOf(src) !== 'sticker') return ctx.send('Responda uma figurinha animada.')
    try {
      const sticker = require('../lib/sticker')
      const buf = await ctx.media.download(ctx.sock, src)
      const mp4 = await sticker.webpToMp4(buf)
      await ctx.sock.sendMessage(ctx.jid, { video: mp4, gifPlayback: true, caption: 'GIF' }, { quoted: ctx.m })
    } catch {
      await ctx.send('Falha ao converter GIF.')
    }
  },

  async steal(ctx) {
    return module.exports.sticker(ctx)
  },

  async attp(ctx) {
    if (!ctx.arg) return ctx.send('Digite o texto.\n' + ctx.prefix + 'attp Nexus')
    try {
      const url = 'https://api.xteam.xyz/attp?file&text=' + encodeURIComponent(ctx.arg.slice(0, 40))
      const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 }).catch(() => ({ data: null }))
      if (!data) {
        const sticker = require('../lib/sticker')
        const Jimp = require('jimp')
        const img = new Jimp(512, 512, 0x00000000)
        const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE)
        img.print(font, 20, 200, { text: ctx.arg.slice(0, 40), alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, 472, 120)
        const buf = await img.getBufferAsync(Jimp.MIME_PNG)
        const webp = await sticker.imgToWebp(buf)
        await ctx.sock.sendMessage(ctx.jid, { sticker: webp }, { quoted: ctx.m })
        return
      }
      await ctx.sock.sendMessage(ctx.jid, { sticker: Buffer.from(data) }, { quoted: ctx.m })
    } catch (e) {
      await ctx.send('Falha no ATTP.')
    }
  },

  async ttp(ctx) {
    if (!ctx.arg) return ctx.send('Digite o texto.')
    try {
      const sticker = require('../lib/sticker')
      const Jimp = require('jimp')
      const img = new Jimp(512, 512, 0xffffffff)
      const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK)
      img.print(font, 20, 200, { text: ctx.arg.slice(0, 60), alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, 472, 160)
      const buf = await img.getBufferAsync(Jimp.MIME_PNG)
      const webp = await sticker.imgToWebp(buf)
      await ctx.sock.sendMessage(ctx.jid, { sticker: webp }, { quoted: ctx.m })
    } catch {
      await ctx.send('Falha no TTP.')
    }
  },

  async emojimix(ctx) {
    const [a, b] = (ctx.arg || '').split('+').map((s) => s.trim())
    if (!a || !b) return ctx.send('Use:\n' + ctx.prefix + 'emojimix 😎+🔥')
    try {
      const code = (e) => [...e].map((c) => c.codePointAt(0).toString(16)).join('-')
      const url = `https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQct3Mc_1Pkw&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${encodeURIComponent(a)}_${encodeURIComponent(b)}`
      const { data } = await axios.get(url, { timeout: 12000 })
      const pngUrl = data?.results?.[0]?.url
      if (!pngUrl) return ctx.send('Combinacao nao encontrada.')
      const img = await axios.get(pngUrl, { responseType: 'arraybuffer' })
      const sticker = require('../lib/sticker')
      const webp = await sticker.imgToWebp(Buffer.from(img.data))
      await ctx.sock.sendMessage(ctx.jid, { sticker: webp }, { quoted: ctx.m })
    } catch {
      await ctx.send('Falha no mix de emoji. Tente outros.')
    }
  },

  async qc(ctx) {
    const text = ctx.arg || (ctx.q && ctx.media.textOf(ctx.q)) || ''
    if (!text) return ctx.send('Digite ou responda um texto.')
    await ctx.send('"' + text.slice(0, 200) + '"\n- ' + ctx.u.mention(ctx.sender))
  },

  async wallpaper(ctx) {
    const q = encodeURIComponent(ctx.arg || 'nature')
    try {
      const { data } = await axios.get('https://picsum.photos/800/600', { responseType: 'arraybuffer', timeout: 12000, maxRedirects: 5 })
      await ctx.sock.sendMessage(ctx.jid, { image: Buffer.from(data), caption: 'Wallpaper: ' + (ctx.arg || 'random') }, { quoted: ctx.m })
    } catch {
      await ctx.send('Falha ao buscar wallpaper.')
    }
  },

  async pinterest(ctx) {
    if (!ctx.arg) return ctx.send('Digite a busca.')
    try {
      const { data } = await axios.get('https://picsum.photos/seed/' + encodeURIComponent(ctx.arg.slice(0, 20)) + '/700/700', { responseType: 'arraybuffer', timeout: 12000 })
      await ctx.sock.sendMessage(ctx.jid, { image: Buffer.from(data), caption: 'Resultado: ' + ctx.arg }, { quoted: ctx.m })
    } catch {
      await ctx.send('Falha na busca.')
    }
  },

  async play(ctx) {
    if (!ctx.arg) return ctx.send('Digite o nome da musica.\n' + ctx.prefix + 'play nome')
    await ctx.send('Busca de audio: *' + ctx.arg + '*\nUse um downloader externo. Recurso de YouTube desativado por padrao para evitar bloqueio.')
  },

  async yt(ctx) {
    return module.exports.play(ctx)
  },

  async ia(ctx) {
    if (!ctx.arg) return ctx.send('Pergunte algo.\n' + ctx.prefix + 'ia o que e javascript')
    const t = ctx.arg.toLowerCase()
    let r = 'Nao tenho API de IA configurada. Resposta local: pensei sobre "' + ctx.arg + '".'
    if (t.includes('hora')) r = 'Agora: ' + new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    if (t.includes('seu nome')) r = 'Eu sou o ' + (ctx.db.get().settings.botName || 'NEXUS BOT')
    await ctx.send(r)
  },

  async traduzir(ctx) {
    if (!ctx.arg) return ctx.send('Use:\n' + ctx.prefix + 'traduzir en texto')
    const lang = ctx.args[0]
    const text = ctx.args.slice(1).join(' ') || (ctx.q && ctx.media.textOf(ctx.q)) || ''
    if (!text) return ctx.send('Informe o texto.')
    try {
      const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=' + encodeURIComponent(lang) + '&dt=t&q=' + encodeURIComponent(text)
      const { data } = await axios.get(url, { timeout: 10000 })
      const out = (data[0] || []).map((x) => x[0]).join('')
      await ctx.send('*Traducao (' + lang + ')*\n' + out)
    } catch {
      await ctx.send('Falha ao traduzir.')
    }
  },

  async clima(ctx) {
    const city = ctx.arg || 'Sao Paulo'
    try {
      const { data } = await axios.get('https://wttr.in/' + encodeURIComponent(city) + '?format=3', { timeout: 10000 })
      await ctx.send('Clima: ' + String(data).trim())
    } catch {
      await ctx.send('Falha ao consultar clima.')
    }
  },

  async cep(ctx) {
    const cep = (ctx.args[0] || '').replace(/\D/g, '')
    if (cep.length !== 8) return ctx.send('CEP invalido.\n' + ctx.prefix + 'cep 01001000')
    try {
      const { data } = await axios.get('https://viacep.com.br/ws/' + cep + '/json/', { timeout: 8000 })
      if (data.erro) return ctx.send('CEP nao encontrado.')
      await ctx.send(ctx.u.box('CEP', [
        data.logradouro || '-',
        data.bairro || '-',
        (data.localidade || '') + ' / ' + (data.uf || ''),
        data.cep
      ]))
    } catch {
      await ctx.send('Falha no CEP.')
    }
  },

  async ddd(ctx) {
    const d = (ctx.args[0] || '').replace(/\D/g, '')
    const map = { 11: 'Sao Paulo SP', 21: 'Rio de Janeiro RJ', 31: 'Belo Horizonte MG', 41: 'Curitiba PR', 47: 'Joinville SC', 48: 'Florianopolis SC', 51: 'Porto Alegre RS', 61: 'Brasilia DF', 71: 'Salvador BA', 81: 'Recife PE', 85: 'Fortaleza CE', 91: 'Belem PA', 92: 'Manaus AM', 95: 'Boa Vista RR', 96: 'Macapa AP', 98: 'Sao Luis MA', 69: 'Rondonia RO', 63: 'Palmas TO', 27: 'Vitoria ES', 19: 'Campinas SP', 62: 'Goiania GO', 82: 'Maceio AL', 83: 'Joao Pessoa PB', 84: 'Natal RN', 86: 'Teresina PI', 79: 'Aracaju SE', 67: 'Campo Grande MS', 65: 'Cuiaba MT', 68: 'Rio Branco AC', 94: 'Maraba PA', 12: 'Sao Jose dos Campos SP', 13: 'Santos SP', 16: 'Ribeirao Preto SP', 17: 'Sao Jose do Rio Preto SP', 18: 'Presidente Prudente SP', 22: 'Campos RJ', 24: 'Petropolis RJ', 32: 'Juiz de Fora MG', 34: 'Uberlandia MG', 35: 'Pocos de Caldas MG', 37: 'Divinopolis MG', 38: 'Montes Claros MG', 43: 'Londrina PR', 44: 'Maringa PR', 45: 'Foz do Iguacu PR', 46: 'Francisco Beltrao PR', 49: 'Chapeco SC', 53: 'Pelotas RS', 54: 'Caxias do Sul RS', 55: 'Santa Maria RS' }
    await ctx.send(map[d] ? 'DDD ' + d + ': ' + map[d] : 'DDD nao mapeado.')
  },

  async cotacao(ctx) {
    try {
      const { data } = await axios.get('https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL', { timeout: 8000 })
      await ctx.send(ctx.u.box('COTACAO', [
        'USD: R$ ' + Number(data.USDBRL.bid).toFixed(2),
        'EUR: R$ ' + Number(data.EURBRL.bid).toFixed(2),
        'BTC: R$ ' + Number(data.BTCBRL.bid).toFixed(2)
      ]))
    } catch {
      await ctx.send('Falha na cotacao.')
    }
  },

  async noticia(ctx) {
    await ctx.send('Manchetes: acompanhe um portal de noticias. Recurso RSS opcional nao configurado.')
  },

  async qr(ctx) {
    if (!ctx.arg) return ctx.send('Informe o texto.')
    try {
      const QR = require('qrcode')
      const buf = await QR.toBuffer(ctx.arg, { width: 512, margin: 2 })
      await ctx.sock.sendMessage(ctx.jid, { image: buf, caption: 'QR gerado' }, { quoted: ctx.m })
    } catch {
      await ctx.send('Falha ao gerar QR.')
    }
  },

  async encurtar(ctx) {
    if (!ctx.arg) return ctx.send('Informe a URL.')
    try {
      const { data } = await axios.get('https://tinyurl.com/api-create.php?url=' + encodeURIComponent(ctx.arg), { timeout: 8000 })
      await ctx.send('Link curto: ' + data)
    } catch {
      await ctx.send('Falha ao encurtar.')
    }
  },

  async ssweb(ctx) {
    if (!ctx.arg) return ctx.send('Informe a URL.')
    await ctx.send('Screenshot web desativado por padrao (servico externo).')
  },

  async letra(ctx) {
    if (!ctx.arg) return ctx.send('Informe a musica.')
    await ctx.send('Letra de *' + ctx.arg + '* nao integrada. Pesquise no Genius/Letras.')
  },

  async dicionario(ctx) {
    if (!ctx.arg) return ctx.send('Informe a palavra.')
    try {
      const { data } = await axios.get('https://api.dicionario-aberto.net/word/' + encodeURIComponent(ctx.args[0]), { timeout: 8000 })
      const def = data?.[0]?.xml || JSON.stringify(data).slice(0, 400)
      await ctx.send('Definicao:\n' + String(def).replace(/<[^>]+>/g, ' ').slice(0, 800))
    } catch {
      await ctx.send('Palavra nao encontrada.')
    }
  },

  async github(ctx) {
    const user = ctx.args[0]
    if (!user) return ctx.send('Informe o usuario.\n' + ctx.prefix + 'github torvalds')
    try {
      const { data } = await axios.get('https://api.github.com/users/' + encodeURIComponent(user), { timeout: 8000, headers: { 'User-Agent': 'nexus-bot' } })
      await ctx.send(ctx.u.box('GITHUB', [
        data.login + ' — ' + (data.name || ''),
        'Bio: ' + (data.bio || '-'),
        'Repos: ' + data.public_repos,
        'Followers: ' + data.followers,
        data.html_url
      ]))
    } catch {
      await ctx.send('Usuario nao encontrado.')
    }
  },

  async npm(ctx) {
    const p = ctx.args[0]
    if (!p) return ctx.send('Informe o pacote.')
    try {
      const { data } = await axios.get('https://registry.npmjs.org/' + encodeURIComponent(p), { timeout: 8000 })
      await ctx.send(ctx.u.box('NPM', [
        data.name,
        'Desc: ' + String(data.description || '-').slice(0, 80),
        'Latest: ' + (data['dist-tags']?.latest || '-')
      ]))
    } catch {
      await ctx.send('Pacote nao encontrado.')
    }
  },

  async ip(ctx) {
    const host = ctx.args[0]
    if (!host) return ctx.send('Informe o host.')
    await ctx.send('Consulta de IP limitada. Host informado: ' + host)
  },

  async bin(ctx) {
    const b = (ctx.args[0] || '').replace(/\D/g, '').slice(0, 8)
    if (b.length < 6) return ctx.send('Informe o BIN (6 dígitos).')
    await ctx.send('BIN ' + b + ' — consulta externa nao habilitada.')
  },

  async gerarsenha(ctx) {
    const n = Math.min(32, parseInt(ctx.args[0] || '12', 10) || 12)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%'
    let s = ''
    for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)]
    await ctx.send('Senha: `' + s + '`')
  },

  async print(ctx) {
    return module.exports.ssweb(ctx)
  },

  async figurinha(ctx) {
    return module.exports.sticker(ctx)
  }
}
