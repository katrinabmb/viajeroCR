import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getApiBaseUrl, normalizeAssetPath } from './apiBase'

export const fetchSeccion4Data = createAsyncThunk('seccion4/fetch', async () => {
  const apiBaseUrl = getApiBaseUrl()
  const response = await fetch(`${apiBaseUrl}/seccion4/servicios`)
  const data = await response.json()

  if (!response.ok || data?.success === false) {
    throw new Error(data?.message ?? 'No se pudo cargar seccion 4.')
  }

  const items = Array.isArray(data.items) ? data.items : []
  return {
    title: data.title ?? 'Servicios',
    services: items.map((item) => ({
      id: item.id_service,
      title: item.title ?? '',
      title2: item.title2 ?? '',
      description: item.description ?? '',
      image: normalizeAssetPath(apiBaseUrl, item.image_path),
      sort_order: item.sort_order ?? 0,
    })),
  }
})

const initialState = {
  title: 'Servicios',
  services: [],
  loading: false,
  error: null,
}

const seccion4Slice = createSlice({
  name: 'seccion4',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSeccion4Data.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSeccion4Data.fulfilled, (state, action) => {
        state.loading = false
        state.title = action.payload.title
        state.services = action.payload.services
      })
      .addCase(fetchSeccion4Data.rejected, (state, action) => {
        state.loading = false
        state.error = action.error?.message ?? 'Error al cargar seccion 4.'
        state.services = []
      })
  },
})

export default seccion4Slice.reducer

