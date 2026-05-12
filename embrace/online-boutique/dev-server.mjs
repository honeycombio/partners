import 'dotenv/config'
import http from 'node:http'
import express from 'express'
import { createServer as createViteServer } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  getBoutiqueUpstream,
  createBoutiqueProxyMiddleware,
} from './proxy-target.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = __dirname
const port = Number(process.env.PORT || 5173)
const target = getBoutiqueUpstream(process.env)

async function main() {
  const app = express()

  app.use(createBoutiqueProxyMiddleware(target))

  const server = http.createServer(app)

  const vite = await createViteServer({
    root,
    configFile: path.join(root, 'vite.config.js'),
    server: {
      middlewareMode: true,
      hmr: { server },
    },
    appType: 'spa',
  })
  app.use(vite.middlewares)

  server.listen(port, () => {
    console.log(`http://localhost:${port}  (Express + Vite, proxy → ${target})`)
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
