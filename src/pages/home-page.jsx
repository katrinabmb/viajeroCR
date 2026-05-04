import {
  ArrowUpRight,
  Compass,
  Globe2,
  LayoutTemplate,
  Mail,
  MessageSquareMore,
  Plane,
  Route,
  Star,
  Users,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAppSelector } from '@/store/hooks'

const overviewCards = [
  {
    title: 'Frontend actual',
    description: 'Landing publica con enfoque comercial para captar clientes y solicitudes de viaje.',
    icon: LayoutTemplate,
  },
  {
    title: 'Canal principal',
    description: 'Formulario web conectado a envio de correo para consultas y cotizaciones.',
    icon: Mail,
  },
  {
    title: 'Experiencia de marca',
    description: 'Sitio orientado a destinos, servicios, testimonios, aliados y salidas grupales.',
    icon: Star,
  },
]

const publicSections = [
  {
    title: 'Destinos',
    description: 'Catalogo visual por continentes: America, Europa, Africa y Asia/Oceania.',
    icon: Globe2,
    hint: 'Contenido visual',
  },
  {
    title: 'Servicios',
    description: 'Paquetes a la medida, boletos, hoteles, tours, seguros, eventos y asesoria.',
    icon: Plane,
    hint: 'Oferta comercial',
  },
  {
    title: 'Salidas grupales',
    description: 'Viajes programados con itinerarios descargables y fechas visibles para venta.',
    icon: Route,
    hint: 'Calendario de viajes',
  },
  {
    title: 'Aliados y reservas',
    description: 'Integracion comercial con Booking, Klook, TripAdvisor, Holafly y mas.',
    icon: Compass,
    hint: 'Canales externos',
  },
  {
    title: 'Solicitudes',
    description: 'Consultas recibidas desde el formulario web para cotizacion y seguimiento.',
    icon: MessageSquareMore,
    hint: 'Leads del sitio',
  },
]

const adminPriorities = [
  'Administrar paquetes, servicios y salidas grupales desde panel interno.',
  'Centralizar solicitudes del formulario y seguimiento comercial.',
  'Gestionar contenido del home: destinos, aliados, testimonios y secciones.',
  'Preparar modulos de usuarios, permisos y reportes operativos.',
]

export function HomePage() {
  const user = useAppSelector((state) => state.auth.user)

  return (
    <DashboardLayout
      title={`Bienvenido, ${user?.name ?? 'Admin'}`}
      description=""
    >
      <section className="grid gap-4 2xl:grid-cols-[1.1fr_0.9fr]">
        <article className="overflow-hidden rounded-[2rem] border border-slate-200/70 bg-slate-950 p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-300">
              <span className="text-xs font-semibold uppercase tracking-[0.3em]">
                Resumen del sistema actual
              </span>
            </div>
            <div className="rounded-full bg-white/10 p-3 text-amber-300">
              <ArrowUpRight className="size-4" />
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div>
              <h2 className="max-w-3xl text-3xl font-semibold tracking-tight">
                Plataforma comercial enfocada en captar solicitudes y convertir interes en viajes.
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
                El sitio publico funciona como vitrina de destinos, servicios, salidas grupales,
                aliados y testimonios. El punto de conversion principal es el formulario de
                contacto, desde donde llegan las solicitudes para cotizacion.
              </p>
            </div>

            <div className="rounded-[1.6rem] border border-white/10 bg-white/8 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
                Estado del negocio digital
              </p>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3">
                  <p className="text-sm font-medium text-white">Frontend publico activo</p>
                  <p className="mt-1 text-sm text-slate-300">Landing comercial y captacion de leads.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3">
                  <p className="text-sm font-medium text-white">Formulario como canal principal</p>
                  <p className="mt-1 text-sm text-slate-300">Solicitudes enviadas para atencion personalizada.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3">
                  <p className="text-sm font-medium text-white">Dashboard en construccion</p>
                  <p className="mt-1 text-sm text-slate-300">Base lista para administracion interna.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {overviewCards.map(({ title, description, icon: Icon }) => (
              <div
                key={title}
                className="rounded-[1.6rem] border border-white/10 bg-white/8 p-4 backdrop-blur"
              >
                <Icon className="size-5 text-amber-300" />
                <p className="mt-5 text-lg font-semibold text-white">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
              </div>
            ))}
          </div>
        </article>

        <Card className="border-white/70 bg-white/80 backdrop-blur-xl">
          <CardHeader className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
              Primera etapa
            </p>
            <CardTitle className="mt-2 text-2xl text-slate-950">Prioridades del dashboard</CardTitle>
            <CardDescription className="mt-2 text-slate-500">
              Lo siguiente que conviene construir dentro del panel.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <Separator className="mb-6 bg-slate-200/80" />
            <div className="space-y-3">
              {adminPriorities.map((item, index) => (
                <div
                  key={item}
                  className="flex items-start gap-4 rounded-[1.4rem] border border-slate-200/80 bg-slate-50 px-4 py-4"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                    0{index + 1}
                  </div>
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
              Modulos base
            </p>
            <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              Areas que este panel va a administrar
            </h3>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {publicSections.map(({ title, description, icon: Icon, hint }) => (
            <Card
              key={title}
              className="border-white/70 bg-white/82 transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_24px_60px_rgba(59,130,246,0.12)] backdrop-blur-xl"
            >
            <CardHeader className="p-5">
              <div className="flex items-center justify-between">
                <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                  <Icon className="size-5" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {hint}
                </span>
              </div>
              <CardTitle className="pt-4 text-xl text-slate-950">{title}</CardTitle>
              <CardDescription className="text-sm leading-6 text-slate-500">
                {description}
              </CardDescription>
            </CardHeader>
          </Card>
          ))}
        </div>
      </section>
    </DashboardLayout>
  )
}
