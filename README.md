# NEXUS BOT

Bot de WhatsApp para grupos com mais de 180 comandos, niveis de cargo e moderacao.

**Numero do bot:** 55993511752  
**Donos:** 55993511752 e 5569993841805

## Requisitos

- Node.js 18 ou superior
- FFmpeg (figurinha, toimg, togif)
- WhatsApp no celular do numero do bot

## Instalacao

```bash
git clone <url-do-repositorio>
cd nexus-whatsapp-bot
npm install
```

Instale o FFmpeg:

```bash
# Debian / Ubuntu
sudo apt-get update
sudo apt-get install -y ffmpeg

# Termux
pkg install ffmpeg
```

## Ligar o bot (codigo de pareamento)

O bot conecta no numero `55993511752` por codigo, nao por QR.

```bash
npm start
```

1. O terminal mostra um codigo de 8 digitos (ex: `ABCD-1234`)
2. No celular do numero `55993511752` abra o WhatsApp
3. Aparelhos conectados
4. Conectar um aparelho
5. Conectar com numero de telefone
6. Digite o codigo

QR so se voce pedir:

```bash
npm run qr
```

A sessao fica salva em `session/`. Nao apague essa pasta depois de conectar.

## Autorizar um grupo

O bot precisa estar no grupo. O dono envia no grupo:

```text
/addgrupo permanente
```

Ou por dias:

```text
/addgrupo 7
/addgrupo 30
```

Sem isso, o grupo nao usa os comandos.

## Cargos

| Cargo | Quem e | Exemplos |
| --- | --- | --- |
| Dono | 55993511752 e 5569993841805 (+ quem o dono adicionar) | addgrupo, adddono, addvip, banuser |
| Admin | admin do grupo ou admin do bot | ban, apagar, antilink, warn, hidetag |
| VIP | adicionado com /addvip | wallpaper, pinterest, togif |
| Membro | qualquer um no grupo autorizado | menu, sticker, brincadeiras, economia |

## Comandos principais (um por linha)

Prefixo padrao: `/`

### Dono

```text
/addgrupo permanente
/addgrupo 30
/delgrupo
/listgrupos
/adddias 15
/adddono @user
/deldono @user
/listdonos
/addadmbot @user
/deladmbot @user
/addvip @user
/delvip @user
/listvip
/transmitir texto
/sair
/entrar link
/bloquear @user
/desbloquear @user
/banuser @user
/unbanuser @user
/setprefix !
/setnome NEXUS
/manutencao
/antipv
/backup
/stats
/reiniciar
```

### Admin do grupo

```text
/ban @user
/apagar
/promover @user
/rebaixar @user
/add 5599999999999
/marcar
/hidetag aviso
/fechar
/abrir
/warn @user
/mute @user 10
/antilink
/antifake
/antiflood
/welcome
/setwelcome Bem-vindo @user ao {grupo}
/linkgrupo
/revogar
/infogrupo
/enquete Pergunta | opc1 | opc2
```

`/apagar` apaga a mensagem respondida. O bot precisa ser admin.

`/ban` remove o membro. O bot precisa ser admin.

### Figurinha

```text
/sticker
/s
/figu
/toimg
/togif
/attp texto
/ttp texto
/emojimix 😎+🔥
```

Envie ou responda uma foto/video e use `/sticker`.

### Brincadeiras

```text
/gay
/ship @a @b
/casar @user
/jokenpo pedra
/dado
/piada
/cantada
/bola8 pergunta
/ranklindo
/casal
```

### Economia

```text
/diario
/trabalhar
/minerar
/pescar
/carteira
/pix @user 50
/loja
/comprar pico
```

Lista completa no WhatsApp:

```text
/menu
```

## Estrutura

```text
index.js
config.js
lib/
commands/
database/
session/
```

Donos principais ficam em `config.js`. Novos donos entram com `/adddono` e sao salvos em `database/data.json`.

## Avisos

- Nao compartilhe a pasta `session/`
- Nao compartilhe `database/data.json`
- WhatsApp pode desconectar sessoes em excesso. Use um chip dedicado se possivel
