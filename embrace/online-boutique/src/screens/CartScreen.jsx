import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native'
import { Link, useOutletContext } from 'react-router-dom'
import { useApi, ApiError } from '../api/client'
import { formatMoney } from '../utils/money'
import { assetUrl } from '../utils/assets'
import { theme } from '../theme'
import CheckoutButton from '../components/CheckoutButton'

export default function CartScreen() {
  const api = useApi()
  const { setCartCount } = useOutletContext()
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState(null)
  const [err, setErr] = useState(null)
  const [orderMsg, setOrderMsg] = useState(null)
  const [checkoutErr, setCheckoutErr] = useState(null)

  const [email, setEmail] = useState('someone@example.com')
  const [street, setStreet] = useState('1600 Amphitheatre Parkway')
  const [zip, setZip] = useState('94043')
  const [city, setCity] = useState('Mountain View')
  const [state, setState] = useState('CA')
  const [country, setCountry] = useState('United States')
  const [cc, setCc] = useState('4432808768013908')
  const [ccMonth, setCcMonth] = useState('1')
  const [ccYear, setCcYear] = useState('2030')
  const [ccCvv, setCcCvv] = useState('672')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    api
      .get('/api/v1/cart')
      .then((d) => {
        setCart(d)
        setCartCount(/** @type {{ cart_item_count?: number }} */ (d).cart_item_count ?? 0)
        setErr(null)
      })
      .catch((e) => {
        setErr(e instanceof ApiError ? e.message : 'Failed to load cart')
      })
      .finally(() => setLoading(false))
  }, [api, setCartCount])

  useEffect(() => {
    load()
  }, [load])

  const empty = () => {
    api
      .del('/api/v1/cart')
      .then(() => {
        setCartCount(0)
        setOrderMsg(null)
        setCheckoutErr(null)
        load()
      })
      .catch(() => {})
  }

  const placeOrder = () => {
    setSubmitting(true)
    setOrderMsg(null)
    api
      .post('/api/v1/orders', {
        email,
        street_address: street,
        zip_code: parseInt(zip, 10) || 0,
        city,
        state,
        country,
        credit_card_number: cc,
        credit_card_expiration_month: parseInt(ccMonth, 10) || 1,
        credit_card_expiration_year: parseInt(ccYear, 10) || 2030,
        credit_card_cvv: parseInt(ccCvv, 10) || 0,
      })
      .then((d) => {
        const oid = /** @type {{ order?: { orderId?: string, order_id?: string } }} */ (d)?.order
        const id = oid?.orderId ?? oid?.order_id
        setOrderMsg(id ? `Order placed! Confirmation #${id}` : 'Order placed!')
        load()
      })
      .catch((e) => {
        setOrderMsg(e instanceof ApiError ? e.message : 'Checkout failed')
      })
      .finally(() => setSubmitting(false))
  }

  if (loading && !cart) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.teal} />
      </View>
    )
  }

  const items = cart?.items ?? []
  const emptyCart = items.length === 0

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={styles.h1}>Your cart</Text>
      {err ? <Text style={styles.err}>{err}</Text> : null}
      {checkoutErr ? <Text style={styles.checkoutErr}>{checkoutErr}</Text> : null}
      {orderMsg ? <Text style={styles.ok}>{orderMsg}</Text> : null}

      {emptyCart ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Your shopping cart is empty!</Text>
          <Text style={styles.muted}>Items you add will appear here.</Text>
          <Link to="/" style={{ marginTop: 16 }}>
            <Text style={styles.link}>Browse products →</Text>
          </Link>
        </View>
      ) : (
        <>
          <View style={styles.rowBar}>
            <Text style={styles.count}>
              {cart?.cart_item_count ?? 0} item{(cart?.cart_item_count ?? 0) === 1 ? '' : 's'} in your cart
            </Text>
            <Pressable onPress={empty} style={styles.secondary}>
              <Text style={styles.secondaryTxt}>Empty cart</Text>
            </Pressable>
          </View>

          {items.map((line, i) => {
            const l = /** @type {{ product: { id?: string, name?: string, picture?: string }, quantity: number, price: object }} */ (line)
            const pid = l.product.id ?? `${i}`
            const pic = l.product.picture ?? ''
            return (
              <View key={`${pid}-${i}`} style={styles.line}>
                <Link to={`/product/${encodeURIComponent(pid)}`}>
                  <Image source={{ uri: assetUrl(pic) }} style={styles.thumb} resizeMode="cover" />
                </Link>
                <View style={styles.lineMeta}>
                  <Text style={styles.lineName}>{l.product.name}</Text>
                  <Text style={styles.sku}>SKU: #{l.product.id}</Text>
                  <Text style={styles.qty}>Quantity: {l.quantity}</Text>
                  <Text style={styles.linePrice}>{formatMoney(l.price)}</Text>
                </View>
              </View>
            )
          })}

          <View style={styles.summary}>
            <Text style={styles.sumLine}>
              Shipping: <Text style={styles.strong}>{formatMoney(cart?.shipping_cost)}</Text>
            </Text>
            <Text style={styles.total}>
              Total: <Text style={styles.strong}>{formatMoney(cart?.total_cost)}</Text>
            </Text>
          </View>

          <Text style={styles.h2}>Checkout</Text>
          <Labeled label="E-mail" value={email} onChange={setEmail} keyboard="email-address" />
          <Labeled label="Street address" value={street} onChange={setStreet} />
          <View style={styles.row2}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Labeled label="Zip" value={zip} onChange={setZip} />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Labeled label="City" value={city} onChange={setCity} />
            </View>
          </View>
          <View style={styles.row2}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Labeled label="State" value={state} onChange={setState} />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Labeled label="Country" value={country} onChange={setCountry} />
            </View>
          </View>
          <Labeled label="Credit card number" value={cc} onChange={setCc} />
          <View style={styles.row2}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Labeled label="Exp. month" value={ccMonth} onChange={setCcMonth} />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Labeled label="Exp. year" value={ccYear} onChange={setCcYear} />
            </View>
          </View>
          <Labeled label="CVV" value={ccCvv} onChange={setCcCvv} />

          <CheckoutButton
            formState={{ email, street, zip, city, state, country, cc, ccMonth, ccYear, ccCvv }}
            cartItems={items}
            submitting={submitting}
            setSubmitting={setSubmitting}
            onSuccess={(id) => {
              setCheckoutErr(null)
              setOrderMsg(id ? `Order placed! Confirmation #${id}` : 'Order placed!')
              load()
            }}
            onError={() => {
              setOrderMsg(null)
              setCheckoutErr('Error: checkout could not be completed. Please review your cart and try again.')
              load()
            }}
          />
        </>
      )}
    </ScrollView>
  )
}

/** @param {{ label: string, value: string, onChange: (s: string) => void, keyboard?: 'email-address'|'default' }} props */
function Labeled({ label, value, onChange, keyboard }) {
  return (
    <View style={styles.field}>
      <Text style={styles.lab}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        style={styles.input}
        placeholderTextColor={theme.muted}
        keyboardType={keyboard === 'email-address' ? 'email-address' : 'default'}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  page: { padding: 12 },
  h1: { fontSize: 22, fontWeight: '600', marginBottom: 8, color: theme.text },
  h2: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8, color: theme.text },
  center: { padding: 32, alignItems: 'center' },
  err: { color: '#b00020', marginBottom: 8 },
  checkoutErr: { color: '#b00020', marginBottom: 8, fontWeight: '600' },
  ok: { color: '#1b5e20', marginBottom: 8, fontWeight: '500' },
  emptyBox: { paddingVertical: 24 },
  emptyTitle: { fontSize: 18, marginBottom: 8, color: theme.text },
  muted: { color: theme.muted },
  link: { color: theme.teal, fontWeight: '600', fontSize: 15 },
  rowBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  count: { fontSize: 15, color: theme.text },
  secondary: { borderWidth: 1, borderColor: theme.border, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 4 },
  secondaryTxt: { fontSize: 13, color: theme.control },
  line: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    paddingBottom: 12,
  },
  thumb: { width: 88, height: 88, marginRight: 12, borderRadius: 4, backgroundColor: theme.barBg },
  lineMeta: { flex: 1 },
  lineName: { fontSize: 16, fontWeight: '500', color: theme.text },
  sku: { fontSize: 12, color: theme.muted, marginTop: 4 },
  qty: { fontSize: 13, marginTop: 6, color: theme.text },
  linePrice: { fontSize: 15, fontWeight: '600', marginTop: 6, color: theme.text },
  summary: { alignItems: 'flex-end', marginVertical: 12 },
  sumLine: { fontSize: 14, color: theme.muted },
  total: { fontSize: 17, marginTop: 6, color: theme.text },
  strong: { fontWeight: '700', color: theme.text },
  field: { marginBottom: 10 },
  lab: { fontSize: 12, color: theme.muted, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: theme.bg,
    color: theme.text,
  },
  row2: { flexDirection: 'row' },
  primary: {
    marginTop: 16,
    backgroundColor: theme.teal,
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: 'center',
  },
  primaryTxt: { color: theme.text, fontWeight: '700', fontSize: 16 },
  disabled: { opacity: 0.6 },
})
