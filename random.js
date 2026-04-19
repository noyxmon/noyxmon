// if you are reading this, why? 
import { fileURLToPath } from 'url'
import express from 'express'
import path from 'path'
import fs from 'fs'

const app = express()
const assets = path.join(path.dirname(fileURLToPath(import.meta.url)), 'assets')
const exts = new Set(['.gif', '.png', '.jpg', '.mp4', '.webp'])
const last = new Map()

function randomPick(key, files)
{
  const gave = last.get(key)
  const pool = files.length > 1 ? files.filter(f => f !== gave) : files
  const pick = pool[Math.floor(Math.random() * pool.length)]
  last.set(key, pick)
  return pick
}

function serve(res, filePath)
{
  fs.access(filePath, err => {
    if (err)
      return res.sendStatus(404)
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.set('Expires', '0')
    res.sendFile(filePath)
  })
}

app.get('/', (_req, res) => res.sendStatus(200))

app.get('/@:user', (req, res) => {
  const user = req.params.user.replace(/[^a-z0-9_-]/gi, '')
  const dir = path.join(assets, `@${user}`)

  fs.readdir(dir, (err, files) => {
    if (err)
      return res.sendStatus(404)

    const media = files.filter(f => exts.has(path.extname(f).toLowerCase()))
    if (!media.length)
      return res.sendStatus(404)

    const pick = randomPick(user, media)
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.sendFile(path.join(dir, pick))
  })
})

app.get('/:folder/:file', (req, res, next) => {
  const folder = path.basename(req.params.folder)
  const file = path.basename(req.params.file)
  const ext = path.extname(file).toLowerCase()

  if (folder.startsWith('@') || !exts.has(ext))
    return next()

  serve(res, path.join(assets, folder, file))
})

app.get('/:file', (req, res) => {
  const file = path.basename(req.params.file)
  const ext = path.extname(file).toLowerCase()

  if (!ext) {
    return fs.readdir(assets, (err, files) => {
      if (err)
        return res.sendStatus(404)

      const match = files.find(f =>
        path.basename(f, path.extname(f)) === file &&
        exts.has(path.extname(f).toLowerCase())
      )

      if (!match)
        return res.sendStatus(404)
      res.redirect(`/${match}`)
    })
  }

  if (!exts.has(ext))
    return res.sendStatus(404)
  serve(res, path.join(assets, file))
})

app.listen(3000)