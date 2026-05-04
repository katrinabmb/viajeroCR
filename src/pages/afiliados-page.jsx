import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  CheckCircle2,
  GripVertical,
  Handshake,
  ImagePlus,
  Pencil,
  RefreshCw,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { apiFetch, getApiBase, uploadTemp } from '@/lib/api-client'

const API_BASE_URL = getApiBase()

export function AfiliadosPage() {
  const [title, setTitle] = useState('')
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ url: '', sort_order: 1 })
  const [tempKey, setTempKey] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [selectedFileName, setSelectedFileName] = useState('')
  const [dragId, setDragId] = useState(null)
  const [imageModal, setImageModal] = useState({ open: false, url: '' })
  const [isPending, startTransition] = useTransition()

  const isEditing = Boolean(editing?.id_logo)

  const headerDescription = useMemo(
    () => 'Gestion administrativa de Afiliados: titulo y logos (imagen + enlace).',
    []
  )

  async function load() {
    setIsLoading(true)
    setError(null)
    try {
      const data = await apiFetch('/admin/afiliados')
      setTitle(data.title ?? '')
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
    setForm({ url: '', sort_order: 1 })
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
      url: item.url ?? '',
      sort_order: Number(item.sort_order ?? 1),
    })
    setTempKey('')
    setPreviewUrl(item.image_path ? `${API_BASE_URL}${item.image_path}` : '')
    setSelectedFileName('')
    setError(null)
  }

  async function handleSaveTitle() {
    setError(null)
    try {
      await apiFetch('/admin/afiliados/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() }),
      })
      await load()
    } catch (err) {
      setError(err?.message ?? 'No se pudo guardar el titulo.')
    }
  }

  async function handleUpload(file) {
    if (!file) return
    setError(null)
    setIsUploading(true)
    setSelectedFileName(file.name ?? '')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const data = await uploadTemp('/admin/afiliados/upload-temp', file)
      setTempKey(data.temp_key ?? '')
      setPreviewUrl(URL.createObjectURL(file))
    } catch (err) {
      setError(err?.message ?? 'No se pudo subir la imagen.')
      setTempKey('')
      setPreviewUrl('')
    } finally {
      setIsUploading(false)
    }
  }

  async function handleSaveLogo() {
    setError(null)

    const payload = {
      url: form.url?.trim(),
      sort_order: Number(form.sort_order ?? 1),
    }

    try {
      if (isEditing) {
        await apiFetch('/admin/afiliados/logos/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editing.id_logo,
            ...payload,
            temp_key: tempKey || undefined,
          }),
        })
      } else {
        if (!tempKey) {
          setError('Debes subir un logo antes de guardar.')
          return
        }

        await apiFetch('/admin/afiliados/logos', {
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
    } catch (err) {
      setError(err?.message ?? 'No se pudo guardar.')
    }
  }

  async function handleToggle(item) {
    setError(null)
    try {
      await apiFetch('/admin/afiliados/logos/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id_logo,
          is_active: !Boolean(Number(item.is_active)),
        }),
      })
      await load()
    } catch (err) {
      setError(err?.message ?? 'No se pudo actualizar el estado.')
    }
  }

  async function handleDelete(item) {
    setError(null)
    const ok = window.confirm('Eliminar logo? Esta accion tambien elimina la imagen.')
    if (!ok) return

    try {
      await apiFetch('/admin/afiliados/logos/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id_logo }),
      })
      await load()
    } catch (err) {
      setError(err?.message ?? 'No se pudo eliminar.')
    }
  }

  return (
    <DashboardLayout title="Afiliados" description={headerDescription}>
      {imageModal.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <button
            type="button"
            aria-label="Cerrar preview"
            className="absolute inset-0 bg-slate-950/60"
            onClick={() => setImageModal({ open: false, url: '' })}
          />
          <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-[1.6rem] border border-white/15 bg-white shadow-[0_30px_120px_rgba(15,23,42,0.4)]">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">Preview</p>
                <p className="truncate text-xs text-slate-500">{imageModal.url}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                onClick={() => setImageModal({ open: false, url: '' })}
              >
                Cerrar
              </Button>
            </div>
            <div className="bg-slate-950/5 p-4">
              <div className="flex max-h-[75vh] items-center justify-center overflow-auto rounded-2xl bg-white p-3">
                <img src={imageModal.url} alt="Preview" className="max-h-[70vh] w-auto max-w-full object-contain" />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-white/70 bg-white/80 backdrop-blur-xl">
          <CardHeader className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-2xl">Configuracion</CardTitle>
                <CardDescription className="mt-2">Administra el titulo y la lista de afiliados.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="rounded-2xl" onClick={load} disabled={isLoading}>
                  <RefreshCw className="mr-2 size-4" />
                  Actualizar
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

            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="space-y-2">
                <Label htmlFor="aff_title">Titulo</Label>
                <Input
                  id="aff_title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Reserva tus servicios aqui"
                />
              </div>
              <Button className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" onClick={handleSaveTitle}>
                <Handshake className="mr-2 size-4" />
                Guardar titulo
              </Button>
            </div>

            <Separator className="my-6 bg-slate-200/80" />

            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-950">Logos</p>
              <Button className="rounded-2xl" onClick={startCreate}>
                <ImagePlus className="mr-2 size-4" />
                Nuevo logo
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {items.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                  {isLoading ? 'Cargando...' : 'No hay logos registrados todavia.'}
                </div>
              ) : null}

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
                    onDrop={async () => {
                      if (!dragId || dragId === item.id_logo) return
                      const fromIndex = items.findIndex((x) => x.id_logo === dragId)
                      const toIndex = items.findIndex((x) => x.id_logo === item.id_logo)
                      if (fromIndex < 0 || toIndex < 0) return

                      const next = items.slice()
                      const [moved] = next.splice(fromIndex, 1)
                      next.splice(toIndex, 0, moved)
                      setItems(next)

                      try {
                        await apiFetch('/admin/afiliados/logos/reorder', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ ordered_ids: next.map((x) => x.id_logo) }),
                        })
                        await load()
                      } catch (err) {
                        setError(err?.message ?? 'No se pudo reordenar.')
                      }
                    }}
                    className="flex flex-col gap-3 rounded-[1.6rem] border border-slate-200/80 bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div
                        className={[
                          'flex size-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500',
                          dragId === item.id_logo ? 'ring-2 ring-sky-200' : '',
                        ].join(' ')}
                        title="Arrastrar para reordenar"
                      >
                        <GripVertical className="size-4" />
                      </div>
                      <div className="h-16 w-24 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                        {imageUrl ? (
                          <button
                            type="button"
                            className="h-full w-full"
                            aria-label="Ver logo"
                            onClick={() => setImageModal({ open: true, url: imageUrl })}
                          >
                            <img src={imageUrl} alt="Logo" className="h-full w-full object-contain bg-white" />
                          </button>
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">URL</p>
                        <a
                          className="mt-1 block truncate text-sm text-sky-700 underline-offset-4 hover:underline"
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {item.url}
                        </a>
                        <p className="mt-2 text-xs text-slate-400">Orden: {item.sort_order}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
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
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/80 backdrop-blur-xl">
          <CardHeader className="p-6">
            <CardTitle className="text-2xl">{isEditing ? 'Editar logo' : 'Crear logo'}</CardTitle>
            <CardDescription className="mt-2">Carga el logo y define el enlace.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <Separator className="mb-5 bg-slate-200/80" />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={form.url}
                  onChange={(e) => setForm((c) => ({ ...c, url: e.target.value }))}
                  placeholder="https://www.klook.com/"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort_order">Orden</Label>
                <Input
                  id="sort_order"
                  type="number"
                  min={1}
                  value={form.sort_order}
                  onChange={(e) => {
                    const raw = e.target.value
                    const next = raw === '' ? 1 : Number(raw)
                    setForm((c) => ({ ...c, sort_order: Number.isFinite(next) ? Math.max(1, next) : 1 }))
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
                <Button
                  className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
                  onClick={handleSaveLogo}
                  disabled={isPending}
                >
                  Guardar
                </Button>
                <Button variant="outline" className="rounded-2xl" onClick={resetEditor}>
                  Limpiar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </DashboardLayout>
  )
}
