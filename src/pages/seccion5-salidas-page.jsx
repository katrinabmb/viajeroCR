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

export function Seccion5SalidasPage() {
  const [title, setTitle] = useState('Salidas Grupales')
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [banner, setBanner] = useState(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isUploadingPdf, setIsUploadingPdf] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', fechas: '', precio: '', sort_order: 1 })
  const [tempImageKey, setTempImageKey] = useState('')
  const [tempPdfKey, setTempPdfKey] = useState('')
  const [previewImageUrl, setPreviewImageUrl] = useState('')
  const [pdfFileName, setPdfFileName] = useState('')
  const [dragId, setDragId] = useState(null)
  const [imageModal, setImageModal] = useState({ open: false, url: '' })
  const [isPending, startTransition] = useTransition()

  const isEditing = Boolean(editing?.id_salida)

  const headerDescription = useMemo(
    () => 'Gestion administrativa de Salidas grupales: contenido, imagen, itinerario PDF, orden y estado.',
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
      const data = await apiFetch('/admin/seccion5/salidas')
      setTitle(data.title ?? 'Salidas Grupales')
      setItems(data.items ?? [])
    } catch (err) {
      setError(err?.message ?? 'No se pudo cargar la informacion.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function resetEditor() {
    setEditing(null)
    setForm({ title: '', description: '', fechas: '', precio: '', sort_order: 1 })
    setTempImageKey('')
    setTempPdfKey('')
    setPreviewImageUrl('')
    setPdfFileName('')
    setError(null)
  }

  function startCreate() {
    resetEditor()
  }

  function startEdit(item) {
    setEditing(item)
    setForm({
      title: item.title ?? '',
      description: item.description ?? '',
      fechas: item.fechas ?? '',
      precio: item.precio ?? '',
      sort_order: Number(item.sort_order ?? 1),
    })
    setTempImageKey('')
    setTempPdfKey('')
    setPreviewImageUrl(item.image_path ? `${API_BASE_URL}${item.image_path}` : '')
    setPdfFileName(item.itinerario_path ? item.itinerario_path.split('/').pop() ?? '' : '')
  }

  async function saveTitle() {
    setError(null)
    try {
      await apiFetch('/admin/seccion5/salidas/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() }),
      })
      await load()
      showBanner('success', 'Titulo actualizado.')
      await toastSuccess('Titulo actualizado.')
    } catch (err) {
      const message = err?.message ?? 'No se pudo guardar el titulo.'
      setError(message)
      showBanner('error', message)
      await toastError(message)
    }
  }

  async function uploadImage(file) {
    if (!file) return
    setError(null)
    setIsUploadingImage(true)
    try {
      const data = await uploadTemp('/admin/seccion5/salidas/upload-temp?type=image', file)
      setTempImageKey(data.temp_key ?? '')
      setPreviewImageUrl(URL.createObjectURL(file))
    } catch (err) {
      setError(err?.message ?? 'No se pudo subir la imagen.')
      setTempImageKey('')
      setPreviewImageUrl('')
    } finally {
      setIsUploadingImage(false)
    }
  }

  async function uploadPdf(file) {
    if (!file) return
    setError(null)
    setIsUploadingPdf(true)
    try {
      const data = await uploadTemp('/admin/seccion5/salidas/upload-temp?type=pdf', file)
      setTempPdfKey(data.temp_key ?? '')
      setPdfFileName(file.name ?? '')
    } catch (err) {
      setError(err?.message ?? 'No se pudo subir el PDF.')
      setTempPdfKey('')
      setPdfFileName('')
    } finally {
      setIsUploadingPdf(false)
    }
  }

  async function saveItem() {
    setError(null)
    const payload = {
      title: form.title?.trim(),
      description: form.description?.trim(),
      fechas: form.fechas?.trim(),
      precio: form.precio?.trim(),
      sort_order: Math.max(1, Number(form.sort_order || 1)),
      temp_image_key: tempImageKey || undefined,
      temp_pdf_key: tempPdfKey || undefined,
    }

    if (!payload.title || !payload.description || !payload.fechas || !payload.precio) {
      setError('Completa todos los campos.')
      return
    }

    try {
      if (isEditing) {
        await apiFetch('/admin/seccion5/salidas/items/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_salida: editing.id_salida, ...payload }),
        })
      } else {
        if (!tempImageKey || !tempPdfKey) {
          setError('Debes subir imagen y PDF antes de guardar.')
          return
        }
        await apiFetch('/admin/seccion5/salidas/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      startTransition(() => {
        resetEditor()
      })
      await load()
      showBanner('success', isEditing ? 'Salida actualizada.' : 'Salida creada.')
      await toastSuccess(isEditing ? 'Salida actualizada.' : 'Salida creada.')
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
      await apiFetch('/admin/seccion5/salidas/items/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_salida: item.id_salida,
          is_active: Number(item.is_active) ? 0 : 1,
        }),
      })
      await load()
      showBanner('success', 'Estado actualizado.')
      await toastSuccess('Estado actualizado.')
    } catch (err) {
      const message = err?.message ?? 'No se pudo actualizar estado.'
      setError(message)
      showBanner('error', message)
      await toastError(message)
    }
  }

  async function deleteItem(item) {
    const ok = await confirmDanger({
      title: 'Eliminar salida',
      text: 'Esta accion elimina imagen e itinerario.',
      confirmButtonText: 'Eliminar',
    })
    if (!ok) return

    setError(null)
    try {
      await apiFetch('/admin/seccion5/salidas/items/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_salida: item.id_salida }),
      })
      if (editing?.id_salida === item.id_salida) resetEditor()
      await load()
      showBanner('success', 'Salida eliminada.')
      await toastSuccess('Salida eliminada.')
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
      await apiFetch('/admin/seccion5/salidas/items/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordered_ids: next.map((x) => x.id_salida) }),
      })
      await load()
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
    <DashboardLayout title="Seccion 5 (Salidas Grupales)" description={headerDescription}>
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
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-white/70 bg-white/80 backdrop-blur-xl">
            <CardHeader className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-2xl">Salidas Grupales</CardTitle>
                  <CardDescription className="mt-2">Crea, edita y reordena salidas.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="rounded-2xl" onClick={load} disabled={isLoading}>
                    <RefreshCw className="mr-2 size-4" />
                    Actualizar
                  </Button>
                  <Button className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" onClick={startCreate}>
                    <ImagePlus className="mr-2 size-4" />
                    Nuevo
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <Separator className="mb-5 bg-slate-200/80" />
              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                <div className="space-y-2">
                  <Label htmlFor="s5_title">Titulo de seccion</Label>
                  <Input id="s5_title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <Button className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" onClick={saveTitle}>
                  Guardar titulo
                </Button>
              </div>

              {error ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

              <div className="mt-5 space-y-3">
                {items.map((item) => {
                  const isActive = Boolean(Number(item.is_active))
                  const imageUrl = item.image_path ? `${API_BASE_URL}${item.image_path}` : ''
                  const pdfUrl = item.itinerario_path ? `${API_BASE_URL}${item.itinerario_path}` : ''

                  return (
                    <div
                      key={item.id_salida}
                      draggable
                      onDragStart={() => setDragId(item.id_salida)}
                      onDragEnd={() => setDragId(null)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (!dragId || dragId === item.id_salida) return
                        const fromIndex = items.findIndex((x) => x.id_salida === dragId)
                        const toIndex = items.findIndex((x) => x.id_salida === item.id_salida)
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
                        <div className="h-14 w-20 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                          {imageUrl ? (
                            <button type="button" className="h-full w-full" onClick={() => setImageModal({ open: true, url: imageUrl })}>
                              <img src={imageUrl} alt={item.title} className="h-full w-full object-cover" />
                            </button>
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950">{item.title}</p>
                          <p className="mt-1 text-xs text-slate-500 truncate">{item.fechas}</p>
                          <p className="mt-1 text-xs text-slate-400">Orden: {item.sort_order}</p>
                          {pdfUrl ? (
                            <a href={pdfUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-sky-700 underline">
                              Ver itinerario
                            </a>
                          ) : null}
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
                {!items.length ? <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">No hay salidas registradas todavia.</div> : null}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-white/80 backdrop-blur-xl">
            <CardHeader className="p-6">
              <CardTitle className="text-2xl">{isEditing ? 'Editar salida' : 'Crear salida'}</CardTitle>
              <CardDescription className="mt-2">Completa datos y sube imagen + itinerario PDF.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <Separator className="mb-5 bg-slate-200/80" />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Titulo</Label>
                  <Input value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Descripcion</Label>
                  <Input value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Fechas</Label>
                  <Input value={form.fechas} onChange={(e) => setForm((c) => ({ ...c, fechas: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Precio</Label>
                  <Input value={form.precio} onChange={(e) => setForm((c) => ({ ...c, precio: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Orden</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.sort_order}
                    onChange={(e) => setForm((c) => ({ ...c, sort_order: Number(e.target.value || 1) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Imagen</Label>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50">
                    <Upload className="size-4" />
                    {isUploadingImage ? 'Subiendo...' : 'Subir imagen'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        e.target.value = ''
                        uploadImage(file)
                      }}
                    />
                  </label>
                  {previewImageUrl ? (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <img src={previewImageUrl} alt="Preview" className="max-h-56 w-full object-contain bg-slate-50" />
                    </div>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label>Itinerario (PDF)</Label>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50">
                    <Upload className="size-4" />
                    {isUploadingPdf ? 'Subiendo...' : 'Subir PDF'}
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        e.target.value = ''
                        uploadPdf(file)
                      }}
                    />
                  </label>
                  {pdfFileName ? <p className="text-xs text-slate-600">Archivo: {pdfFileName}</p> : null}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setImageModal({ open: false, url: '' })}>
            <div className="w-full max-w-3xl overflow-hidden rounded-[1.6rem] bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                <p className="text-sm font-semibold text-slate-950">Preview</p>
                <Button variant="outline" className="rounded-2xl" onClick={() => setImageModal({ open: false, url: '' })}>
                  Cerrar
                </Button>
              </div>
              <div className="bg-slate-50 p-4">
                <img src={imageModal.url} alt="Preview" className="max-h-[70vh] w-full object-contain" />
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </DashboardLayout>
  )
}

