const fs = require('fs')
const path = require('path')
const config = require('../config')

const file = path.resolve(config.databaseFile)
const dir = path.dirname(file)

if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

const empty = {
  owners: [...config.owners],
  adminsBot: [],
  vips: [],
  bannedUsers: [],
  blocked: [],
  groups: {},
  users: {},
  warns: {},
  mutes: {},
  afk: {},
  suggestions: [],
  bugs: [],
  marriages: {},
  pets: {},
  settings: {
    prefix: config.prefix,
    botName: config.botName,
    packName: config.packName,
    packAuthor: config.packAuthor,
    maintenance: false,
    antiPv: false
  }
}

function load() {
  try {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify(empty, null, 2))
      return JSON.parse(JSON.stringify(empty))
    }
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
    return {
      ...JSON.parse(JSON.stringify(empty)),
      ...raw,
      owners: Array.from(new Set([...(empty.owners), ...(raw.owners || [])])),
      settings: { ...empty.settings, ...(raw.settings || {}) }
    }
  } catch {
    return JSON.parse(JSON.stringify(empty))
  }
}

let db = load()
let timer = null

function saveNow() {
  const tmp = file + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2))
  fs.renameSync(tmp, file)
}

function save() {
  if (timer) clearTimeout(timer)
  timer = setTimeout(saveNow, 250)
}

function get() {
  return db
}

function ensureUser(id) {
  const num = String(id).replace(/\D/g, '')
  if (!db.users[num]) {
    db.users[num] = {
      xp: 0,
      level: 1,
      money: 0,
      daily: 0,
      work: 0,
      mine: 0,
      fish: 0,
      hunt: 0,
      crime: 0,
      warns: 0,
      banned: false,
      bio: '',
      nick: '',
      inventory: {},
      class: 'aventureiro',
      wins: 0,
      losses: 0
    }
    save()
  }
  return db.users[num]
}

function ensureGroup(id) {
  if (!db.groups[id]) {
    db.groups[id] = {
      active: false,
      expire: 0,
      welcome: true,
      goodbye: true,
      welcomeText: 'Bem-vindo(a) @user ao grupo *{grupo}*!',
      goodbyeText: '@user saiu do grupo.',
      antilink: false,
      antifake: false,
      antiflood: false,
      antivoz: false,
      antifoto: false,
      antivideo: false,
      antisticker: false,
      antiviewonce: false,
      autosticker: false,
      onlyAdm: false,
      leveling: true,
      nsfw: false,
      regras: 'Sem regras definidas. Use /setregras',
      banned: false
    }
    save()
  }
  return db.groups[id]
}

function isGroupActive(id) {
  const g = ensureGroup(id)
  if (g.banned) return false
  if (!g.active) return false
  if (g.expire === 0) return true
  if (Date.now() > g.expire) {
    g.active = false
    save()
    return false
  }
  return true
}

module.exports = { get, save, saveNow, ensureUser, ensureGroup, isGroupActive, file }
