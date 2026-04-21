# Embrace — Online Boutique workshop client

Standalone **JavaScript** + **React Native** (via [react-native-web](https://necolas.github.io/react-native-web/)) + **Vite** app that drives the [microservices-demo](https://github.com/GoogleCloudPlatform/microservices-demo) Online Boutique **only through the public JSON API** (`/api/v1/*`), matching the look and feel of the original SPA under `src/frontend/spa`.

## What this app does

- **Data:** All catalog, cart, checkout, currency, and ad content comes from `GET`/`POST`/`DELETE` requests to `/api/v1/...` on the Online Boutique **frontend** service, with `Authorization: Bearer <key>`, `X-Session-Id`, and `X-Currency` headers (see the upstream [frontend README](https://github.com/GoogleCloudPlatform/microservices-demo/blob/main/src/frontend/README.md)).
- **Images and logo:** Product pictures and the nav logo are loaded from `/static/...` on the **same** frontend base URL as the API (ordinary HTTP GETs, not JSON). By default the app uses the **current origin**; **`npm run dev`** and **`npm start`** use one **Express** process that serves the UI and **relays** `/api` and `/static` to the boutique upstream (`VITE_FRONTEND_ORIGIN` or `VITE_PROXY_TARGET`, etc.), so the browser does not need CORS to the boutique.

## Prerequisites

- Node.js 20+
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

## Relationship to `microservices-demo`

This project was extracted from `src/frontend/spa` in [microservices-demo](https://github.com/GoogleCloudPlatform/microservices-demo): same screens, theme, and API usage, without the in-repo Go bootstrap script, Honeycomb browser SDK, or Capacitor native shells—so participants can run this repository in isolation against any reachable boutique frontend.
