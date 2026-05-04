import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getApiBaseUrl, normalizeAssetPath } from './apiBase'

export const fetchSeccion5Data = createAsyncThunk('seccion5/fetch', async () => {
  const apiBaseUrl = getApiBaseUrl()
  const response = await fetch(`${apiBaseUrl}/seccion5/salidas`)
  const data = await response.json()

  if (!response.ok || data?.success === false) {
    throw new Error(data?.message ?? 'No se pudo cargar seccion 5.')
  }

  const items = Array.isArray(data.items) ? data.items : []
  return {
    title: data.title ?? 'Salidas Grupales',
    salidas: items.map((item) => ({
      id: item.id_salida,
      title: item.title ?? '',
      description: item.description ?? '',
      fechas: item.fechas ?? '',
      precio: item.precio ?? '',
      image: normalizeAssetPath(apiBaseUrl, item.image_path),
      itinerario: normalizeAssetPath(apiBaseUrl, item.itinerario_path),
      sort_order: item.sort_order ?? 0,
    })),
  }
})

const initialState = {
  title: 'Salidas Grupales',
  salidas: [],
  loading: false,
  error: null,
}

const seccion5Slice = createSlice({
  name: 'seccion5',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSeccion5Data.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSeccion5Data.fulfilled, (state, action) => {
        state.loading = false
        state.title = action.payload.title
        state.salidas = action.payload.salidas
      })
      .addCase(fetchSeccion5Data.rejected, (state, action) => {
        state.loading = false
        state.error = action.error?.message ?? 'Error al cargar seccion 5.'
        state.salidas = []
      })
  },
})

export default seccion5Slice.reducer

