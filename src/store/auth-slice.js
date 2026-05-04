import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getApiBaseUrl } from '@/lib/api-base-url'

const API_BASE_URL = getApiBaseUrl()

async function parseApiResponse(response) {
  const text = await response.text()

  if (!text) {
    return {}
  }

  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}

async function fetchCurrentSession() {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    credentials: 'include',
  })

  return {
    response,
    data: await parseApiResponse(response),
  }
}

export const fetchSession = createAsyncThunk('auth/fetchSession', async (_, { rejectWithValue }) => {
  let response
  let data

  try {
    ;({ response, data } = await fetchCurrentSession())
  } catch {
    return rejectWithValue({
      code: 'NETWORK_ERROR',
      message: 'No se pudo conectar con el API.',
    })
  }

  if (response.ok) {
    return data.user
  }

  if (response.status === 401) {
    let refreshResponse

    try {
      refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch {
      return rejectWithValue({
        code: 'NETWORK_ERROR',
        message: 'No se pudo conectar con el API.',
      })
    }

    if (refreshResponse.ok) {
      try {
        ;({ response, data } = await fetchCurrentSession())
      } catch {
        return rejectWithValue({
          code: 'NETWORK_ERROR',
          message: 'No se pudo conectar con el API.',
        })
      }

      if (response.ok) {
        return data.user
      }
    }

    return rejectWithValue({
      code: data.code ?? 'UNAUTHENTICATED',
      message: 'Unauthenticated',
    })
  }

  return rejectWithValue({
    code: data.code ?? 'SESSION_CHECK_FAILED',
    message: data.message ?? 'No se pudo validar la sesion.',
  })
})

export const signIn = createAsyncThunk(
  'auth/signIn',
  async ({ email, password }, { rejectWithValue }) => {
    if (!email?.trim() || !password?.trim()) {
      return rejectWithValue({
        code: 'VALIDATION_ERROR',
        message: 'Debes completar el formulario.',
      })
    }

    let response

    try {
      response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      })
    } catch {
      return rejectWithValue({
        code: 'NETWORK_ERROR',
        message: 'No se pudo conectar con el API.',
      })
    }

    const data = await parseApiResponse(response)

    if (!response.ok) {
      return rejectWithValue({
        code: data.code ?? 'LOGIN_FAILED',
        message: data.message ?? 'No se pudo iniciar sesion.',
      })
    }

    return data.user
  }
)

export const signOut = createAsyncThunk('auth/signOut', async (_, { rejectWithValue }) => {
  let response

  try {
    response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })
  } catch {
    return rejectWithValue({
      code: 'NETWORK_ERROR',
      message: 'No se pudo conectar con el API.',
    })
  }

  const data = await parseApiResponse(response)

  if (!response.ok) {
    return rejectWithValue({
      code: data.code ?? 'LOGOUT_FAILED',
      message: data.message ?? 'No se pudo cerrar sesion.',
    })
  }

  return null
})

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isCheckingSession: true,
    error: null,
    errorCode: null,
  },
  reducers: {
    clearAuthError(state) {
      state.error = null
      state.errorCode = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSession.pending, (state) => {
        state.isCheckingSession = true
      })
      .addCase(fetchSession.fulfilled, (state, action) => {
        state.user = action.payload
        state.isAuthenticated = true
        state.isCheckingSession = false
        state.error = null
        state.errorCode = null
      })
      .addCase(fetchSession.rejected, (state, action) => {
        state.user = null
        state.isAuthenticated = false
        state.isCheckingSession = false
        state.error = action.payload?.message === 'Unauthenticated' ? null : (action.payload?.message ?? null)
        state.errorCode = action.payload?.message === 'Unauthenticated' ? null : (action.payload?.code ?? null)
      })
      .addCase(signIn.pending, (state) => {
        state.isLoading = true
        state.error = null
        state.errorCode = null
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.user = action.payload
        state.isAuthenticated = true
        state.isLoading = false
        state.error = null
        state.errorCode = null
      })
      .addCase(signIn.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload?.message ?? 'No se pudo iniciar sesion.'
        state.errorCode = action.payload?.code ?? 'LOGIN_FAILED'
      })
      .addCase(signOut.pending, (state) => {
        state.isLoading = true
      })
      .addCase(signOut.fulfilled, (state) => {
        state.user = null
        state.isAuthenticated = false
        state.isLoading = false
        state.error = null
        state.errorCode = null
      })
      .addCase(signOut.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload?.message ?? 'No se pudo cerrar sesion.'
        state.errorCode = action.payload?.code ?? 'LOGOUT_FAILED'
      })
  },
})

export const { clearAuthError } = authSlice.actions
export const authReducer = authSlice.reducer
