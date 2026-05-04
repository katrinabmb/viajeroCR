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

function normalizePhone(rawValue) {
  return String(rawValue ?? '').replace(/\D/g, '')
}

export function WhatsappPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [banner, setBanner] = useState(null)
  const [form, setForm] = useState({
    phone: '50683429727',
    default_message: '',
  })

  const headerDescription = useMemo(
    () => 'Configuracion de WhatsApp: numero de destino y mensaje opcional por defecto.',
    []
  )

  const previewLink = useMemo(() => {
    const phone = normalizePhone(form.phone)
    if (!phone) return '#'
    const message = (form.default_message ?? '').trim()
    return message
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/${phone}`
  }, [form.default_message, form.phone])

  function showBanner(type, message) {
    setBanner({ type, message })
    window.clearTimeout(showBanner._t)
    showBanner._t = window.setTimeout(() => setBanner(null), 3500)
  }

  async function load() {
    setIsLoading(true)
    setError(null)
    try {
      const data = await apiFetch('/whatsapp')
      const item = data.item ?? null
      if (item) {
        setForm({
          phone: item.phone ?? '',
          default_message: item.default_message ?? '',
        })
      }
    } catch (err) {
      setError(err?.message ?? 'No se pudo cargar WhatsApp.')
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
    const phone = normalizePhone(form.phone)
    if (!phone) {
      const m = 'Ingresa un numero valido.'
      setError(m)
      showBanner('error', m)
      await toastError(m)
      return
    }

    try {
      await apiFetch('/admin/whatsapp/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          default_message: form.default_message.trim(),
        }),
      })
      await load()
      showBanner('success', 'WhatsApp actualizado.')
      await toastSuccess('WhatsApp actualizado.')
    } catch (err) {
      const m = err?.message ?? 'No se pudo guardar WhatsApp.'
      setError(m)
      showBanner('error', m)
      await toastError(m)
    }
  }

  return (
    <DashboardLayout title="WhatsApp" description={headerDescription}>
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
                <CardTitle className="text-2xl">Configuracion WhatsApp</CardTitle>
                <CardDescription className="mt-2">
                  Define el numero y un mensaje opcional para el boton de contacto.
                </CardDescription>
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

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Numero (solo digitos, con codigo pais)</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))}
                  placeholder="50683429727"
                />
              </div>
              <div className="space-y-2">
                <Label>Mensaje por defecto (opcional)</Label>
                <textarea
                  value={form.default_message}
                  onChange={(e) => setForm((c) => ({ ...c, default_message: e.target.value }))}
                  className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-slate-200 focus:ring-2"
                  placeholder="Hola, quiero mas informacion sobre los paquetes de viaje."
                />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                Vista previa:{' '}
                <a className="font-medium text-sky-700 underline" href={previewLink} target="_blank" rel="noreferrer">
                  {previewLink}
                </a>
              </div>
            </div>

            <Button className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" onClick={save}>
              Guardar WhatsApp
            </Button>
          </CardContent>
        </Card>
      </section>
    </DashboardLayout>
  )
}

