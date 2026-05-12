import { resolveFrontendPath } from './frontendOrigin'

/** Resolve catalog image paths for the current frontend origin. */
export function assetUrl(path) {
  if (path.startsWith('http')) {
    return path
  }
  if (typeof window === 'undefined') {
    return path
  }
  return resolveFrontendPath(path)
}
