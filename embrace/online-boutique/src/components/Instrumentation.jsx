import { useEffect } from 'react'
import { initSDK } from '@embrace-io/web-sdk'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'

const EMBRACE_APP_ID = '2disg'
const EMBRACE_APP_VERSION = '1.0.0'

/** Merged with Embrace’s built-in web resource; attached to all spans and log records from this SDK. */
const rumResource = resourceFromAttributes({
  frontend_sdk: 'embrace',
  embrace_app_id: EMBRACE_APP_ID,
  embrace_app_version: EMBRACE_APP_VERSION,
})

/**
 * Embrace’s default config manager fetches `https://a-<appId>.config.emb-api.com/v2/config`.
 * That response has been observed to include duplicate `Access-Control-Allow-Origin`
 * values (`*, *`), which browsers reject — the failure is on the API side, not fixable
 * from app CORS settings. A local manager skips that fetch so init does not trigger
 * a cross-origin request. Remote dashboard tuning (sampling %, etc.) will not apply
 * until Embrace fixes the headers or you proxy config through your own origin.
 */
function createLocalOnlyDynamicConfigManager(initial = {}) {
  const base = {
    samplingPct: 100,
    // network spans forwarding threshold needs to be 100 to enable network spans forwarding
    networkSpansForwardingThreshold: 100,
    emptySessionAvoidanceEnabledPct: 0,
    ...initial,
  }
  let config = { ...base }
  return {
    refreshRemoteConfig: async () => {},
    setConfig: (partial) => {
      config = { ...config, ...partial }
    },
    getConfig: () => ({ ...config }),
  }
}

let embraceInstrumentationStarted = false

function startEmbraceInstrumentation() {
  if (embraceInstrumentationStarted || typeof window === 'undefined') {
    return
  }
  embraceInstrumentationStarted = true

  const result = initSDK({
    appID: EMBRACE_APP_ID,
    appVersion: EMBRACE_APP_VERSION,
    dynamicSDKConfigManager: createLocalOnlyDynamicConfigManager(),
    resource: rumResource,
    defaultInstrumentationConfig: {
      'web-vital': {
        trackingLevel: 'all',     // capture LCP, INP, CLS, FCP
      }
    },
  })

  if (result) {
    console.log('Successfully initialized the Embrace SDK')
  } else {
    console.log('Failed to initialize the Embrace SDK')
  }
}

/**
 * Mount once near the app root (e.g. in App.jsx). Safe if included from multiple routes: init runs only once.
 */
export default function Instrumentation() {
  useEffect(() => {
    startEmbraceInstrumentation()
  }, [])
  return null
}
