import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getApiBaseUrl, normalizeAssetPath } from './apiBase'

export const fetchSeccion2Data = createAsyncThunk('seccion2/fetch', async () => {
  const apiBaseUrl = getApiBaseUrl()
  const response = await fetch(`${apiBaseUrl}/seccion2/partners`)
  const data = await response.json()

  if (!response.ok || data?.success === false) {
    throw new Error(data?.message ?? 'No se pudo cargar seccion 2.')
  }

  const items = Array.isArray(data.items) ? data.items : []
  return items.map((item) => ({
    id: item.id_logo,
    image: normalizeAssetPath(apiBaseUrl, item.image_path),
    sort_order: item.sort_order ?? 0,
  }))
})

const initialState = {
  logos: [],
  loading: false,
  error: null,
}

const seccion2Slice = createSlice({
  name: 'seccion2',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSeccion2Data.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSeccion2Data.fulfilled, (state, action) => {
        state.loading = false
        state.logos = action.payload
      })
      .addCase(fetchSeccion2Data.rejected, (state, action) => {
        state.loading = false
        state.error = action.error?.message ?? 'Error al cargar seccion 2.'
        state.logos = []
      })
  },
})

export default seccion2Slice.reducer

