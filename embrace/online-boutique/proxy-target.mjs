import { createProxyMiddleware } from 'http-proxy-middleware'

/**
 * Boutique HTTP upstream for `/api` and `/static` relay (Express + Vite proxy config).
 * Prefer `VITE_FRONTEND_ORIGIN` when set so one variable can describe the remote boutique.
 *
 * @param {NodeJS.ProcessEnv} env
 */
export function getBoutiqueUpstream(env) {
  const raw =
    env.VITE_FRONTEND_ORIGIN ||
    env.VITE_PROXY_TARGET ||
    env.VITE_DEV_PROXY_TARGET ||
    'http://127.0.0.1:8080'
  return String(raw).replace(/\/$/, '')
}

/**
 * Single proxy mounted at app root. Do not use `app.use('/api', …)` — Express strips that
 * prefix from `req.url`, so the upstream would receive `/v1/...` instead of `/api/v1/...` (404).
 *
 * @param {string} target
 */
export function createBoutiqueProxyMiddleware(target) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathFilter: ['/api', '/static'],
  })
}
