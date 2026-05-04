import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getApiBaseUrl } from './apiBase'

const fallback = {
  brand_name: 'Viajero CR',
  rights_text: 'Todos los derechos reservados',
  phone: '+506 83429727',
  email: 'info@viajerocr.com',
  address_line: 'PLAZA FUTURA, LINDORA, SANTA ANA, COSTA RICA',
}

export const fetchFooterData = createAsyncThunk('footer/fetch', async () => {
  const apiBaseUrl = getApiBaseUrl()
  const response = await fetch(`${apiBaseUrl}/footer`)
  const data = await response.json()

  if (!response.ok || data?.success === false) {
    throw new Error(data?.message ?? 'No se pudo cargar footer.')
  }

  const item = data.item ?? {}
  return {
    brand_name: item.brand_name ?? fallback.brand_name,
    rights_text: item.rights_text ?? fallback.rights_text,
    phone: item.phone ?? fallback.phone,
    email: item.email ?? fallback.email,
    address_line: item.address_line ?? fallback.address_line,
  }
})

const footerSlice = createSlice({
  name: 'footer',
  initialState: { ...fallback, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFooterData.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchFooterData.fulfilled, (state, action) => {
        state.loading = false
        Object.assign(state, action.payload)
      })
      .addCase(fetchFooterData.rejected, (state, action) => {
        state.loading = false
        state.error = action.error?.message ?? 'Error al cargar footer.'
      })
  },
})

export default footerSlice.reducer

