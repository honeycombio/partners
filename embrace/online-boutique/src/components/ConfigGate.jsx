import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Capacitor } from '@capacitor/core'
import { getApiKey } from '../api/client'
import { theme } from '../theme'

export default function ConfigGate({ children }) {
  const key = getApiKey()
  if (!key) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>API key not configured</Text>
        <Text style={styles.body}>
          Set VITE_FRONTEND_API_KEY in a .env file (same value as FRONTEND_API_KEY on the Online Boutique
          frontend service). See README.md.
        </Text>
      </View>
    )
  }
  if (Capacitor.isNativePlatform()) {
    const origin = import.meta.env.VITE_FRONTEND_ORIGIN
    if (!origin || String(origin).trim().length === 0) {
      return (
        <View style={styles.wrap}>
          <Text style={styles.title}>Boutique URL required for mobile</Text>
          <Text style={styles.body}>
            Set VITE_FRONTEND_ORIGIN in .env to your Online Boutique frontend base URL (HTTPS), rebuild
            with npm run build, then run npx cap sync. See README.md (Mobile apps).
          </Text>
        </View>
      )
    }
  }
  return children
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, backgroundColor: '#fff3cd' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8, color: '#856404' },
  body: { fontSize: 14, color: '#856404', marginBottom: 16, lineHeight: 20 },
})
