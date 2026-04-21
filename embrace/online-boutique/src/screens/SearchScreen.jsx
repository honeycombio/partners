import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { Link } from 'react-router-dom'
import { useApi, ApiError } from '../api/client'
import { formatMoney } from '../utils/money'
import { assetUrl } from '../utils/assets'
import { theme } from '../theme'

export default function SearchScreen() {
  const api = useApi()
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])
  const [err, setErr] = useState(null)

  const run = () => {
    const query = q.trim()
    if (!query) {
      setRows([])
      return
    }
    setLoading(true)
    setErr(null)
    api
      .get(`/api/v1/products/search?q=${encodeURIComponent(query)}`)
      .then((d) => {
        setRows(/** @type {{ products?: unknown[] }} */ (d).products ?? [])
      })
      .catch((e) => {
        setErr(e instanceof ApiError ? e.message : 'Search failed')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const query = q.trim()
    if (query.length < 2) {
      setRows([])
      setErr(null)
      return
    }
    const t = setTimeout(() => {
      setLoading(true)
      setErr(null)
      api
        .get(`/api/v1/products/search?q=${encodeURIComponent(query)}`)
        .then((d) => {
          setRows(/** @type {{ products?: unknown[] }} */ (d).products ?? [])
        })
        .catch((e) => {
          setErr(e instanceof ApiError ? e.message : 'Search failed')
        })
        .finally(() => setLoading(false))
    }, 350)
    return () => clearTimeout(t)
  }, [q, api])

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={styles.h1}>Search</Text>
      <View style={styles.searchRow}>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search products"
          placeholderTextColor={theme.muted}
          style={styles.input}
          onSubmitEditing={run}
          returnKeyType="search"
        />
        <Pressable style={styles.go} onPress={run}>
          <Text style={styles.goTxt}>Go</Text>
        </Pressable>
      </View>
      {loading ? (
        <ActivityIndicator color={theme.teal} style={{ marginTop: 16 }} />
      ) : err ? (
        <Text style={styles.err}>{err}</Text>
      ) : (
        <View style={styles.list}>
          {rows.map((row) => {
            const r = /** @type {{ product: { id?: string, name?: string, picture?: string }, price: object }} */ (row)
            const id = r.product.id ?? ''
            const pic = r.product.picture ?? ''
            return (
              <Link key={id} to={`/product/${encodeURIComponent(id)}`} style={{ textDecoration: 'none' }}>
                <View style={styles.row}>
                  <Image source={{ uri: assetUrl(pic) }} style={styles.thumb} resizeMode="cover" />
                  <View style={styles.meta}>
                    <Text style={styles.name} numberOfLines={2}>
                      {r.product.name}
                    </Text>
                    <Text style={styles.sub}>{formatMoney(r.price)}</Text>
                  </View>
                </View>
              </Link>
            )
          })}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  page: { padding: 12 },
  h1: { fontSize: 20, fontWeight: '600', marginBottom: 12, color: theme.text },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: theme.barBg,
    color: theme.text,
  },
  go: { backgroundColor: theme.teal, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 4 },
  goTxt: { fontWeight: '600', color: theme.text },
  list: { marginTop: 12 },
  row: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.border },
  thumb: { width: 56, height: 56, borderRadius: 4, marginRight: 12, backgroundColor: theme.barBg },
  meta: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 15, color: theme.text, fontWeight: '500' },
  sub: { fontSize: 13, color: theme.muted, marginTop: 4 },
  err: { color: '#b00020', marginTop: 12 },
})
