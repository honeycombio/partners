import { useMemo } from 'react'
import { useSession } from '../context/SessionContext'
import { resolveFrontendPath } from '../utils/frontendOrigin'

/** @returns {string|undefined} */
export function getApiKey() {
  const env = import.meta.env.VITE_FRONTEND_API_KEY
  return env && String(env).length > 0 ? String(env) : undefined
}

export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {number} status
   * @param {unknown} body
   */
  constructor(message, status, body) {
    super(message)
    this.status = status
    this.body = body
  }
}

/**
 * @param {Response} res
 */
async function parseJSON(res) {
  const text = await res.text()
  if (!text) {
    return null
  }
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/**
 * @param {string} path
 * @param {RequestInit & { sessionId: string, currency: string }} init
 */
export async function apiFetch(path, init) {
  const { sessionId, currency, headers, ...rest } = init
  const key = getApiKey()
  if (!key) {
    throw new ApiError(
      'API key missing: set VITE_FRONTEND_API_KEY (same value as FRONTEND_API_KEY on the boutique frontend)',
      503,
      null,
    )
  }
  const h = new Headers(headers)
  h.set('Authorization', `Bearer ${key}`)
  h.set('X-Session-Id', sessionId)
  h.set('X-Currency', currency)
  h.set('Accept', 'application/json')
  if (rest.body && !h.has('Content-Type')) {
    h.set('Content-Type', 'application/json')
  }
  const url = resolveFrontendPath(path)
  const res = await fetch(url, { ...rest, headers: h })
  const data = await parseJSON(res)
  if (!res.ok) {
    const msg =
      typeof data === 'object' && data !== null && 'error' in data
        ? String(/** @type {{ error: string }} */ (data).error)
        : res.statusText
    throw new ApiError(msg, res.status, data)
  }
  return data
}

export function useApi() {
  const { sessionId, currency } = useSession()
  return useMemo(
    () => ({
      sessionId,
      currency,
      /** @param {string} path */
      get(path) {
        return apiFetch(path, { method: 'GET', sessionId, currency })
      },
      /** @param {string} path @param {unknown} [body] */
      post(path, body) {
        return apiFetch(path, {
          method: 'POST',
          sessionId,
          currency,
          body: body !== undefined ? JSON.stringify(body) : undefined,
        })
      },
      /** @param {string} path */
      del(path) {
        return apiFetch(path, { method: 'DELETE', sessionId, currency })
      },
    }),
    [sessionId, currency],
  )
}
