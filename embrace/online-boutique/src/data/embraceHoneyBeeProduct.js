export const EMBRACE_HONEY_BEE_PRODUCT_ID = 'EMBRACE-BEE-PLUSH'

const PRODUCT_PRICE_USD = {
  currencyCode: 'USD',
  nanos: 950000000,
  units: '39',
}

export function getEmbraceHoneyBeeProduct(currency = 'USD') {
  const price = { ...PRODUCT_PRICE_USD, currencyCode: currency }
  return {
    price,
    product: {
      categories: ['toy', 'apparel'],
      description: 'A soft honey bee plushie wearing a black Embrace tee with the neon logo front and center.',
      id: EMBRACE_HONEY_BEE_PRODUCT_ID,
      name: 'Embrace Honey Bee Plushie',
      picture: '/local-products/embrace-honey-bee-plushie.png',
      priceUsd: PRODUCT_PRICE_USD,
    },
  }
}

export function isEmbraceHoneyBeeProduct(productId) {
  return String(productId ?? '') === EMBRACE_HONEY_BEE_PRODUCT_ID
}

export function matchesEmbraceHoneyBeeProduct(query) {
  const q = String(query ?? '').trim().toLowerCase()
  if (!q) {
    return false
  }
  return ['embrace', 'honey', 'bee', 'plush', 'plushie', 'shirt', 't-shirt', 'tee'].some((token) =>
    q.includes(token),
  )
}