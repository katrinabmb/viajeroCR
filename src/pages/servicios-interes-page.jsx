import { useEffect, useMemo, useState } from 'react'
import { Pencil, PlusCircle, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { apiFetch } from '@/lib/api-client'
import { toastError, toastSuccess } from '@/lib/swal'

export function ServiciosInteresPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [banner, setBanner] = useState(null)
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ id_servicio_interes: null, nombre: '' })

  const headerDescription = useMemo(
    () => 'Catalogo para administrar los servicios de interes del formulario: agregar, editar e inactivar.',
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
      const data = await apiFetch('/admin/servicios-interes')
      setItems(data.items ?? [])
    } catch (err) {
      setError(err?.message ?? 'No se pudo cargar la lista.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function startEdit(row) {
    setForm({
      id_servicio_interes: row.id_servicio_interes,
      nombre: row.nombre ?? '',
    })
  }

  function resetForm() {
    setForm({ id_servicio_interes: null, nombre: '' })
  }

  async function save() {
    const nombre = form.nombre.trim()
    if (!nombre) {
      const m = 'Debes ingresar el nombre del servicio.'
      setError(m)
      showBanner('error', m)
      await toastError(m)
      return
    }

    try {
      if (form.id_servicio_interes) {
        await apiFetch('/admin/servicios-interes/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_servicio_interes: form.id_servicio_interes,
            nombre,
          }),
        })
        showBanner('success', 'Servicio actualizado.')
        await toastSuccess('Servicio actualizado.')
      } else {
        await apiFetch('/admin/servicios-interes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre }),
        })
        showBanner('success', 'Servicio agregado.')
        await toastSuccess('Servicio agregado.')
      }
      resetForm()
      await load()
    } catch (err) {
      const m = err?.message ?? 'No se pudo guardar.'
      setError(m)
      showBanner('error', m)
      await toastError(m)
    }
  }

  async function toggleActive(row) {
    try {
      await apiFetch('/admin/servicios-interes/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_servicio_interes: row.id_servicio_interes,
          is_active: row.is_active ? 0 : 1,
        }),
      })
      await load()
      showBanner('success', row.is_active ? 'Servicio inactivado.' : 'Servicio activado.')
      await toastSuccess(row.is_active ? 'Servicio inactivado.' : 'Servicio activado.')
    } catch (err) {
      const m = err?.message ?? 'No se pudo cambiar estado.'
      setError(m)
      showBanner('error', m)
      await toastError(m)
    }
  }

  return (
    <DashboardLayout title="Servicios de interes" description={headerDescription}>
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
                <CardTitle className="text-2xl">
                  {form.id_servicio_interes ? 'Editar servicio' : 'Nuevo servicio'}
                </CardTitle>
                <CardDescription className="mt-2">
                  Campo unico: nombre del servicio de interes.
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

            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={form.nombre}
                  onChange={(e) => setForm((s) => ({ ...s, nombre: e.target.value }))}
                  placeholder="Ej: Paquete Europa"
                />
              </div>
              <Button className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" onClick={save}>
                <PlusCircle className="mr-2 size-4" />
                {form.id_servicio_interes ? 'Actualizar' : 'Agregar'}
              </Button>
              <Button variant="outline" className="rounded-2xl" onClick={resetForm}>
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/80 backdrop-blur-xl">
          <CardHeader className="p-6">
            <CardTitle className="text-2xl">Listado</CardTitle>
            <CardDescription className="mt-2">Administra estado activo/inactivo sin eliminar registros.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-6 pt-0">
            <Separator className="bg-slate-200/80" />
            {items.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-600">
                No hay servicios registrados.
              </div>
            ) : (
              items.map((row) => (
                <div
                  key={row.id_servicio_interes}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{row.nombre}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Estado: {row.is_active ? 'Activo' : 'Inactivo'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" className="rounded-xl" onClick={() => startEdit(row)}>
                      <Pencil className="mr-2 size-4" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => toggleActive(row)}
                    >
                      {row.is_active ? (
                        <>
                          <ToggleLeft className="mr-2 size-4" />
                          Inactivar
                        </>
                      ) : (
                        <>
                          <ToggleRight className="mr-2 size-4" />
                          Activar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </DashboardLayout>
  )
}

