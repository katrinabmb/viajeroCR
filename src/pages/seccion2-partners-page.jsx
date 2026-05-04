import { useEffect, useMemo, useState, useTransition } from 'react'
import { CheckCircle2, GripVertical, Handshake, ImagePlus, Pencil, RefreshCw, Trash2, Upload, XCircle } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { apiFetch, getApiBase, uploadTemp } from '@/lib/api-client'
import { confirmDanger, toastError, toastSuccess } from '@/lib/swal'

const API_BASE_URL = getApiBase()

export function Seccion2PartnersPage() {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [banner, setBanner] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ sort_order: 1 })
  const [tempKey, setTempKey] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [selectedFileName, setSelectedFileName] = useState('')
  const [dragId, setDragId] = useState(null)
  const [imageModal, setImageModal] = useState({ open: false, url: '' })
  const [isPending, startTransition] = useTransition()

  const isEditing = Boolean(editing?.id_logo)

  const headerDescription = useMemo(
    () => 'Gestion administrativa de Proveedores y aliados (Seccion 2): logos con imagen, orden y estado.',
    []
  )

  async function load() {
    setIsLoading(true)
    setError(null)
    try {
      const data = await apiFetch('/admin/seccion2/partners')
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

  function showBanner(type, message) {
    setBanner({ type, message })
    window.clearTimeout(showBanner._t)
    showBanner._t = window.setTimeout(() => setBanner(null), 3500)
  }

  function resetEditor() {
    setEditing(null)
    setForm({ sort_order: 1 })
    setTempKey('')
    setPreviewUrl('')
    setSelectedFileName('')
    setError(null)
  }

  function startCreate() {
    resetEditor()
  }

  function startEdit(item) {
    setEditing(item)
    setForm({
      sort_order: Number(item.sort_order ?? 1),
    })
    setTempKey('')
    setPreviewUrl(item.image_path ? `${API_BASE_URL}${item.image_path}` : '')
    setSelectedFileName('')
    setError(null)
  }

  async function handleUpload(file) {
    if (!file) return
    setError(null)
    setIsUploading(true)
    setSelectedFileName(file.name ?? '')

    try {
      const data = await uploadTemp('/admin/seccion2/partners/upload-temp', file)
      setTempKey(data.temp_key ?? '')
      setPreviewUrl(URL.createObjectURL(file))
    } catch (err) {
      setError(err?.message ?? 'No se pudo subir la imagen.')
      setTempKey('')
      setPreviewUrl('')
      setSelectedFileName('')
    } finally {
      setIsUploading(false)
    }
  }

  async function handleSaveLogo() {
    setError(null)

    const payload = {
      sort_order: Math.max(1, Number(form.sort_order || 1)),
    }

    try {
      if (isEditing) {
        await apiFetch('/admin/seccion2/partners/logos/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_logo: editing.id_logo,
            ...payload,
            temp_key: tempKey || undefined,
          }),
        })
      } else {
        if (!tempKey) {
          setError('Debes subir un logo antes de guardar.')
          return
        }

        await apiFetch('/admin/seccion2/partners/logos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            temp_key: tempKey,
          }),
        })
      }

      startTransition(() => {
        resetEditor()
      })
      await load()
      showBanner('success', isEditing ? 'Logo actualizado.' : 'Logo creado.')
      await toastSuccess(isEditing ? 'Logo actualizado.' : 'Logo creado.')
    } catch (err) {
      const message = err?.message ?? 'No se pudo guardar el logo.'
      setError(message)
      showBanner('error', message)
      await toastError(message)
    }
  }

  async function handleToggle(item) {
    setError(null)
    try {
      await apiFetch('/admin/seccion2/partners/logos/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_logo: item.id_logo,
          is_active: Number(item.is_active) ? 0 : 1,
        }),
      })
      await load()
      showBanner('success', 'Estado actualizado.')
      await toastSuccess('Estado actualizado.')
    } catch (err) {
      const message = err?.message ?? 'No se pudo actualizar el estado.'
      setError(message)
      showBanner('error', message)
      await toastError(message)
    }
  }

  async function handleDelete(item) {
    const ok = await confirmDanger({
      title: 'Eliminar logo',
      text: 'Esta accion tambien elimina la imagen.',
      confirmButtonText: 'Eliminar',
    })
    if (!ok) return

    setError(null)
    try {
      await apiFetch('/admin/seccion2/partners/logos/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_logo: item.id_logo }),
      })
      if (editing?.id_logo === item.id_logo) resetEditor()
      await load()
      showBanner('success', 'Logo eliminado.')
      await toastSuccess('Logo eliminado.')
    } catch (err) {
      const message = err?.message ?? 'No se pudo eliminar el logo.'
      setError(message)
      showBanner('error', message)
      await toastError(message)
    }
  }

  async function reorder(next) {
    setItems(next)
    setError(null)
    try {
      await apiFetch('/admin/seccion2/partners/logos/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordered_ids: next.map((x) => x.id_logo) }),
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
    <DashboardLayout title="Seccion 2 (Partners)" description={headerDescription}>
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
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-white/70 bg-white/80 backdrop-blur-xl">
            <CardHeader className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-2xl">Logos</CardTitle>
                  <CardDescription className="mt-2">Crea, edita y reordena logos.</CardDescription>
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

              {error ? (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="space-y-3">
                {items.map((item) => {
                  const isActive = Boolean(Number(item.is_active))
                  const imageUrl = item.image_path ? `${API_BASE_URL}${item.image_path}` : ''

                  return (
                    <div
                      key={item.id_logo}
                      draggable
                      onDragStart={() => setDragId(item.id_logo)}
                      onDragEnd={() => setDragId(null)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (!dragId || dragId === item.id_logo) return
                        const fromIndex = items.findIndex((x) => x.id_logo === dragId)
                        const toIndex = items.findIndex((x) => x.id_logo === item.id_logo)
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
                        <div className="h-12 w-20 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                          {imageUrl ? (
                            <button type="button" className="h-full w-full" onClick={() => setImageModal({ open: true, url: imageUrl })}>
                              <img src={imageUrl} alt="logo" className="h-full w-full object-contain bg-white" />
                            </button>
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950">Logo</p>
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
                          onClick={() => handleDelete(item)}
                        >
                          <Trash2 className="mr-2 size-4" />
                          Eliminar
                        </Button>
                        <Button
                          variant={isActive ? 'outline' : 'default'}
                          className={['rounded-2xl', isActive ? '' : 'bg-slate-950 text-white hover:bg-slate-800'].join(' ')}
                          onClick={() => handleToggle(item)}
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
                    No hay logos registrados todavia.
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-white/80 backdrop-blur-xl">
            <CardHeader className="p-6">
              <CardTitle className="text-2xl">{isEditing ? 'Editar logo' : 'Crear logo'}</CardTitle>
              <CardDescription className="mt-2">Sube una imagen primero (temp), luego guarda para moverla a /imagenes/partners.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <Separator className="mb-5 bg-slate-200/80" />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sort_order">Orden</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    min={1}
                    value={form.sort_order}
                    onChange={(e) => {
                      const raw = e.target.value
                      if (raw === '') {
                        setForm((c) => ({ ...c, sort_order: '' }))
                        return
                      }
                      const next = Number(raw)
                      setForm((c) => ({ ...c, sort_order: Number.isFinite(next) ? next : '' }))
                    }}
                    onBlur={() => {
                      if (form.sort_order === '' || form.sort_order == null) {
                        setForm((c) => ({ ...c, sort_order: 1 }))
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex flex-col gap-3 rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm text-slate-600">
                        {tempKey ? (
                          <span className="font-medium text-slate-900">Temp listo</span>
                        ) : (
                          <span>Sube una imagen (jpg/png/webp/svg).</span>
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
                            const file = e.target.files?.[0]
                            e.target.value = ''
                            handleUpload(file)
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
                  <Button className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" onClick={handleSaveLogo} disabled={isPending}>
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
