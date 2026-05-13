import React from 'react'
import { Pressable, Text, StyleSheet } from 'react-native'
import { useApi } from '../api/client'
import { isEmbraceHoneyBeeProduct } from '../data/embraceHoneyBeeProduct'
import { reportHandledException } from '../utils/reportHandledException'
import { theme } from '../theme'

const PREFETCH_ENABLED = import.meta.env.VITE_CHECKOUT_PREFETCH === 'true'

/**
 * @param {{
 *   formState: { email: string, street: string, zip: string, city: string, state: string, country: string, cc: string, ccMonth: string, ccYear: string, ccCvv: string },
 *   cartItems?: Array<{ product?: { id?: string } }>,
 *   submitting: boolean,
 *   setSubmitting: (v: boolean) => void,
 *   onSuccess: (id?: string) => void,
 *   onError: () => void,
 * }} props
 */
export default function CheckoutButton({ formState, cartItems = [], submitting, setSubmitting, onSuccess, onError }) {
  const api = useApi()

  const buildPayload = () => ({
    email: formState.email,
    street_address: formState.street,
    zip_code: parseInt(formState.zip, 10) || 0,
    city: formState.city,
    state: formState.state,
    country: formState.country,
    credit_card_number: formState.cc,
    credit_card_expiration_month: parseInt(formState.ccMonth, 10) || 1,
    credit_card_expiration_year: parseInt(formState.ccYear, 10) || 2030,
    credit_card_cvv: parseInt(formState.ccCvv, 10) || 0,
  })

  const handlePress = () => {
    setSubmitting(true)
    const shouldStageCart = cartItems.some((line) => isEmbraceHoneyBeeProduct(line?.product?.id))

    if (!PREFETCH_ENABLED || !shouldStageCart) {
      const payload = buildPayload()
      api
        .post('/api/v1/orders', payload)
        .then((d) => {
          const oid = /** @type {{ order?: { orderId?: string, order_id?: string } }} */ (d)?.order
          const id = oid?.orderId ?? oid?.order_id
          onSuccess(id)
        })
        .catch(() => {
          setSubmitting(false)
        })
        .finally(() => setSubmitting(false))
      return
    }

    let payload
    try {
      payload = {
        ...buildPayload(),
        shipment_plan: buildShipmentPlan(cartItems),
      }
    } catch (e) {
      const error = e instanceof Error ? e : new Error('Checkout preparation failed')
      reportHandledException(error, {
        checkout_stage: 'prepare_order',
        checkout_path: 'local_cart_preparation',
        cart_item_count: String(cartItems.length),
        order_submit_attempted: 'false',
        product_ids: cartItems.map((line) => line?.product?.id).filter(Boolean).join(','),
      })
      setSubmitting(false)
      onError()
      return
    }

    api
      .post('/api/v1/orders', payload)
      .then((d) => {
        const oid = /** @type {{ order?: { orderId?: string, order_id?: string } }} */ (d)?.order
        const id = oid?.orderId ?? oid?.order_id
        onSuccess(id)
      })
      .catch((e) => {
        const error = e instanceof Error ? e : new Error('Checkout request failed')
        reportHandledException(error, {
          checkout_stage: 'submit_order',
          cart_item_count: String(cartItems.length),
          product_ids: cartItems.map((line) => line?.product?.id).filter(Boolean).join(','),
        })
        onError()
      })
      .finally(() => setSubmitting(false))
  }

  return (
    <Pressable style={[styles.primary, submitting && styles.disabled]} onPress={handlePress} disabled={submitting}>
      <Text style={styles.primaryTxt}>{submitting ? 'Placing order…' : 'Place order'}</Text>
    </Pressable>
  )
}

function buildShipmentPlan(cartItems) {
  return cartItems.map((line) => {
    const product = line?.product ?? {}
    return {
      product_id: product.id,
      quantity: String(line?.quantity ?? 1),
      warehouse: product.fulfillment.warehouse.code.toUpperCase(),
    }
  })
}

const styles = StyleSheet.create({
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