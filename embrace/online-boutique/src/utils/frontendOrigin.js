/**
 * Resolve the Online Boutique frontend base URL (same host that serves `/api/v1` and `/static`).
 *
 * By default the app uses the **current page origin** so `/api` and `/static` hit Vite’s dev/preview
 * proxy and avoid browser CORS. Set `VITE_RELATIVE_API=false` and `VITE_FRONTEND_ORIGIN` only when
 * deploying a static build that must call the boutique host directly (CORS must allow your origin).
 */
function useSameOriginApi() {
  const v = import.meta.env.VITE_RELATIVE_API
  return v !== 'false'
}

export function getFrontendOrigin() {
  if (typeof window === 'undefined') {
    return ''
  }
  if (useSameOriginApi()) {
    return window.location.origin
  }
  const env = import.meta.env.VITE_FRONTEND_ORIGIN
  if (env && String(env).trim().length > 0) {
    return String(env).replace(/\/$/, '')
  }
  return window.location.origin
}

/** Same-origin asset and API paths become absolute against the frontend origin. */
export function resolveFrontendPath(path) {
  if (path.startsWith('http')) {
    return path
  }
  const origin = getFrontendOrigin()
  const p = path.startsWith('/') ? path : `/${path}`
  return origin ? `${origin}${p}` : p
}

/** Router basename when the app is hosted under a subpath (default ""). */
export function getRouterBasename() {
  const env = import.meta.env.VITE_ROUTER_BASENAME
  if (env !== undefined && env !== null) {
    return String(env)
  }
  return ''
}
