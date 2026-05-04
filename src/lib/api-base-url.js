const LOCAL_API_URL = 'http://localhost/ViajeroSistem/api'
const PRODUCTION_API_URL = 'https://api.viajerocr.com'

export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    const { hostname } = window.location

    if (
      hostname === 'dashboard.viajerocr.com'
      || hostname === 'send-form.viajerocr.com'
      || hostname === 'api.viajerocr.com'
    ) {
      return PRODUCTION_API_URL
    }
  }

  return import.meta.env.VITE_API_BASE_URL ?? LOCAL_API_URL
}
