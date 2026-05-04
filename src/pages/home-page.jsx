import { ArrowUpRight, CalendarClock, LogOut, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { signOut } from '@/store/auth-slice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

const metrics = [
  { label: 'Sessions today', value: '128', detail: '+14% from yesterday', icon: Users },
  { label: 'Access checks', value: '96%', detail: 'Healthy auth response', icon: ShieldCheck },
  { label: 'Pending tasks', value: '07', detail: 'Modules queued for setup', icon: CalendarClock },
]

const modules = [
  'Login and session validation',
  'User roles and permissions',
  'Reservations and trip management',
  'Activity logs and alerts',
]

export function HomePage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)

  async function handleLogout() {
    await dispatch(signOut())
    navigate('/login', { replace: true })
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_30%),linear-gradient(135deg,_#f8fafc_0%,_#fff7ed_45%,_#eff6ff_100%)] text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 lg:px-10">
        <header className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-white/60 bg-white/70 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-600">
              Viajero Control Center
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Bienvenido, {user?.name ?? 'Administrador'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Esta es la base privada del dashboard. Desde aqui vamos a conectar login,
              roles, modulos y reportes del sistema.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Cuenta activa</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{user?.email}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-2xl border-slate-200 bg-white px-4"
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
              Cerrar sesion
            </Button>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
          <article className="overflow-hidden rounded-[2rem] border border-slate-200/70 bg-slate-950 px-6 py-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
            <div className="flex items-center gap-2 text-amber-300">
              <Sparkles className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.3em]">
                Dashboard base listo
              </span>
            </div>
            <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight">
              Tu area privada ya esta protegida y preparada para crecer modulo por modulo.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
              La navegacion ya distingue entre usuarios autenticados y visitantes. En el
              siguiente paso podemos conectar el formulario al API PHP y reemplazar el acceso
              local por autenticacion real.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {metrics.map(({ label, value, detail, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-[1.6rem] border border-white/10 bg-white/8 p-4 backdrop-blur"
                >
                  <Icon className="size-5 text-amber-300" />
                  <p className="mt-6 text-3xl font-semibold">{value}</p>
                  <p className="mt-2 text-sm text-white">{label}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                    {detail}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <Card className="border-white/70 bg-white/80 backdrop-blur-xl">
            <CardHeader className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
                    Siguientes modulos
                  </p>
                  <CardTitle className="mt-2 text-2xl text-slate-950">Roadmap inicial</CardTitle>
                  <CardDescription className="mt-2 text-slate-500">
                    Base de trabajo para lo que sigue dentro del sistema.
                  </CardDescription>
                </div>
                <div className="rounded-full bg-sky-100 p-3 text-sky-700">
                  <ArrowUpRight className="size-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <Separator className="mb-6 bg-slate-200/80" />
              <div className="space-y-3">
                {modules.map((module, index) => (
                  <div
                    key={module}
                    className="flex items-center gap-4 rounded-[1.4rem] border border-slate-200/80 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex size-10 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                      0{index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{module}</p>
                      <p className="text-sm text-slate-500">Pendiente de implementacion</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
