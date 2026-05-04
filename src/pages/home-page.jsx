import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppSelector } from '@/store/hooks'

export function HomePage() {
  const user = useAppSelector((state) => state.auth.user)

  return (
    <DashboardLayout title={`Bienvenido, ${user?.name ?? 'Admin'}`} description="">
      <section className="w-full px-0 pb-10 pt-6">
        <Card className="border-white/70 bg-white/80">
          <CardHeader>
            <CardTitle>Bienvenido al panel administrativo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Desde aqui puedes gestionar el contenido del sistema.
            </p>
          </CardContent>
        </Card>
      </section>
    </DashboardLayout>
  )
}

