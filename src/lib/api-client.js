import { getApiBaseUrl } from '@/lib/api-base-url'

const API_BASE_URL = getApiBaseUrl()
let refreshPromise = null

function redirectToLoginIfNeeded() {
  if (typeof window === 'undefined') return
  if (window.location.pathname === '/login') return
  window.location.href = '/login'
}

async function parseJson(response) {
  const text = await response.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}

async function tryRefresh() {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
      return response.ok
    } catch {
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export async function apiFetch(path, init = {}) {
  const doFetch = async () => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: 'include',
      ...init,
    })
    return { response, data: await parseJson(response) }
  }

  let { response, data } = await doFetch()

  // If access token expired, refresh once and retry.
  if (response.status === 401 && !path.startsWith('/auth/')) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      ;({ response, data } = await doFetch())
    } else {
      redirectToLoginIfNeeded()
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      redirectToLoginIfNeeded()
    }
    const message = data?.message ?? 'Error en la solicitud.'
    const code = data?.code ?? 'REQUEST_FAILED'
    const error = new Error(message)
    error.code = code
    error.status = response.status
    throw error
  }

  return data
}

export async function uploadTemp(path, file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })

  const data = await parseJson(response)

  if (response.status === 401 && !path.startsWith('/auth/')) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      return uploadTemp(path, file)
    } else {
      redirectToLoginIfNeeded()
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      redirectToLoginIfNeeded()
    }
    throw new Error(data?.message ?? 'No se pudo subir la imagen.')
  }

  return data
}

export function getApiBase() {
  return API_BASE_URL
}
