import { getApiBaseUrl } from '@/lib/api-base-url'

const API_BASE_URL = getApiBaseUrl()

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
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
    return response.ok
  } catch {
    return false
  }
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
  if (response.status === 401) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      ;({ response, data } = await doFetch())
    }
  }

  if (!response.ok) {
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

  if (response.status === 401) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      return uploadTemp(path, file)
    }
  }

  if (!response.ok) {
    throw new Error(data?.message ?? 'No se pudo subir la imagen.')
  }

  return data
}

export function getApiBase() {
  return API_BASE_URL
}

