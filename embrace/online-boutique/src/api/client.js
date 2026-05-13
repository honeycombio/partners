import { useMemo } from 'react'
import { useSession } from '../context/SessionContext'
import { resolveFrontendPath } from '../utils/frontendOrigin'
import {
  EMBRACE_HONEY_BEE_PRODUCT_ID,
  getEmbraceHoneyBeeProduct,
  isEmbraceHoneyBeeProduct,
  matchesEmbraceHoneyBeeProduct,
} from '../data/embraceHoneyBeeProduct'
import {
  addLocalMerchItem,
  clearLocalMerchCart,
  completeLocalMerchOrder,
  mergeLocalMerchCart,
} from '../utils/localMerchCart'

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

function parseRequestPath(path) {
  try {
    return new URL(path, 'https://online-boutique.local')
  } catch {
    return null
  }
}

function parseRequestBody(body) {
  if (typeof body !== 'string') {
    return null
  }
  try {
    return JSON.parse(body)
  } catch {
    return null
  }
}

function appendProduct(rows, product) {
  const products = Array.isArray(rows) ? rows : []
  if (products.some((row) => row?.product?.id === product.product.id)) {
    return products
  }
  return [...products, product]
}

function localProductDetail(path, currency) {
  const url = parseRequestPath(path)
  if (!url) {
    return null
  }
  const match = url.pathname.match(/^\/api\/v1\/products\/([^/]+)$/)
  if (!match) {
    return null
  }
  const productId = decodeURIComponent(match[1])
  if (!isEmbraceHoneyBeeProduct(productId)) {
    return null
  }
  return {
    ...getEmbraceHoneyBeeProduct(currency),
    recommendations: [],
  }
}

function applyLocalCatalog(path, data, sessionId, currency) {
  const url = parseRequestPath(path)
  if (!url) {
    return data
  }

  if (url.pathname === '/api/v1/cart') {
    return mergeLocalMerchCart(data, sessionId, currency)
  }

  if (url.pathname === '/api/v1/products') {
    return {
      ...data,
      products: appendProduct(data?.products, getEmbraceHoneyBeeProduct(currency)),
    }
  }

  if (url.pathname === '/api/v1/products/search') {
    const query = url.searchParams.get('q')
    if (!matchesEmbraceHoneyBeeProduct(query)) {
      return data
    }
    return {
      ...data,
      products: appendProduct(data?.products, getEmbraceHoneyBeeProduct(currency)),
    }
  }

  return data
}

function emptyCart(currency) {
  return {
    cart_item_count: 0,
    items: [],
    recommendations: [],
    shipping_cost: { currencyCode: currency },
    total_cost: { currencyCode: currency },
    user_currency: currency,
  }
}

/**
 * @param {string} path
 * @param {RequestInit & { sessionId: string, currency: string }} init
 */
export async function apiFetch(path, init) {
  const { sessionId, currency, headers, ...rest } = init
  const method = String(rest.method ?? 'GET').toUpperCase()
  const body = parseRequestBody(rest.body)

  if (method === 'GET') {
    const localDetail = localProductDetail(path, currency)
    if (localDetail) {
      return localDetail
    }
  }

  if (method === 'POST' && path === '/api/v1/cart/items' && isEmbraceHoneyBeeProduct(body?.product_id)) {
    addLocalMerchItem(sessionId, EMBRACE_HONEY_BEE_PRODUCT_ID, body?.quantity)
    return { ok: true }
  }

  if (method === 'POST' && path === '/api/v1/orders') {
    const localOrder = completeLocalMerchOrder(sessionId)
    if (localOrder) {
      return localOrder
    }
  }

  if (method === 'DELETE' && path === '/api/v1/cart') {
    clearLocalMerchCart(sessionId)
  }

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
    if (method === 'GET' && parseRequestPath(path)?.pathname === '/api/v1/cart') {
      const localCart = mergeLocalMerchCart(emptyCart(currency), sessionId, currency)
      if ((localCart?.cart_item_count ?? 0) > 0) {
        return localCart
      }
    }
    const msg =
      typeof data === 'object' && data !== null && 'error' in data
        ? String(/** @type {{ error: string }} */ (data).error)
        : res.statusText
    throw new ApiError(msg, res.status, data)
  }
  return method === 'GET' ? applyLocalCatalog(path, data, sessionId, currency) : data
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
