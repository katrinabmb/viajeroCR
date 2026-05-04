import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/protected-route'
import { AfiliadosPage } from '@/pages/afiliados-page'
import { HomePage } from '@/pages/home-page'
import { LoginPage } from '@/pages/login-page'
import { Seccion2PartnersPage } from '@/pages/seccion2-partners-page'
import { Seccion1SliderPage } from '@/pages/seccion1-slider-page'
import { Seccion3DestinosPage } from '@/pages/seccion3-destinos-page'
import { Seccion4ServiciosPage } from '@/pages/seccion4-servicios-page'
import { Seccion5SalidasPage } from '@/pages/seccion5-salidas-page'
import { AcercadePage } from '@/pages/acercade-page'
import { fetchSession } from '@/store/auth-slice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

function App() {
  const dispatch = useAppDispatch()
  const isCheckingSession = useAppSelector((state) => state.auth.isCheckingSession)

  useEffect(() => {
    dispatch(fetchSession())
  }, [dispatch])

  if (isCheckingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4efe6] px-6 text-slate-950">
        <div className="rounded-[2rem] border border-black/10 bg-white/80 px-8 py-6 text-sm shadow-[0_24px_90px_rgba(148,163,184,0.16)] backdrop-blur-xl">
          Verificando sesion segura...
        </div>
      </main>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seccion1/slider"
        element={
          <ProtectedRoute>
            <Seccion1SliderPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seccion2/partners"
        element={
          <ProtectedRoute>
            <Seccion2PartnersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/afiliados"
        element={
          <ProtectedRoute>
            <AfiliadosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seccion3"
        element={
          <ProtectedRoute>
            <Seccion3DestinosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seccion4/servicios"
        element={
          <ProtectedRoute>
            <Seccion4ServiciosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seccion5/salidas"
        element={
          <ProtectedRoute>
            <Seccion5SalidasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/acercade"
        element={
          <ProtectedRoute>
            <AcercadePage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
