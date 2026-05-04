import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getApiBaseUrl, normalizeAssetPath } from './apiBase'

export const fetchAfiliados = createAsyncThunk('afiliados/fetch', async () => {
  const apiBaseUrl = getApiBaseUrl()
  const response = await fetch(`${apiBaseUrl}/afiliados`)
  const data = await response.json()

  if (!response.ok || data?.success === false) {
    throw new Error(data?.message ?? 'No se pudo cargar Afiliados.')
  }

  const items = Array.isArray(data.items) ? data.items : []
  return {
    title: data.title ?? 'Reserva tus servicios aqui',
    logos: items.map((item) => ({
      id: item.id_logo,
      image: normalizeAssetPath(apiBaseUrl, item.image_path),
      url: item.url ?? '#',
      sort_order: item.sort_order ?? 0,
    })),
  }
})

const initialState = {
  title: 'Reserva tus servicios aqui',
  logos: [],
  loading: false,
  error: null,
}

const afiliadosSlice = createSlice({
  name: 'afiliados',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAfiliados.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAfiliados.fulfilled, (state, action) => {
        state.loading = false
        state.title = action.payload.title
        state.logos = action.payload.logos
      })
      .addCase(fetchAfiliados.rejected, (state, action) => {
        state.loading = false
        state.error = action.error?.message ?? 'Error al cargar afiliados.'
        state.logos = []
      })
  },
})

export default afiliadosSlice.reducer

