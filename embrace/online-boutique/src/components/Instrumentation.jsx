import { useEffect } from 'react'
import { initSDK } from '@embrace-io/web-sdk'
import {
  CompositePropagator,
  W3CBaggagePropagator,
  W3CTraceContextPropagator,
} from '@opentelemetry/core'
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
 * Embrace disables network span forwarding by default (networkSpansForwardingThreshold: 0).
 * In that case it passes propagator: null into WebTracerProvider.register(), and the web SDK
 * treats null as "do not install a global propagator" — so fetch/XHR never get traceparent/baggage.
 * Supplying W3C propagators restores context injection for same-origin (and allowed cross-origin) requests.
 *
 * Note: full document navigations (plain <form> POST / <a href>) do not go through fetch; the browser
 * does not attach traceparent. Only fetch/XHR (and navigations that include the header by other means)
 * can join the RUM trace to the server.
 */
const w3cPropagator = new CompositePropagator({
  propagators: [new W3CTraceContextPropagator(), new W3CBaggagePropagator()],
})

/**
 * export Embrace telemetry to Honeycomb.
 */
function resolveOtlpUrl(urlOrPath) {
  if (typeof window === 'undefined' || !urlOrPath) {
    return urlOrPath
  }
  if (String(urlOrPath).startsWith('http://') || String(urlOrPath).startsWith('https://')) {
    return String(urlOrPath)
  }
  return new URL(String(urlOrPath), window.location.origin).href
}

/**
 * setup the exporters for Honeycomb, for logs and traces
 * @returns 
 */
function buildHoneycombOtlpExporters() {
  const headers = {};
  const tracesUrl = resolveOtlpUrl('https://workshop.honeydemo.io/v1/traces')
  const logsUrl = resolveOtlpUrl('https://workshop.honeydemo.io/v1/logs')
  // Embrace wires createOtlpNetworkExportDelegate without merging OTel defaults; without
  // timeoutMillis, transport uses AbortSignal.timeout(undefined) and export throws.
  const timeoutMillis = 10000

  return {
    spanExporters: [
      new OTLPTraceExporter({
        url: tracesUrl,
        headers,
        timeoutMillis,
      }),
    ],
    logExporters: [
      new OTLPLogExporter({
        url: logsUrl,
        headers,
        timeoutMillis,
      }),
    ],
  }
}

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

  const { spanExporters, logExporters } = buildHoneycombOtlpExporters()

  const result = initSDK({
    appID: EMBRACE_APP_ID,
    appVersion: EMBRACE_APP_VERSION,
    dynamicSDKConfigManager: createLocalOnlyDynamicConfigManager(),
    resource: rumResource,
    // propagator: w3cPropagator,
    defaultInstrumentationConfig: {
      '@opentelemetry/instrumentation-fetch': {
        ignoreUrls: [/otlp\/v1\/(traces|logs)/],
      },
      '@opentelemetry/instrumentation-xml-http-request': {
        ignoreUrls: [/otlp\/v1\/(traces|logs)/],
      },
    },
    ...(spanExporters.length ? { spanExporters, logExporters } : {}),
  })

  if (result) {
    console.log('Successfully initialized the Embrace SDK')
    if (spanExporters.length) {
      console.log('Also exporting OTLP traces/logs to Honeycomb (via same-origin proxy when configured)')
    }
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
