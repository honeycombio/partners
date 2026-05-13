import React, { useEffect, useState } from 'react'
import { View, Text, Image, StyleSheet, Pressable, ActivityIndicator, ScrollView } from 'react-native'
import { Link, useOutletContext } from 'react-router-dom'
import { useApi, ApiError } from '../api/client'
import { formatMoney } from '../utils/money'
import { assetUrl } from '../utils/assets'
import { theme } from '../theme'

export default function HomeScreen() {
  const api = useApi()
  const { setCartCount, showCartNotice } = useOutletContext()
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState([])
  const [err, setErr] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api
      .get('/api/v1/products')
      .then((d) => {
        if (!cancelled) {
          setRows(/** @type {{ products?: unknown[] }} */ (d).products ?? [])
          setErr(null)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setErr(e instanceof ApiError ? e.message : 'Failed to load products')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [api])

  const addToCart = (productId) => {
    api
      .post('/api/v1/cart/items', { product_id: productId, quantity: 1 })
      .then(() => api.get('/api/v1/cart'))
      .then((c) => {
        setCartCount(/** @type {{ cart_item_count?: number }} */ (c).cart_item_count ?? 0)
        showCartNotice?.()
      })
      .catch(() => {})
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.teal} />
      </View>
    )
  }
  if (err) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>{err}</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={styles.h1}>Hot products</Text>
      <View style={styles.grid}>
        {rows.map((row) => {
          const r = /** @type {{ product: { id?: string, name?: string, picture?: string }, price: object }} */ (row)
          const id = r.product.id ?? ''
          const pic = r.product.picture ?? ''
          return (
            <View key={id} style={styles.card}>
              <Link to={`/product/${encodeURIComponent(id)}`} style={{ textDecoration: 'none' }}>
                <Image source={{ uri: assetUrl(pic) }} style={styles.img} resizeMode="cover" />
              </Link>
              <Link to={`/product/${encodeURIComponent(id)}`} style={{ textDecoration: 'none' }}>
                <Text style={styles.title} numberOfLines={2}>
                  {r.product.name}
                </Text>
              </Link>
              <Text style={styles.price}>{formatMoney(r.price)}</Text>
              <Pressable style={styles.btn} onPress={() => addToCart(id)}>
                <Text style={styles.btnTxt}>Add to cart</Text>
              </Pressable>
            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  page: { padding: 12 },
  h1: { fontSize: 20, fontWeight: '600', marginBottom: 12, color: theme.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  card: {
    width: '48%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 4,
    padding: 8,
    backgroundColor: theme.bg,
  },
  img: { width: '100%', height: 120, borderRadius: 2, marginBottom: 8, backgroundColor: theme.barBg },
  title: { fontSize: 14, fontWeight: '500', color: theme.text, minHeight: 36 },
  price: { fontSize: 13, color: theme.muted, marginVertical: 6 },
  btn: {
    backgroundColor: theme.teal,
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  btnTxt: { color: theme.text, fontSize: 13, fontWeight: '600' },
  center: { padding: 24, alignItems: 'center' },
  err: { color: '#b00020' },
})
