import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable, Image } from 'react-native'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { theme } from '../theme'
import { assetUrl } from '../utils/assets'
import { ApiError, useApi } from '../api/client'
import { useSession } from '../context/SessionContext'

/** @typedef {{ cartCount: number, setCartCount: (n: number) => void }} LayoutOutletContext */

export default function MainLayout() {
  const api = useApi()
  const loc = useLocation()
  const [cartCount, setCartCount] = useState(0)
  const [banner, setBanner] = useState(null)

  useEffect(() => {
    let cancelled = false
    api
      .get('/api/v1/cart')
      .then((d) => {
        if (!cancelled) {
          setCartCount(/** @type {{ cart_item_count?: number }} */ (d).cart_item_count ?? 0)
        }
      })
      .catch((e) => {
        if (!cancelled && !(e instanceof ApiError && e.status === 503)) {
          setCartCount(0)
        }
      })
    return () => {
      cancelled = true
    }
  }, [api, loc.pathname])

  useEffect(() => {
    let cancelled = false
    api
      .get('/api/v1/ads')
      .then((d) => {
        const ad = /** @type {{ ad?: { text?: string } }} */ (d).ad
        if (!cancelled && ad?.text) {
          setBanner(ad.text)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBanner(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [api])

  return (
    <View style={styles.root}>
      <View style={styles.topStrip}>
        <Text style={styles.ship}>Free shipping with $75 purchase!</Text>
        <CurrencyControl />
      </View>
      {banner ? (
        <View style={styles.adBar}>
          <Text style={styles.adText}>{banner}</Text>
        </View>
      ) : null}
      <View style={styles.brandBar}>
        <Link to="/" style={styles.brandLink}>
          <Image
            source={{ uri: assetUrl('/static/icons/Hipster_NavLogo.svg') }}
            style={styles.navLogo}
            resizeMode="contain"
            accessibilityLabel="Online Boutique"
            accessibilityRole="image"
          />
        </Link>
      </View>
      <TabBar cartCount={cartCount} />
      <View style={styles.outlet}>
        <Outlet context={{ cartCount, setCartCount }} />
      </View>
    </View>
  )
}

function CurrencyControl() {
  const api = useApi()
  const { currency, setCurrency } = useSession()
  const [open, setOpen] = useState(false)
  const [codes, setCodes] = useState([])

  useEffect(() => {
    api
      .get('/api/v1/currencies')
      .then((d) => {
        const c = /** @type {{ currencies?: string[] }} */ (d).currencies
        if (c?.length) {
          const list = [...c]
          if (!list.includes('KRW')) list.push('KRW')
          setCodes(list)
        }
      })
      .catch(() => {
        setCodes(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'TRY'])
      })
  }, [api])

  const apply = (code) => {
    setCurrency(code)
    setOpen(false)
    api.post('/api/v1/session/currency', { currency_code: code }).catch(() => {})
  }

  return (
    <View style={styles.curWrap}>
      <Pressable onPress={() => setOpen(!open)} style={styles.curBtn}>
        <Text style={styles.curLabel}>{currency}</Text>
        <Text style={styles.curCaret}>▾</Text>
      </Pressable>
      {open ? (
        <View style={styles.curMenu}>
          {codes.map((c) => (
            <Pressable key={c} onPress={() => apply(c)} style={styles.curItem}>
              <Text style={styles.curItemText}>{c}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  )
}

/** @param {{ cartCount: number }} props */
function TabBar({ cartCount }) {
  const loc = useLocation()
  const tabs = [
    { path: '/', label: 'Home' },
    { path: '/search', label: 'Search' },
    { path: '/cart', label: 'Cart' },
  ]
  return (
    <View style={styles.tabBar}>
      {tabs.map((t) => {
        const active = loc.pathname === t.path
        return (
          <Link key={t.path} to={t.path} style={{ flex: 1, textDecoration: 'none' }}>
            <View style={[styles.tab, active && styles.tabActive]}>
              <View style={styles.tabRow}>
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
                {t.path === '/cart' && cartCount > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeTxt}>{cartCount > 99 ? '99+' : cartCount}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </Link>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.bg,
    minHeight: '100vh',
    fontFamily: theme.font,
  },
  topStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.bg,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    // Sit above adBar / brandBar so the currency dropdown (absolute, overflows downward)
    // is not painted underneath later siblings (same DOM order wins without this).
    position: 'relative',
    zIndex: 100,
  },
  ship: { fontSize: 13, fontWeight: '500', color: theme.text, flex: 1 },
  adBar: {
    backgroundColor: theme.teal,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  adText: { color: '#fff', fontSize: 13, textAlign: 'center' },
  brandBar: {
    backgroundColor: '#111111',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
  },
  brandLink: { textDecorationLine: 'none', maxWidth: '100%' },
  navLogo: {
    width: 209,
    maxWidth: '100%',
    height: 40,
  },
  outlet: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.bg,
    paddingTop: 4,
    paddingBottom: 0,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: theme.teal },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabText: { fontSize: 13, color: theme.control },
  tabTextActive: { color: theme.text, fontWeight: '600' },
  badge: {
    backgroundColor: theme.teal,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeTxt: { fontSize: 10, color: theme.text },
  curWrap: { position: 'relative', zIndex: 20 },
  curBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  curLabel: { fontSize: 12, color: theme.control, fontWeight: '500' },
  curCaret: { fontSize: 10, color: theme.control },
  curMenu: {
    position: 'absolute',
    top: 28,
    right: 0,
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 4,
    minWidth: 120,
    zIndex: 50,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  curItem: { paddingVertical: 8, paddingHorizontal: 12 },
  curItemText: { fontSize: 14, color: theme.text },
})
