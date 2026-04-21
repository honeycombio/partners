/**
 * @param {{ currencyCode?: string, currency_code?: string, units?: number|string, nanos?: number }|undefined} m
 */
export function formatMoney(m) {
  if (!m) {
    return '—'
  }
  const code = m.currencyCode ?? m.currency_code ?? ''
  const units = typeof m.units === 'string' ? parseInt(m.units, 10) : (m.units ?? 0)
  const nanos = m.nanos ?? 0
  const frac = Math.abs(nanos) / 1e9
  const sign = units < 0 ? -1 : 1
  const absU = Math.abs(units)
  const total = absU + frac
  return `${code} ${sign < 0 ? '-' : ''}${total.toFixed(2)}`
}
