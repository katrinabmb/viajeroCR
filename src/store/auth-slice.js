import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost/ViajeroSistem/api'

export const fetchSession = createAsyncThunk('auth/fetchSession', async (_, { rejectWithValue }) => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    credentials: 'include',
  })

  if (response.status === 401) {
    return rejectWithValue('Unauthenticated')
  }

  if (!response.ok) {
    return rejectWithValue('No se pudo validar la sesion.')
  }

  const data = await response.json()
  return data.user
})

export const signIn = createAsyncThunk(
  'auth/signIn',
  async ({ email, password }, { rejectWithValue }) => {
    if (!email?.trim() || !password?.trim()) {
      return rejectWithValue('Debes completar el formulario.')
    }

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
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

    const data = await response.json()

    if (!response.ok) {
      return rejectWithValue(data.message ?? 'No se pudo iniciar sesion.')
    }

    return data.user
  }
)
export const signOut = createAsyncThunk('auth/signOut', async (_, { rejectWithValue }) => {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })

  if (!response.ok) {
    return rejectWithValue('No se pudo cerrar sesion.')
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
  },
  reducers: {
    clearAuthError(state) {
      state.error = null
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
      })
      .addCase(fetchSession.rejected, (state, action) => {
        state.user = null
        state.isAuthenticated = false
        state.isCheckingSession = false
        state.error = action.payload === 'Unauthenticated' ? null : action.payload
      })
      .addCase(signIn.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.user = action.payload
        state.isAuthenticated = true
        state.isLoading = false
        state.error = null
      })
      .addCase(signIn.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload ?? 'No se pudo iniciar sesion.'
      })
      .addCase(signOut.pending, (state) => {
        state.isLoading = true
      })
      .addCase(signOut.fulfilled, (state) => {
        state.user = null
        state.isAuthenticated = false
        state.isLoading = false
        state.error = null
      })
      .addCase(signOut.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload ?? 'No se pudo cerrar sesion.'
      })
  },
})

export const { clearAuthError } = authSlice.actions
export const authReducer = authSlice.reducer
