import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getApiBaseUrl, normalizeAssetPath } from './apiBase'

export const fetchSeccion3Data = createAsyncThunk('seccion3/fetch', async () => {
  const apiBaseUrl = getApiBaseUrl()
  const response = await fetch(`${apiBaseUrl}/seccion3`)
  const data = await response.json()

  if (!response.ok || data?.success === false) {
    throw new Error(data?.message ?? 'No se pudo cargar seccion 3.')
  }

  const continents = Array.isArray(data.continents) ? data.continents : []
  return {
    title: data.title ?? 'Destinos',
    continents: continents.map((continent) => ({
      id: continent.id_continent,
      image: normalizeAssetPath(apiBaseUrl, continent.image_path),
      title: continent.title ?? '',
      sort_order: continent.sort_order ?? 0,
      destinations: (Array.isArray(continent.destinations) ? continent.destinations : []).map((destination) => ({
        id: destination.id_destination,
        image: normalizeAssetPath(apiBaseUrl, destination.image_path),
        title: destination.title ?? '',
        sort_order: destination.sort_order ?? 0,
      })),
    })),
  }
})

const initialState = {
  title: 'Destinos',
  continents: [],
  loading: false,
  error: null,
}

const seccion3Slice = createSlice({
  name: 'seccion3',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSeccion3Data.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSeccion3Data.fulfilled, (state, action) => {
        state.loading = false
        state.title = action.payload.title
        state.continents = action.payload.continents
      })
      .addCase(fetchSeccion3Data.rejected, (state, action) => {
        state.loading = false
        state.error = action.error?.message ?? 'Error al cargar seccion 3.'
        state.continents = []
      })
  },
})

export default seccion3Slice.reducer

