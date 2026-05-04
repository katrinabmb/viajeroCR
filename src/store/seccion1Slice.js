import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getApiBaseUrl, normalizeAssetPath } from './apiBase'

export const fetchSeccion1Slides = createAsyncThunk('seccion1/fetchSlides', async () => {
  const apiBaseUrl = getApiBaseUrl()
  const response = await fetch(`${apiBaseUrl}/seccion1/slides`)
  const data = await response.json()

  if (!response.ok || data?.success === false) {
    throw new Error(data?.message ?? 'No se pudieron cargar los slides.')
  }

  const items = Array.isArray(data.items) ? data.items : []
  return items.map((item) => ({
    id: item.id_slide,
    image: normalizeAssetPath(apiBaseUrl, item.image_path),
    title: item.title ?? '',
    subtitle: item.subtitle ?? '',
    sort_order: item.sort_order ?? 0,
  }))
})

const initialState = {
  slides: [],
  loading: false,
  error: null,
}

const seccion1Slice = createSlice({
  name: 'seccion1',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSeccion1Slides.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSeccion1Slides.fulfilled, (state, action) => {
        state.loading = false
        state.slides = action.payload
      })
      .addCase(fetchSeccion1Slides.rejected, (state, action) => {
        state.loading = false
        state.error = action.error?.message ?? 'Error al cargar slides.'
        state.slides = []
      })
  },
})

export default seccion1Slice.reducer
