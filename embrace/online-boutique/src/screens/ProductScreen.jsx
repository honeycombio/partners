import React, { useEffect, useState } from 'react'
import { View, Text, Image, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { useApi, ApiError } from '../api/client'
import { formatMoney } from '../utils/money'
import { assetUrl } from '../utils/assets'
import { theme } from '../theme'

export default function ProductScreen() {
  const { id } = useParams()
  const api = useApi()
  const nav = useNavigate()
  const { setCartCount, showCartNotice } = useOutletContext()

  const [loading, setLoading] = useState(true)
  const [row, setRow] = useState(null)
  const [recs, setRecs] = useState([])
  const [err, setErr] = useState(null)

  useEffect(() => {
    if (!id) {
      return
    }
    let cancelled = false
    setLoading(true)
    api
      .get(`/api/v1/products/${encodeURIComponent(id)}`)
      .then((d) => {
        if (!cancelled) {
          const data = /** @type {{ product?: object, price?: object, recommendations?: unknown[] }} */ (d)
          if (data.product && data.price) {
            setRow({ product: data.product, price: data.price })
          }
          setRecs(data.recommendations ?? [])
          setErr(null)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setErr(e instanceof ApiError ? e.message : 'Product not found')
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
  }, [api, id])

  const add = () => {
    if (!id) {
      return
    }
    api
      .post('/api/v1/cart/items', { product_id: id, quantity: 1 })
      .then(() => api.get('/api/v1/cart'))
      .then((c) => {
        const n = /** @type {{ cart_item_count?: number }} */ (c).cart_item_count ?? 0
        setCartCount?.(n)
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
  if (err || !row) {
    return (
      <View style={styles.page}>
        <Pressable onPress={() => nav(-1)} style={styles.back}>
          <Text style={styles.backTxt}>← Back</Text>
        </Pressable>
        <Text style={styles.err}>{err ?? 'Not found'}</Text>
      </View>
    )
  }

  const p = /** @type {{ id?: string, name?: string, picture?: string, description?: string }} */ (row.product)
  const pic = p.picture ?? ''

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 32 }}>
      <Pressable onPress={() => nav(-1)} style={styles.back}>
        <Text style={styles.backTxt}>← Back</Text>
      </Pressable>
      <Image source={{ uri: assetUrl(pic) }} style={styles.hero} resizeMode="contain" />
      <Text style={styles.name}>{p.name}</Text>
      <Text style={styles.sku}>SKU: #{p.id}</Text>
      <Text style={styles.price}>{formatMoney(row.price)}</Text>
      <Text style={styles.desc}>{p.description}</Text>
      <Pressable style={styles.btn} onPress={add}>
        <Text style={styles.btnTxt}>Add to cart</Text>
      </Pressable>

      {recs.length > 0 ? (
        <View style={styles.recBlock}>
          <Text style={styles.recTitle}>You may also like</Text>
          {recs.map((rec) => {
            const r = /** @type {{ product: { id?: string, name?: string, picture?: string }, price: object }} */ (rec)
            const rid = r.product.id ?? ''
            const rp = r.product.picture ?? ''
            return (
              <Link key={rid} to={`/product/${encodeURIComponent(rid)}`} style={{ textDecoration: 'none' }}>
                <View style={styles.recRow}>
                  <Image source={{ uri: assetUrl(rp) }} style={styles.recImg} resizeMode="cover" />
                  <View>
                    <Text style={styles.recName}>{r.product.name}</Text>
                    <Text style={styles.recPrice}>{formatMoney(r.price)}</Text>
                  </View>
                </View>
              </Link>
            )
          })}
        </View>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 12, backgroundColor: theme.bg },
  center: { padding: 48, alignItems: 'center' },
  back: { marginBottom: 12, alignSelf: 'flex-start' },
  backTxt: { fontSize: 15, color: theme.teal, fontWeight: '600' },
  hero: { width: '100%', height: 240, backgroundColor: theme.barBg, marginBottom: 12 },
  name: { fontSize: 22, fontWeight: '600', color: theme.text },
  sku: { fontSize: 13, color: theme.muted, marginTop: 4 },
  price: { fontSize: 18, marginVertical: 12, color: theme.text, fontWeight: '500' },
  desc: { fontSize: 15, lineHeight: 22, color: theme.text },
  btn: {
    marginTop: 16,
    backgroundColor: theme.teal,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  btnTxt: { color: theme.text, fontWeight: '700' },
  err: { color: '#b00020' },
  recBlock: { marginTop: 28 },
  recTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8, color: theme.text },
  recRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  recImg: { width: 48, height: 48, marginRight: 12, borderRadius: 4 },
  recName: { fontSize: 14, color: theme.text },
  recPrice: { fontSize: 13, color: theme.muted, marginTop: 4 },
})
