# Embrace — Online Boutique workshop client

This repo includes two clients for the [microservices-demo](https://github.com/GoogleCloudPlatform/microservices-demo) Online Boutique **frontend** JSON API (`/api/v1/*`) and **`/static`** assets:

1. **`src/`** — **JavaScript** + **React Native Web** + **Vite** app (and optional **Capacitor** shells under `ios/` / `android/`), matching the original SPA under `src/frontend/spa`.
2. **`flutter/`** — **Flutter** app (iOS, Android, web) with the same screens and API behavior. The Dart package name is `online_boutique_flutter`.

See also **`docs/openapi.yaml`** for the JSON routes and request shapes used by both clients.

## What this app does

- **Data:** All catalog, cart, checkout, currency, and ad content comes from `GET`/`POST`/`DELETE` requests to `/api/v1/...` on the Online Boutique **frontend** service, with `Authorization: Bearer <key>`, `X-Session-Id`, and `X-Currency` headers (see the upstream [frontend README](https://github.com/GoogleCloudPlatform/microservices-demo/blob/main/src/frontend/README.md)).
- **Images and logo:** Product pictures and the nav logo are loaded from `/static/...` on the **same** frontend base URL as the API (ordinary HTTP GETs, not JSON). By default the app uses the **current origin**; **`npm run dev`** and **`npm start`** use one **Express** process that serves the UI and **relays** `/api` and `/static` to the boutique upstream (`VITE_FRONTEND_ORIGIN` or `VITE_PROXY_TARGET`, etc.), so the browser does not need CORS to the boutique.

## Prerequisites

- **Vite/React app:** Node.js 20+
- **Flutter app:** [Flutter SDK](https://docs.flutter.dev/get-started/install) (see **`flutter/`** section below)
- A running Online Boutique deployment whose **frontend** service exposes `/api/v1` and `/static`, with `FRONTEND_API_KEY` set.

## Configuration

Copy `.env.example` to `.env` and set:

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_FRONTEND_API_KEY` | Yes | Same secret as `FRONTEND_API_KEY` on the boutique frontend. |
| `VITE_FRONTEND_ORIGIN` | No | **Preferred** boutique base URL: relay target for `/api` and `/static` on the **Express** server (`npm run dev`, `npm start`) and for **`npm run dev:vite`** / **`npm run preview`**. Resolution order: this → `VITE_PROXY_TARGET` → `VITE_DEV_PROXY_TARGET` → `http://127.0.0.1:8080`. If `VITE_RELATIVE_API=false`, it is also baked into the client for direct cross-origin calls. |
| `VITE_PROXY_TARGET` | No | Alternate upstream if `VITE_FRONTEND_ORIGIN` is unset. |
| `VITE_RELATIVE_API` | No | Default (omit or `true`): API/static use the **current origin** (browser → Express/Vite; server relays). Set `false` only for a static deploy that calls the boutique directly (needs CORS). |
| `VITE_ROUTER_BASENAME` | No | Subpath if the app is hosted under a non-root URL (default `""`). |
| `VITE_CHECKOUT_PREFETCH` | No | Enables false checkout routine. Default (`false`) |

## Local development

1. Point the relay at your boutique: either start microservices-demo so the **frontend** listens on `http://127.0.0.1:8080`, or set `VITE_FRONTEND_ORIGIN` or `VITE_PROXY_TARGET` (for example `https://workshop.honeydemo.io`).
2. In this repo:

   ```bash
   npm install
   cp .env.example .env
   # Set VITE_FRONTEND_API_KEY to match FRONTEND_API_KEY
   npm run dev
   ```

**`npm run dev`** runs **Express** + Vite (HMR): one server relays `/api` and `/static` to the upstream. Use **`npm run dev:vite`** for the Vite CLI alone (same proxy rules in `vite.config.js`). **`npm run preview`** uses Vite’s preview server with the same proxy.

Leave `VITE_RELATIVE_API` unset so the browser stays same-origin to your dev server and avoids CORS to the boutique.

## Production build

```bash
npm run build
npm start
```

`npm start` serves `dist/` from Express and relays `/api` and `/static` to the same upstream as development. Use `PORT` to change the listen port (default `3000`).

Alternatively, `npm run preview` serves the build with Vite’s preview server (default port `4173`) and the configured proxy.

For a static deployment **without** Express or a reverse proxy, build with `VITE_RELATIVE_API=false` and `VITE_FRONTEND_ORIGIN` set so the client calls the boutique directly (CORS must allow your app’s origin).

## Flutter app (`flutter/`)

A native **Flutter** implementation lives under **`flutter/`**. It calls the same endpoints as the React app (`/api/v1/products`, cart, checkout, session currency, ads, etc.) and mirrors the main UI flows (home grid, search, cart, product detail, currency dropdown, cart badge).

### Prerequisites

- **[Flutter SDK](https://docs.flutter.dev/get-started/install)** on stable; **`flutter doctor`** clean for your targets.
- The shared boutique **frontend** ( **`/api/v1`**, **`/static`**, **`FRONTEND_API_KEY`** ) as in the top-level **Prerequisites**.

### Configuration

Configuration is loaded from **`flutter/assets/app_config.env`** (bundled as a Flutter asset). You can override values with **`--dart-define=KEY=value`**.

| Variable | Required | Description |
|----------|----------|-------------|
| `FRONTEND_API_KEY` | Yes | Same value as **`FRONTEND_API_KEY`** / **`VITE_FRONTEND_API_KEY`** on the boutique frontend. |
| `FRONTEND_ORIGIN` | **Yes** for iOS/Android | HTTPS base URL of the boutique **frontend** (no trailing slash), e.g. `https://workshop.honeydemo.io`. **Web:** if empty, the app uses **`Uri.base.origin`** (same-tab origin), which is convenient for local `flutter run -d chrome` when your dev server can proxy API/static—otherwise set this to the real boutique URL (CORS must allow your origin). |

The workspace **`.env`** at the repo root is used by the Node/Vite app only; Flutter does not read it unless you copy values into **`flutter/assets/app_config.env`**.

### Run

From **`flutter/`**:

```bash
cd flutter
flutter pub get
flutter run                    # default device
flutter run -d chrome          # web
flutter run -d ios             # iOS simulator (macOS)
flutter run -d android         # Android emulator or device
```

### Web notes

- The official **`embrace`** **Flutter** plugin targets **iOS and Android only**, not **`flutter build web`**. For **browser** telemetry with Embrace, use the **`@embrace-io/web-sdk`** approach (see **`src/components/Instrumentation.jsx`**) in a host page or a parallel web deployment—but the stock **`flutter/web/index.html`** does not bundle that SDK by default.
- Product images on **`flutter run -d chrome`** use an HTML **`<img>`**-based loader so cross-origin static files are not blocked the same way as **`Image.network`** (fetch/CORS). Mobile still uses normal Flutter image loading.

### Embrace (Flutter, mobile)

For **iOS** and **Android**, the Flutter tree includes **Embrace** wiring (app id **`2disg`**, aligned with the React instrumented app):

- **Android:** `flutter/android/app/src/main/embrace-config.json` — set a real **`api_token`** from the Embrace dashboard; **`MyApplication`** starts the native SDK; the **Embrace Gradle** plugin and **`embrace-config.json`** must be valid for release/debug builds you care about.
- **iOS:** `flutter/ios/Runner/AppDelegate.swift` — **`Embrace.setup`** / **`platform: .flutter`**; **`Podfile`** sets **`platform :ios, '13.0'`** for the Embrace pod.
- **Dart:** `Embrace.instance.start` wraps app startup in **`flutter/lib/main.dart`** on non-web platforms; **`GoRouter`** uses **`EmbraceNavigationObserver`** on mobile.

Background the app after testing so sessions can upload. See [Embrace Flutter docs](https://embrace.io/docs/flutter/integration/) for dashboard setup, symbol upload, and upgrades.

## Relationship to `microservices-demo`

This project was extracted from `src/frontend/spa` in [microservices-demo](https://github.com/GoogleCloudPlatform/microservices-demo): same screens, theme, and API usage, without the in-repo Go bootstrap script or Honeycomb browser SDK—so participants can run this repository in isolation against any reachable boutique frontend.

## Mobile apps (iOS and Android)

The **same** Vite/React UI is embedded with [Capacitor](https://capacitorjs.com/) in `ios/` and `android/`. The look and feel match the web app (React Native Web + shared theme).

### Prerequisites

- **All platforms:** Node 20+, `npm install`, configured `.env` (see above).
- **iOS:** macOS, Xcode, CocoaPods (`sudo gem install cocoapods` or via Homebrew). If `pod install` fails with a Unicode / `ASCII-8BIT` error, use a UTF-8 locale (for example `export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8` before `npx cap sync` or `pod install`).
- **Android:** Android Studio, Android SDK, a device or emulator.

### Required env for mobile builds

Native WebViews are not served from your boutique host, so builds **must** bake in a real boutique base URL:

| Variable | Required for mobile | Description |
|----------|---------------------|-------------|
| `VITE_FRONTEND_ORIGIN` | Yes | HTTPS base URL of the Online Boutique **frontend** (same as used for `/api` and `/static`). |
| `VITE_FRONTEND_API_KEY` | Yes | Same as `FRONTEND_API_KEY` on the boutique frontend. |

The boutique must **allow CORS** from your app’s WebView origin (Capacitor typically uses origins such as `capacitor://localhost` on iOS and `https://localhost` on Android). If calls fail with CORS errors, adjust the upstream frontend or proxy.

### Build and run

From this directory:

```bash
npm install
npm run build
npx cap sync
```

Open a native IDE and run on a simulator or device:

```bash
npm run cap:open:ios       # Xcode
npm run cap:open:android   # Android Studio
```

Or in one step after changing web assets:

```bash
npm run build:mobile
```

**Workflow:** edit the React app → `npm run build` (or `build:mobile`) → `npx cap sync` → run from Xcode/Android Studio.

### Regenerating native projects

If `ios/` or `android/` are missing (for example after a clean clone), run:

```bash
npm install
npm run build
npx cap add ios
npx cap add android
npx cap sync
```
