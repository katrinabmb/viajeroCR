import { configureStore } from '@reduxjs/toolkit'
import seccion1Reducer from './seccion1Slice'
import afiliadosReducer from './afiliadosSlice'
import seccion3Reducer from './seccion3Slice'
import seccion4Reducer from './seccion4Slice'
import seccion2Reducer from './seccion2Slice'
import seccion5Reducer from './seccion5Slice'
import acercadeReducer from './acercadeSlice'
import testimoniosReducer from './testimoniosSlice'
import footerReducer from './footerSlice'

export const store = configureStore({
  reducer: {
    seccion1: seccion1Reducer,
    afiliados: afiliadosReducer,
    seccion3: seccion3Reducer,
    seccion4: seccion4Reducer,
    seccion2: seccion2Reducer,
    seccion5: seccion5Reducer,
    acercade: acercadeReducer,
    testimonios: testimoniosReducer,
    footer: footerReducer,
  },
})
