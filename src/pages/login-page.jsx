import { startTransition, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowRight, KeyRound, MapPinned, ShieldCheck, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { clearAuthError, signIn } from '@/store/auth-slice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { isAuthenticated, isLoading, error, errorCode } = useAppSelector((state) => state.auth)
  const [form, setForm] = useState({
    email: '',
    password: '',
  })

  const redirectTo = location.state?.from?.pathname ?? '/'

  async function handleSubmit(event) {
    event.preventDefault()

    try {
      await dispatch(signIn(form)).unwrap()
      startTransition(() => {
        navigate(redirectTo, { replace: true })
      })
    } catch {
      return
    }
  }

  function updateField(field) {
    return (event) => {
      if (error) {
        dispatch(clearAuthError())
      }

      setForm((current) => ({
        ...current,
        [field]: event.target.value,
      }))
    }
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  const errorTone =
    errorCode === 'ACCOUNT_TEMPORARILY_LOCKED' || errorCode === 'REFRESH_TOKEN_REUSED'
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : 'border-red-200 bg-red-50 text-red-600'

  const helperMessage =
    errorCode === 'INVALID_CREDENTIALS'
      ? 'Verifica el correo y la contrasena del usuario.'
      : errorCode === 'ACCOUNT_TEMPORARILY_LOCKED'
        ? 'Espera unos minutos antes de volver a intentarlo.'
        : errorCode === 'ACCOUNT_UNAVAILABLE'
          ? 'Este acceso necesita revision administrativa.'
          : errorCode === 'REFRESH_TOKEN_REUSED'
            ? 'Tu sesion fue cerrada por seguridad. Vuelve a iniciar sesion.'
            : 'La sesion usa cookies seguras HttpOnly y refresh token rotado.'

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f2e8_0%,#f5efe6_100%)] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid w-full gap-0 overflow-hidden rounded-[2rem] shadow-[0_24px_80px_rgba(15,23,42,0.14)] lg:min-h-[720px] lg:grid-cols-2">
          <section className="order-2 border border-slate-900/10 bg-slate-950 text-white lg:order-1 lg:border-r-0">
            <div className="flex h-full flex-col p-5 sm:p-7 lg:p-8">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-300">
                <MapPinned className="size-4" />
                Viajero Dashboard
              </div>

              <div className="mt-5 space-y-3 sm:mt-6">
                <h1 className="max-w-xl text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                  Acceso central para la operacion del sistema.
                </h1>
                <p className="max-w-lg text-sm leading-6 text-slate-300 sm:text-base">
                  Ingreso seguro para administrar el panel interno de ViajeroCR.
                </p>
              </div>

              <div className="mt-6 overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/6">
                <img
                  src="/imagenes/viajerocr2.jpeg"
                  alt="Vista del sistema Viajero CR"
                  className="h-56 w-full object-cover sm:h-72 lg:h-[22rem]"
                />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.4rem] border border-white/10 bg-white/8 p-4">
                  <ShieldCheck className="size-5 text-amber-300" />
                  <p className="mt-3 text-sm font-medium text-white">Acceso protegido</p>
                  <p className="mt-1 text-sm text-slate-300">Sesion segura para el panel.</p>
                </div>
                <div className="rounded-[1.4rem] border border-white/10 bg-white/8 p-4">
                  <UserRound className="size-5 text-amber-300" />
                  <p className="mt-3 text-sm font-medium text-white">Control interno</p>
                  <p className="mt-1 text-sm text-slate-300">Administrar paquetes y mas.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="order-1 flex border border-slate-200/80 bg-white/88 backdrop-blur-xl lg:order-2 lg:border-l-0">
            <Card className="flex w-full rounded-none border-0 bg-transparent shadow-none">
              <CardContent className="flex flex-1 items-center justify-center p-5 sm:p-7 lg:p-8">
                <div className="w-full max-w-md">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
                        Iniciar sesion
                      </p>
                      <CardTitle className="mt-2 text-2xl leading-tight text-slate-950 sm:text-3xl">
                        Panel de administracion
                      </CardTitle>
                      <CardDescription className="mt-2 max-w-md text-sm text-slate-500">
                        Ingresa tus credenciales para continuar.
                      </CardDescription>
                    </div>
                    <div className="rounded-full bg-slate-950 p-3 text-white">
                      <KeyRound className="size-5" />
                    </div>
                  </div>

                  <Separator className="my-6 bg-slate-200/80" />

                  <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="correo@dominio.com"
                      value={form.email}
                      onChange={updateField('email')}
                      className="bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Contrasena</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Ingresa tu contrasena"
                      value={form.password}
                      onChange={updateField('password')}
                      className="bg-white"
                    />
                  </div>

                  {error ? (
                    <div className={`rounded-2xl border px-4 py-3 ${errorTone}`}>
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{error}</p>
                          <p className="mt-1 text-xs opacity-80">{helperMessage}</p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <Button
                    type="submit"
                    className="h-12 w-full rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Entrando...' : 'Entrar al dashboard'}
                    <ArrowRight className="size-4" />
                  </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </main>
  )
}
