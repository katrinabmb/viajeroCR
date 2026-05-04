import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getApiBaseUrl, normalizeAssetPath } from './apiBase'

const fallback = {
  title: 'Acerca de VIAJERO CR',
  image: '/images/viajerocr2.jpeg',
  paragraph_1: 'ViajeroCR nace de una pasion autentica por descubrir el mundo y de la experiencia personal de Edgar Leiva, quien durante mas de 15 anos ha recorrido mas de 80 paises y una gran diversidad de ciudades y pueblos. Cada destino ha sido una fuente de aprendizaje y cada viaje una experiencia que hoy se transforma en asesoria cercana, honesta y estrategica para quienes confian en este proyecto.',
  paragraph_2: 'En ViajeroCR cada viaje se disena como si fuera propio. Mas alla de reservar vuelos, trenes y hoteles, el enfoque esta en comprender lo que cada viajero suena vivir y convertirlo en una experiencia bien planificada, segura y memorable. Con conocimiento directo de los destinos, atencion personalizada y cuidado en cada detalle, el objetivo es que cada cliente viaje con confianza, ilusion y respaldo en todo momento, porque viajar no es solo trasladarse, es cumplir suenos con proposito.',
}

export const fetchAcercadeData = createAsyncThunk('acercade/fetch', async () => {
  const apiBaseUrl = getApiBaseUrl()
  const response = await fetch(`${apiBaseUrl}/acercade`)
  const data = await response.json()

  if (!response.ok || data?.success === false) {
    throw new Error(data?.message ?? 'No se pudo cargar Acerca de.')
  }

  const item = data.item ?? {}
  return {
    title: item.title ?? fallback.title,
    image: item.image_path ? normalizeAssetPath(apiBaseUrl, item.image_path) : fallback.image,
    paragraph_1: item.paragraph_1 ?? fallback.paragraph_1,
    paragraph_2: item.paragraph_2 ?? fallback.paragraph_2,
  }
})

const initialState = {
  ...fallback,
  loading: false,
  error: null,
}

const acercadeSlice = createSlice({
  name: 'acercade',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAcercadeData.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAcercadeData.fulfilled, (state, action) => {
        state.loading = false
        state.title = action.payload.title
        state.image = action.payload.image
        state.paragraph_1 = action.payload.paragraph_1
        state.paragraph_2 = action.payload.paragraph_2
      })
      .addCase(fetchAcercadeData.rejected, (state, action) => {
        state.loading = false
        state.error = action.error?.message ?? 'Error al cargar Acerca de.'
      })
  },
})

export default acercadeSlice.reducer

