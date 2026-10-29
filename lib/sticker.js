const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const { promisify } = require('util')
const execp = promisify(exec)
const config = require('../config')

function tmp(ext) {
  const dir = path.resolve(config.tempFolder)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return path.join(dir, Date.now() + '-' + Math.random().toString(16).slice(2) + ext)
}

function clean(f) {
  try { if (f && fs.existsSync(f)) fs.unlinkSync(f) } catch {}
}

async function imgToWebpJimp(buf) {
  const Jimp = require('jimp')
  const img = await Jimp.read(buf)
  img.contain(512, 512)
  const png = await img.getBufferAsync(Jimp.MIME_PNG)
  const inp = tmp('.png')
  const out = tmp('.webp')
  fs.writeFileSync(inp, png)
  try {
    await execp(`ffmpeg -y -i "${inp}" -vcodec libwebp -lossless 0 -q:v 60 -preset default -loop 0 -an "${out}"`)
    const webp = fs.readFileSync(out)
    clean(inp); clean(out)
    return webp
  } catch {
    clean(inp); clean(out)
    return png
  }
}

async function imgToWebp(buf) {
  const inp = tmp('.jpg')
  const out = tmp('.webp')
  fs.writeFileSync(inp, buf)
  try {
    await execp(`ffmpeg -y -i "${inp}" -vf "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000" -vcodec libwebp -lossless 0 -compression_level 6 -q:v 60 -preset default -loop 0 -an -vsync 0 "${out}"`)
    const webp = fs.readFileSync(out)
    clean(inp); clean(out)
    return webp
  } catch (e) {
    clean(inp); clean(out)
    return imgToWebpJimp(buf)
  }
}

async function vidToWebp(buf) {
  const inp = tmp('.mp4')
  const out = tmp('.webp')
  fs.writeFileSync(inp, buf)
  try {
    await execp(`ffmpeg -y -i "${inp}" -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000" -t 6 -vcodec libwebp -lossless 0 -q:v 50 -loop 0 -an -vsync 0 "${out}"`)
    const webp = fs.readFileSync(out)
    clean(inp); clean(out)
    return webp
  } catch (e) {
    clean(inp); clean(out)
    throw new Error('FFmpeg necessario para figurinha de video. Instale ffmpeg e tente de novo.')
  }
}

async function webpToPng(buf) {
  const inp = tmp('.webp')
  const out = tmp('.png')
  fs.writeFileSync(inp, buf)
  try {
    await execp(`ffmpeg -y -i "${inp}" "${out}"`)
    const png = fs.readFileSync(out)
    clean(inp); clean(out)
    return png
  } catch (e) {
    clean(inp); clean(out)
    try {
      const Jimp = require('jimp')
      const img = await Jimp.read(buf)
      return img.getBufferAsync(Jimp.MIME_PNG)
    } catch {
      throw e
    }
  }
}

async function webpToMp4(buf) {
  const inp = tmp('.webp')
  const out = tmp('.mp4')
  fs.writeFileSync(inp, buf)
  try {
    await execp(`ffmpeg -y -i "${inp}" -movflags faststart -pix_fmt yuv420p "${out}"`)
    const mp4 = fs.readFileSync(out)
    clean(inp); clean(out)
    return mp4
  } catch (e) {
    clean(inp); clean(out)
    throw new Error('FFmpeg necessario para converter figurinha em video.')
  }
}

module.exports = { imgToWebp, vidToWebp, webpToPng, webpToMp4, tmp, clean }
