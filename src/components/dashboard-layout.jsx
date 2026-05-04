import { useState } from 'react'
import { Compass, Handshake, Home, Image, ImagePlus, LogOut, Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { signOut } from '@/store/auth-slice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

const navItems = [
  {
    label: 'Inicio',
    path: '/',
    icon: Home,
  },
  {
    label: 'Seccion 1 (Slider)',
    path: '/seccion1/slider',
    icon: Image,
  },
  {
    label: 'Afiliados',
    path: '/afiliados',
    icon: Handshake,
  },
  {
    label: 'Seccion 2 (Partners)',
    path: '/seccion2/partners',
    icon: Handshake,
  },
  {
    label: 'Seccion 3 (Destinos)',
    path: '/seccion3',
    icon: Compass,
  },
  {
    label: 'Seccion 4 (Servicios)',
    path: '/seccion4/servicios',
    icon: ImagePlus,
  },
]

export function DashboardLayout({ title, description, children }) {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  async function handleLogout() {
    await dispatch(signOut())
    navigate('/login', { replace: true })
  }

  function closeMobileMenu() {
    setIsMobileMenuOpen(false)
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_30%),linear-gradient(135deg,_#f8fafc_0%,_#fff7ed_45%,_#eff6ff_100%)] text-slate-950">
      <div className="flex min-h-screen">
        {isMobileMenuOpen ? (
          <button
            type="button"
            aria-label="Cerrar menu"
            className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
            onClick={closeMobileMenu}
          />
        ) : null}

        <aside
          className={[
            'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/40 bg-slate-950 text-white shadow-[0_20px_60px_rgba(15,23,42,0.3)] transition-all duration-300 lg:static lg:z-auto lg:translate-x-0 lg:shadow-[0_20px_60px_rgba(15,23,42,0.18)]',
            isSidebarOpen ? 'w-[280px]' : 'w-[96px]',
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
            'lg:shrink-0',
          ].join(' ')}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
            <div className={isSidebarOpen ? 'block' : 'hidden'}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-amber-300">
                ViajeroCR
              </p>
              <p className="mt-1 text-sm text-slate-300">Panel administrativo</p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                className="hidden size-10 rounded-2xl text-white hover:bg-white/10 hover:text-white lg:inline-flex"
                onClick={() => setIsSidebarOpen((current) => !current)}
              >
                {isSidebarOpen ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="size-10 rounded-2xl text-white hover:bg-white/10 hover:text-white lg:hidden"
                onClick={closeMobileMenu}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4">
            <div className="space-y-2">
              {navItems.map(({ label, path, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition',
                      isActive
                        ? 'bg-white text-slate-950 shadow-[0_10px_30px_rgba(255,255,255,0.15)]'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white',
                      isSidebarOpen ? 'justify-start' : 'justify-center',
                    ].join(' ')
                  }
                >
                  <Icon className="size-5 shrink-0" />
                  <span className={isSidebarOpen ? 'block' : 'hidden'}>{label}</span>
                </NavLink>
              ))}
            </div>
          </nav>

          <div className="border-t border-white/10 p-3">
            <div
              className={[
                'rounded-[1.5rem] border border-white/10 bg-white/6 p-3',
                isSidebarOpen ? 'block' : 'hidden',
              ].join(' ')}
            >
              <p className="text-xs uppercase tracking-[0.26em] text-slate-400">Cuenta activa</p>
              <p className="mt-2 truncate text-sm font-medium text-white">{user?.email}</p>
            </div>

            <Button
              type="button"
              variant="ghost"
              className={[
                'mt-3 w-full rounded-2xl text-white hover:bg-white/10 hover:text-white',
                isSidebarOpen ? 'justify-start px-3' : 'justify-center px-0',
              ].join(' ')}
              onClick={handleLogout}
            >
              <LogOut className="size-4 shrink-0" />
              <span className={isSidebarOpen ? 'block' : 'hidden'}>Cerrar sesion</span>
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-black/5 bg-white/50 backdrop-blur-xl">
            <div className="flex w-full items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="size-11 rounded-2xl border-white/70 bg-white/80 lg:hidden"
                  onClick={() => setIsMobileMenuOpen(true)}
                >
                  <Menu className="size-5" />
                </Button>

                <div className="hidden overflow-hidden rounded-2xl border border-white/70 bg-white/92 p-2 shadow-sm sm:block">
                  <img
                    src="/imagenes/logo.jpeg"
                    alt="Logo ViajeroCR"
                    className="h-10 w-auto object-contain lg:h-11"
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-600">
                    Viajero Control Center
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                    {title}
                  </h1>
                  {description ? (
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
                  ) : null}
                </div>
              </div>

              <div className="hidden rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-3 text-right md:block">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Cuenta activa</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{user?.email}</p>
              </div>
            </div>
          </header>

          <div className="flex w-full flex-1 flex-col px-4 py-5 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </div>
    </main>
  )
}
