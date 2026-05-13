import {
    EMBRACE_HONEY_BEE_PRODUCT_ID,
    getEmbraceHoneyBeeProduct,
    isEmbraceHoneyBeeProduct,
  } from '../data/embraceHoneyBeeProduct'
  
  const CART_KEY_PREFIX = 'ob_embrace_merch_cart'
  const NANOS_PER_UNIT = 1_000_000_000
  const DEFAULT_SHIPPING = {
    currencyCode: 'USD',
    nanos: 650000000,
    units: '6',
  }
  
  function storageKey(sessionId) {
    return `${CART_KEY_PREFIX}:${sessionId}`
  }
  
  function readCart(sessionId) {
    try {
      const raw = localStorage.getItem(storageKey(sessionId))
      const data = raw ? JSON.parse(raw) : {}
      return typeof data === 'object' && data !== null ? data : {}
    } catch {
      return {}
    }
  }
  
  function writeCart(sessionId, cart) {
    try {
      localStorage.setItem(storageKey(sessionId), JSON.stringify(cart))
    } catch {
      /* ignore */
    }
  }
  
  function quantityFor(sessionId, productId) {
    const value = readCart(sessionId)[productId]
    const n = Number(value)
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
  }
  
  function amountToNanos(money) {
    if (!money) {
      return 0
    }
    const units = typeof money.units === 'string' ? parseInt(money.units, 10) : (money.units ?? 0)
    const nanos = money.nanos ?? 0
    return units * NANOS_PER_UNIT + nanos
  }
  
  function nanosToMoney(totalNanos, currencyCode) {
    const units = Math.trunc(totalNanos / NANOS_PER_UNIT)
    const nanos = Math.abs(totalNanos % NANOS_PER_UNIT)
    const money = { currencyCode, units: String(units) }
    if (nanos > 0) {
      money.nanos = nanos
    }
    return money
  }
  
  function addMoney(a, b, currencyCode) {
    return nanosToMoney(amountToNanos(a) + amountToNanos(b), currencyCode)
  }
  
  function multiplyMoney(money, quantity, currencyCode) {
    return nanosToMoney(amountToNanos(money) * quantity, currencyCode)
  }
  
  function hasAmount(money) {
    return amountToNanos(money) > 0
  }
  
  export function addLocalMerchItem(sessionId, productId, quantity = 1) {
    if (!isEmbraceHoneyBeeProduct(productId)) {
      return false
    }
    const nextQuantity = Math.max(1, Math.floor(Number(quantity) || 1))
    const cart = readCart(sessionId)
    cart[EMBRACE_HONEY_BEE_PRODUCT_ID] = quantityFor(sessionId, EMBRACE_HONEY_BEE_PRODUCT_ID) + nextQuantity
    writeCart(sessionId, cart)
    return true
  }
  
  export function clearLocalMerchCart(sessionId) {
    try {
      localStorage.removeItem(storageKey(sessionId))
    } catch {
      /* ignore */
    }
  }
  
  export function completeLocalMerchOrder(sessionId) {
    const quantity = quantityFor(sessionId, EMBRACE_HONEY_BEE_PRODUCT_ID)
    if (quantity <= 0) {
      return null
    }
  
    clearLocalMerchCart(sessionId)
    return {
      order: {
        orderId: `MERCH-${Date.now().toString(36).toUpperCase()}`,
      },
    }
  }
  
  export function mergeLocalMerchCart(serverCart, sessionId, currency = 'USD') {
    const quantity = quantityFor(sessionId, EMBRACE_HONEY_BEE_PRODUCT_ID)
    if (quantity <= 0) {
      return serverCart
    }
  
    const currencyCode = serverCart?.user_currency ?? currency
    const row = getEmbraceHoneyBeeProduct(currencyCode)
    const linePrice = multiplyMoney(row.price, quantity, currencyCode)
    const localLine = {
      product: row.product,
      quantity,
      price: linePrice,
    }
    const items = [...(serverCart?.items ?? []), localLine]
    const remoteCount = serverCart?.cart_item_count ?? 0
    const shippingCost =
      remoteCount > 0 || hasAmount(serverCart?.shipping_cost)
        ? serverCart?.shipping_cost
        : { ...DEFAULT_SHIPPING, currencyCode }
    const totalCost =
      remoteCount > 0
        ? addMoney(serverCart?.total_cost, linePrice, currencyCode)
        : addMoney(linePrice, shippingCost, currencyCode)
  
    return {
      ...serverCart,
      cart_item_count: remoteCount + quantity,
      items,
      shipping_cost: shippingCost,
      total_cost: totalCost,
      user_currency: currencyCode,
    }
  }