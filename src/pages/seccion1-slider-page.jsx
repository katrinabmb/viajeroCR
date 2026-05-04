import { useEffect, useMemo, useState, useTransition } from 'react'
import { CheckCircle2, ImagePlus, Pencil, RefreshCw, Upload, XCircle } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { getApiBaseUrl } from '@/lib/api-base-url'

const API_BASE_URL = getApiBaseUrl()

async function parseJson(response) {
  const text = await response.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}

async function apiFetch(path, init) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...init,
  })

  const data = await parseJson(response)

  if (!response.ok) {
    const message = data?.message ?? 'Error en la solicitud.'
    const code = data?.code ?? 'REQUEST_FAILED'
    const error = new Error(message)
    error.code = code
    error.status = response.status
    throw error
  }

  return data
}

export function Seccion1SliderPage() {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', subtitle: '', sort_order: 0 })
  const [tempKey, setTempKey] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [isPending, startTransition] = useTransition()

  const isEditing = Boolean(editing?.id_slider)

  const headerDescription = useMemo(
    () =>
      'Administra los slides de la Seccion 1 del Home. Puedes subir una imagen (temp) y luego guardarla para moverla a /imagenes/seccion1.',
    []
  )

  async function load() {
    setIsLoading(true)
    setError(null)
    try {
      const data = await apiFetch('/admin/seccion1/slides')
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

  function resetEditor() {
    setEditing(null)
    setForm({ title: '', subtitle: '', sort_order: 0 })
    setTempKey('')
    setPreviewUrl('')
    setError(null)
  }

  function startCreate() {
    resetEditor()
  }

  function startEdit(item) {
    setEditing(item)
    setForm({
      title: item.title ?? '',
      subtitle: item.subtitle ?? '',
      sort_order: Number(item.sort_order ?? 0),
    })
    setTempKey('')
    setPreviewUrl(item.image_path ? `${API_BASE_URL}${item.image_path}` : '')
    setError(null)
  }

  async function handleUpload(file) {
    if (!file) return
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${API_BASE_URL}/admin/seccion1/upload-temp`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      const data = await parseJson(response)

      if (!response.ok) {
        throw new Error(data?.message ?? 'No se pudo subir la imagen.')
      }

      setTempKey(data.temp_key ?? '')
      setPreviewUrl(URL.createObjectURL(file))
    } catch (err) {
      setError(err?.message ?? 'No se pudo subir la imagen.')
    }
  }

  async function handleSave() {
    setError(null)

    const payload = {
      title: form.title?.trim(),
      subtitle: form.subtitle?.trim(),
      sort_order: Number(form.sort_order ?? 0),
    }

    try {
      if (isEditing) {
        await apiFetch('/admin/seccion1/slides/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editing.id_slider,
            ...payload,
            temp_key: tempKey || undefined,
          }),
        })
      } else {
        if (!tempKey) {
          setError('Debes subir una imagen antes de guardar.')
          return
        }

        await apiFetch('/admin/seccion1/slides', {
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
      await apiFetch('/admin/seccion1/slides/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id_slider,
          is_active: !Boolean(Number(item.is_active)),
        }),
      })
      await load()
    } catch (err) {
      setError(err?.message ?? 'No se pudo actualizar el estado.')
    }
  }

  return (
    <DashboardLayout title="Seccion 1 (Slider)" description={headerDescription}>
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-white/70 bg-white/80 backdrop-blur-xl">
          <CardHeader className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-2xl">Slides actuales</CardTitle>
                <CardDescription className="mt-2">
                  Lista de items. Puedes activar/inactivar y editar.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="rounded-2xl" onClick={load} disabled={isLoading}>
                  <RefreshCw className="mr-2 size-4" />
                  Actualizar
                </Button>
                <Button className="rounded-2xl" onClick={startCreate}>
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
              {items.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                  {isLoading ? 'Cargando...' : 'No hay slides registrados todavia.'}
                </div>
              ) : null}

              {items.map((item) => {
                const isActive = Boolean(Number(item.is_active))
                const imageUrl = item.image_path ? `${API_BASE_URL}${item.image_path}` : ''

                return (
                  <div
                    key={item.id_slider}
                    className="flex flex-col gap-3 rounded-[1.6rem] border border-slate-200/80 bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="h-16 w-24 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                        {imageUrl ? (
                          <img src={imageUrl} alt={item.title} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">{item.title}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.subtitle}</p>
                        <p className="mt-2 text-xs text-slate-400">Orden: {item.sort_order}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Button
                        variant="outline"
                        className="rounded-2xl"
                        onClick={() => startEdit(item)}
                      >
                        <Pencil className="mr-2 size-4" />
                        Editar
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
            <CardTitle className="text-2xl">{isEditing ? 'Editar slide' : 'Crear slide'}</CardTitle>
            <CardDescription className="mt-2">
              Sube una imagen primero (temp), luego guarda para moverla a la carpeta final.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <Separator className="mb-5 bg-slate-200/80" />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titulo</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))}
                  placeholder="Ej: ¡Viajes creados con logica, experiencia"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitulo</Label>
                <Input
                  id="subtitle"
                  value={form.subtitle}
                  onChange={(e) => setForm((c) => ({ ...c, subtitle: e.target.value }))}
                  placeholder="Ej: y pasion por el detalle!"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort_order">Orden</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm((c) => ({ ...c, sort_order: e.target.value }))}
                />
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
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50">
                      <Upload className="size-4" />
                      Subir
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleUpload(e.target.files?.[0])}
                      />
                    </label>
                  </div>

                  {previewUrl ? (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <img src={previewUrl} alt="Preview" className="h-44 w-full object-cover" />
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
                  onClick={handleSave}
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

