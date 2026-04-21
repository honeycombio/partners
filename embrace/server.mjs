import 'dotenv/config'
import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  getBoutiqueUpstream,
  createBoutiqueProxyMiddleware,
} from './proxy-target.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dist = path.join(__dirname, 'dist')
const port = Number(process.env.PORT || 3000)
const target = getBoutiqueUpstream(process.env)

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('No dist/index.html — run `npm run build` first.')
  process.exit(1)
}

const app = express()

app.use(createBoutiqueProxyMiddleware(target))

app.use(express.static(dist, { index: false }))

app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    next()
    return
  }
  if (req.path.startsWith('/api') || req.path.startsWith('/static')) {
    next()
    return
  }
  res.sendFile(path.join(dist, 'index.html'), (err) => {
    if (err) next(err)
  })
})

app.listen(port, () => {
  console.log(`http://localhost:${port}  (dist + proxy → ${target})`)
})
