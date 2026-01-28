const express = require('express')
const fs = require('fs')
const path = require('path')
const app = express()
const assetsPath = 'assets'
const history = new Map()

app.get('/', (_, res) => res.sendStatus(200))
app.get('/:user', (req, res) => {
  const user = req.params.user.replace(/[^a-z0-9_-]/gi, '')
  const dir = path.join(__dirname, assetsPath, user)

  fs.readdir(dir, (err, files) => {
    if (err) return res.sendStatus(404)
    const images = files.filter(f => f.endsWith('.gif') || f.endsWith('.png'))
    if (!images.length) return res.sendStatus(404)

    const last = history.get(user)
    const pool = images.length > 1 ? images.filter(f => f !== last) : images
    const img = pool[Math.floor(Math.random() * pool.length)]

    history.set(user, img)
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Expires': '0'
    })  

     res.sendFile(path.join(dir, img))
  })
})

app.listen(3000)
