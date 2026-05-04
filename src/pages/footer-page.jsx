import { useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { apiFetch } from '@/lib/api-client'
import { toastError, toastSuccess } from '@/lib/swal'

export function FooterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [banner, setBanner] = useState(null)
  const [form, setForm] = useState({
    brand_name: 'Viajero CR',
    rights_text: 'Todos los derechos reservados',
    phone: '+506 83429727',
    email: 'info@viajerocr.com',
    address_line: 'PLAZA FUTURA, LINDORA, SANTA ANA, COSTA RICA',
  })

  const headerDescription = useMemo(
    () => 'Edicion administrativa del footer: marca, derechos, telefono, correo y direccion.',
    []
  )

  function showBanner(type, message) {
    setBanner({ type, message })
    window.clearTimeout(showBanner._t)
    showBanner._t = window.setTimeout(() => setBanner(null), 3500)
  }

  async function load() {
    setIsLoading(true)
    setError(null)
    try {
      const data = await apiFetch('/footer')
      const item = data.item ?? null
      if (item) {
        setForm({
          brand_name: item.brand_name ?? '',
          rights_text: item.rights_text ?? '',
          phone: item.phone ?? '',
          email: item.email ?? '',
          address_line: item.address_line ?? '',
        })
      }
    } catch (err) {
      setError(err?.message ?? 'No se pudo cargar footer.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function save() {
    setError(null)
    if (!form.brand_name.trim() || !form.rights_text.trim() || !form.phone.trim() || !form.email.trim() || !form.address_line.trim()) {
      const m = 'Completa todos los campos.'
      setError(m)
      showBanner('error', m)
      await toastError(m)
      return
    }

    try {
      await apiFetch('/admin/footer/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_name: form.brand_name.trim(),
          rights_text: form.rights_text.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          address_line: form.address_line.trim(),
        }),
      })
      await load()
      showBanner('success', 'Footer actualizado.')
      await toastSuccess('Footer actualizado.')
    } catch (err) {
      const m = err?.message ?? 'No se pudo guardar footer.'
      setError(m)
      showBanner('error', m)
      await toastError(m)
    }
  }

  return (
    <DashboardLayout title="Footer" description={headerDescription}>
      {banner ? (
        <div
          className={[
            'sticky top-3 z-40 mb-4 w-full rounded-2xl border px-4 py-3 text-sm',
            banner.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800',
          ].join(' ')}
        >
          {banner.message}
        </div>
      ) : null}

      <section className="w-full space-y-6 px-0 pb-10 pt-6">
        <Card className="border-white/70 bg-white/80 backdrop-blur-xl">
          <CardHeader className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-2xl">Contenido Footer</CardTitle>
                <CardDescription className="mt-2">Configura solo los datos principales solicitados.</CardDescription>
              </div>
              <Button variant="outline" className="rounded-2xl" onClick={load} disabled={isLoading}>
                <RefreshCw className="mr-2 size-4" />
                Actualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-6 pt-0">
            <Separator className="bg-slate-200/80" />
            {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label>Marca</Label>
                <Input value={form.brand_name} onChange={(e) => setForm((c) => ({ ...c, brand_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Texto de derechos</Label>
                <Input value={form.rights_text} onChange={(e) => setForm((c) => ({ ...c, rights_text: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Telefono</Label>
                <Input value={form.phone} onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Correo</Label>
                <Input value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} />
              </div>
              <div className="space-y-2 lg:col-span-2">
                <Label>Direccion</Label>
                <Input value={form.address_line} onChange={(e) => setForm((c) => ({ ...c, address_line: e.target.value }))} />
              </div>
            </div>

            <Button className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" onClick={save}>
              Guardar footer
            </Button>
          </CardContent>
        </Card>
      </section>
    </DashboardLayout>
  )
}
