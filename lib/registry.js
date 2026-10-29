const ownerCmds = require('../commands/owner')
const adminCmds = require('../commands/admin')
const vipCmds = require('../commands/vip')
const memberCmds = require('../commands/member')
const funCmds = require('../commands/fun')
const ecoCmds = require('../commands/economy')
const extraCmds = require('../commands/extra')

function merge(maps) {
  const out = {}
  for (const m of maps) Object.assign(out, m)
  return out
}

const ALL = merge([ownerCmds, adminCmds, vipCmds, memberCmds, funCmds, ecoCmds, extraCmds])

const OWNER_ONLY = new Set(Object.keys(ownerCmds))
const ADMIN_ONLY = new Set(Object.keys(adminCmds).filter((k) => k !== 'regras'))
const VIP_ONLY = new Set([
  'play', 'yt', 'wallpaper', 'pinterest', 'ssweb', 'print', 'noticia',
  'letra', 'ip', 'bin', 'steal', 'togif'
])

module.exports = { ALL, OWNER_ONLY, ADMIN_ONLY, VIP_ONLY }
