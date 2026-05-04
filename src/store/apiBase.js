const LOCAL_API_PATH = '/ViajeroSistem/api'
const PROD_API_BASE = 'https://api.viajerocr.com'

export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    const { hostname } = window.location
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://${hostname}${LOCAL_API_PATH}`
    }
    if (
      hostname === 'dashboard.viajerocr.com'
      || hostname === 'send-form.viajerocr.com'
      || hostname === 'api.viajerocr.com'
      || hostname === 'viajerocr.com'
      || hostname === 'www.viajerocr.com'
    ) {
      return PROD_API_BASE
    }
  }
  return `http://localhost${LOCAL_API_PATH}`
}

export function normalizeAssetPath(apiBaseUrl, path) {
  if (!path) return ''
  if (String(path).startsWith('http')) return path
  return `${apiBaseUrl}${path}`
}

