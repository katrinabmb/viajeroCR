const LOCAL_API_PATH = '/ViajeroSistem/api'
const PRODUCTION_API_URL = 'https://api.viajerocr.com'

export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    const { hostname } = window.location

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Keep host consistent so cookies match (localhost vs 127.0.0.1 are different sites).
      return `http://${hostname}${LOCAL_API_PATH}`
    }

    if (
      hostname === 'dashboard.viajerocr.com'
      || hostname === 'send-form.viajerocr.com'
      || hostname === 'api.viajerocr.com'
    ) {
      return PRODUCTION_API_URL
    }
  }

  return import.meta.env.VITE_API_BASE_URL ?? `http://localhost${LOCAL_API_PATH}`
}
