import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getApiBaseUrl, normalizeAssetPath } from './apiBase'

export const fetchTestimoniosData = createAsyncThunk('testimonios/fetch', async () => {
  const apiBaseUrl = getApiBaseUrl()
  const response = await fetch(`${apiBaseUrl}/testimonios`)
  const data = await response.json()

  if (!response.ok || data?.success === false) {
    throw new Error(data?.message ?? 'No se pudo cargar testimonios.')
  }

  const items = Array.isArray(data.items) ? data.items : []
  const recuerdos = Array.isArray(data.recuerdos) ? data.recuerdos : []
  const slot1 = recuerdos.find((x) => Number(x.slot_no) === 1)
  const slot2 = recuerdos.find((x) => Number(x.slot_no) === 2)

  return {
    title: data?.config?.title ?? 'Testimonios',
    testimonios: items.map((item) => ({
      id: item.id_testimonio,
      destino: item.destino ?? '',
      name: item.author_name ?? '',
      testimonio: item.testimonio ?? '',
      photo: item.photo_path ? normalizeAssetPath(apiBaseUrl, item.photo_path) : '',
      sort_order: item.sort_order ?? 0,
    })),
    recuerdos: [
      slot1?.image_path ? normalizeAssetPath(apiBaseUrl, slot1.image_path) : '/images/testimonio1.PNG',
      slot2?.image_path ? normalizeAssetPath(apiBaseUrl, slot2.image_path) : '/images/testimonio2.PNG',
    ],
  }
})

const initialState = {
  title: 'Testimonios',
  testimonios: [],
  recuerdos: ['/images/testimonio1.PNG', '/images/testimonio2.PNG'],
  loading: false,
  error: null,
}

const testimoniosSlice = createSlice({
  name: 'testimonios',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTestimoniosData.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTestimoniosData.fulfilled, (state, action) => {
        state.loading = false
        state.title = action.payload.title
        state.testimonios = action.payload.testimonios
        state.recuerdos = action.payload.recuerdos
      })
      .addCase(fetchTestimoniosData.rejected, (state, action) => {
        state.loading = false
        state.error = action.error?.message ?? 'Error al cargar testimonios.'
        state.testimonios = []
      })
  },
})

export default testimoniosSlice.reducer

