import { useEffect, useMemo, useState, useTransition } from 'react'
import { CheckCircle2, GripVertical, ImagePlus, Pencil, RefreshCw, Trash2, Upload, XCircle } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { apiFetch, getApiBase, uploadTemp } from '@/lib/api-client'
import { confirmDanger, toastError, toastSuccess } from '@/lib/swal'

const API_BASE_URL = getApiBase()

export function Seccion4ServiciosPage() {
  const [banner, setBanner] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState('')
  const [isPending, startTransition] = useTransition()

  const [sectionTitle, setSectionTitle] = useState('Servicios')
  const [items, setItems] = useState([])
  const [dragId, setDragId] = useState(null)

  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', title2: '', description: '', sort_order: '' })
  const [tempKey, setTempKey] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')

  const [imageModal, setImageModal] = useState({ open: false, url: '', title: '' })

  const headerDescription = useMemo(
    () => 'Gestion administrativa de Servicios (Seccion 4): titulo + items con imagen, orden y estado.',
    []
  )

  function showBanner(type, message) {
    setBanner({ type, message })
    window.clearTimeout(showBanner._t)
    showBanner._t = window.setTimeout(() => setBanner(null), 3500)
  }

  async function loadAll() {
    setIsLoading(true)
    setError(null)
    try {
      const data = await apiFetch('/admin/seccion4/servicios')
      setSectionTitle(data.title ?? 'Servicios')
      setItems(data.items ?? [])
    } catch (err) {
      setError(err?.message ?? 'No se pudo cargar.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function saveSectionTitle() {
    setError(null)
    try {
      await apiFetch('/admin/seccion4/servicios/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: sectionTitle.trim() }),
      })
      showBanner('success', 'Titulo actualizado.')
      await toastSuccess('Titulo actualizado.')
    } catch (err) {
      const message = err?.message ?? 'No se pudo guardar el titulo.'
      setError(message)
      showBanner('error', message)
      await toastError(message)
    }
  }

  function resetEditor() {
    setEditing(null)
    setForm({ title: '', title2: '', description: '', sort_order: '' })
    setTempKey('')
    setPreviewUrl('')
    setSelectedFileName('')
  }

  function startEdit(item) {
    setEditing(item)
    setForm({
      title: item.title ?? '',
      title2: item.title2 ?? '',
      description: item.description ?? '',
      sort_order: String(item.sort_order ?? ''),
    })
    setTempKey('')
    setPreviewUrl(item.image_path ? `${API_BASE_URL}${item.image_path}` : '')
    setSelectedFileName('')
  }

  async function uploadImage(file) {
    if (!file) return
    setError(null)
    setIsUploading(true)
    setSelectedFileName(file.name ?? '')
    try {
      const data = await uploadTemp('/admin/seccion4/servicios/upload-temp', file)
      setTempKey(data.temp_key ?? '')
      setPreviewUrl(URL.createObjectURL(file))
      showBanner('success', 'Imagen cargada.')
    } catch (err) {
      const message = err?.message ?? 'No se pudo subir.'
      setError(message)
      showBanner('error', message)
      await toastError(message)
      setTempKey('')
      setPreviewUrl('')
      setSelectedFileName('')
    } finally {
      setIsUploading(false)
    }
  }

  async function saveItem() {
    setError(null)
    const payload = {
      title: form.title.trim(),
      title2: form.title2.trim(),
      description: form.description.trim(),
      sort_order: Number(form.sort_order),
      temp_key: tempKey,
    }

    if (!payload.title || !payload.title2) {
      showBanner('error', 'Debes completar titulo y titulo2.')
      await toastError('Debes completar titulo y titulo2.')
      return
    }
    if (!payload.sort_order || payload.sort_order < 1) {
      showBanner('error', 'El orden debe ser 1 o mayor.')
      await toastError('El orden debe ser 1 o mayor.')
      return
    }

    try {
      if (editing) {
        await apiFetch('/admin/seccion4/servicios/items/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id_service: editing.id_service }),
        })
        showBanner('success', 'Servicio actualizado.')
        await toastSuccess('Servicio actualizado.')
      } else {
        if (!payload.temp_key) {
          showBanner('error', 'Debes subir una imagen.')
          await toastError('Debes subir una imagen.')
          return
        }
        await apiFetch('/admin/seccion4/servicios/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        showBanner('success', 'Servicio creado.')
        await toastSuccess('Servicio creado.')
      }
      startTransition(() => {
        resetEditor()
      })
      await loadAll()
    } catch (err) {
      const message = err?.message ?? 'No se pudo guardar.'
      setError(message)
      showBanner('error', message)
      await toastError(message)
    }
  }

  async function toggleActive(item) {
    setError(null)
    try {
      await apiFetch('/admin/seccion4/servicios/items/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_service: item.id_service, is_active: Number(item.is_active) ? 0 : 1 }),
      })
      showBanner('success', 'Estado actualizado.')
      await toastSuccess('Estado actualizado.')
      await loadAll()
    } catch (err) {
      const message = err?.message ?? 'No se pudo actualizar estado.'
      setError(message)
      showBanner('error', message)
      await toastError(message)
    }
  }

  async function deleteItem(item) {
    const ok = await confirmDanger({
      title: 'Eliminar servicio',
      text: 'Esta accion tambien elimina la imagen.',
      confirmButtonText: 'Eliminar',
    })
    if (!ok) return

    setError(null)
    try {
      await apiFetch('/admin/seccion4/servicios/items/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_service: item.id_service }),
      })
      showBanner('success', 'Servicio eliminado.')
      await toastSuccess('Servicio eliminado.')
      if (editing?.id_service === item.id_service) resetEditor()
      await loadAll()
    } catch (err) {
      const message = err?.message ?? 'No se pudo eliminar.'
      setError(message)
      showBanner('error', message)
      await toastError(message)
    }
  }

  async function reorder(next) {
    setItems(next)
    setError(null)
    try {
      await apiFetch('/admin/seccion4/servicios/items/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordered_ids: next.map((x) => x.id_service) }),
      })
      await loadAll()
      showBanner('success', 'Orden actualizado.')
      await toastSuccess('Orden actualizado.')
    } catch (err) {
      const message = err?.message ?? 'No se pudo reordenar.'
      setError(message)
      showBanner('error', message)
      await toastError(message)
    }
  }

  return (
    <DashboardLayout title="Seccion 4 (Servicios)" description={headerDescription}>
      {banner ? (
        <div
          className={[
            'sticky top-3 z-40 mx-auto mb-4 w-full max-w-6xl rounded-2xl border px-4 py-3 text-sm shadow-sm backdrop-blur',
            banner.type === 'success'
              ? 'border-emerald-200 bg-emerald-50/90 text-emerald-800'
              : 'border-red-200 bg-red-50/90 text-red-800',
          ].join(' ')}
        >
          {banner.message}
        </div>
      ) : null}

      <section className="w-full space-y-6 px-0 pb-10 pt-6">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-white/70 bg-white/80 backdrop-blur-xl">
            <CardHeader className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-2xl">Servicios</CardTitle>
                  <CardDescription className="mt-2">Configura el titulo y administra la lista de servicios.</CardDescription>
                </div>
                <Button variant="outline" className="rounded-2xl" onClick={loadAll} disabled={isLoading}>
                  <RefreshCw className="mr-2 size-4" />
                  Actualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <Separator className="mb-5 bg-slate-200/80" />

              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                <div className="space-y-2">
                  <Label htmlFor="s4_title">Titulo de seccion</Label>
                  <Input id="s4_title" value={sectionTitle} onChange={(e) => setSectionTitle(e.target.value)} />
                </div>
                <Button className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" onClick={saveSectionTitle}>
                  Guardar titulo
                </Button>
              </div>

              {error ? (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="mt-5 space-y-3">
                {items.map((item) => {
                  const isActive = Boolean(Number(item.is_active))
                  const imageUrl = item.image_path ? `${API_BASE_URL}${item.image_path}` : ''

                  return (
                    <div
                      key={item.id_service}
                      draggable
                      onDragStart={() => setDragId(item.id_service)}
                      onDragEnd={() => setDragId(null)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (!dragId || dragId === item.id_service) return
                        const fromIndex = items.findIndex((x) => x.id_service === dragId)
                        const toIndex = items.findIndex((x) => x.id_service === item.id_service)
                        if (fromIndex < 0 || toIndex < 0) return
                        const next = items.slice()
                        const [moved] = next.splice(fromIndex, 1)
                        next.splice(toIndex, 0, moved)
                        reorder(next)
                      }}
                      className="flex flex-col gap-3 rounded-[1.6rem] border border-slate-200/80 bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500">
                          <GripVertical className="size-4" />
                        </div>
                        <div className="h-14 w-14 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                          {imageUrl ? (
                            <button type="button" className="h-full w-full" onClick={() => setImageModal({ open: true, url: imageUrl, title: item.title ?? 'Servicio' })}>
                              <img src={imageUrl} alt={item.title} className="h-full w-full object-contain bg-white" />
                            </button>
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950">
                            {item.title}
                            <span className="text-slate-500"> {item.title2}</span>
                          </p>
                          <p className="mt-1 text-xs text-slate-400">Orden: {item.sort_order}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                        <Button variant="outline" className="rounded-2xl" onClick={() => startEdit(item)}>
                          <Pencil className="mr-2 size-4" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          className="rounded-2xl border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                          onClick={() => deleteItem(item)}
                        >
                          <Trash2 className="mr-2 size-4" />
                          Eliminar
                        </Button>
                        <Button
                          variant={isActive ? 'outline' : 'default'}
                          className={['rounded-2xl', isActive ? '' : 'bg-slate-950 text-white hover:bg-slate-800'].join(' ')}
                          onClick={() => toggleActive(item)}
                        >
                          {isActive ? (
                            <>
                              <XCircle className="mr-2 size-4" />
                              Inactivar
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="mr-2 size-4" />
                              Activar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )
                })}

                {!items.length ? (
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
                    No hay servicios registrados todavia.
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-white/80 backdrop-blur-xl">
            <CardHeader className="p-6">
              <CardTitle className="text-2xl">{editing ? 'Editar servicio' : 'Crear servicio'}</CardTitle>
              <CardDescription className="mt-2">
                Sube una imagen primero (temp), luego guarda para moverla a <span className="font-medium text-slate-700">/imagenes/seccion4</span>.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <Separator className="mb-5 bg-slate-200/80" />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Titulo</Label>
                  <Input value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Titulo 2</Label>
                  <Input value={form.title2} onChange={(e) => setForm((c) => ({ ...c, title2: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Descripcion</Label>
                  <Input value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Orden</Label>
                  <Input type="number" min={1} value={form.sort_order} onChange={(e) => setForm((c) => ({ ...c, sort_order: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Imagen</Label>
                  <div className="flex flex-col gap-3 rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm text-slate-600">
                        {tempKey ? (
                          <span className="font-medium text-slate-900">Temp listo</span>
                        ) : (
                          <span>Sube una imagen (jpg/png/webp).</span>
                        )}
                        {selectedFileName ? (
                          <div className="mt-1 text-xs text-slate-500">Archivo: {selectedFileName}</div>
                        ) : null}
                      </div>
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50">
                        <Upload className="size-4" />
                        {isUploading ? 'Subiendo...' : 'Subir'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            e.target.value = ''
                            uploadImage(f)
                          }}
                        />
                      </label>
                    </div>

                    {previewUrl ? (
                      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <img src={previewUrl} alt="Preview" className="max-h-72 w-full object-contain bg-slate-50" />
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" onClick={saveItem} disabled={isPending}>
                    Guardar
                  </Button>
                  <Button variant="outline" className="rounded-2xl" onClick={resetEditor}>
                    Limpiar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {imageModal.open ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setImageModal({ open: false, url: '', title: '' })}>
            <div className="w-full max-w-3xl overflow-hidden rounded-[1.6rem] bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                <p className="text-sm font-semibold text-slate-950">{imageModal.title}</p>
                <Button variant="outline" className="rounded-2xl" onClick={() => setImageModal({ open: false, url: '', title: '' })}>
                  Cerrar
                </Button>
              </div>
              <div className="bg-slate-50 p-4">
                <img src={imageModal.url} alt={imageModal.title} className="max-h-[70vh] w-full object-contain" />
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </DashboardLayout>
  )
}
