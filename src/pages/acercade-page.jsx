import { useEffect, useMemo, useState } from 'react'
import { RefreshCw, Upload } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { apiFetch, getApiBase, uploadTemp } from '@/lib/api-client'
import { toastError, toastSuccess } from '@/lib/swal'

const API_BASE_URL = getApiBase()

export function AcercadePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [banner, setBanner] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [tempImageKey, setTempImageKey] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [form, setForm] = useState({
    title: 'Acerca de VIAJERO CR',
    paragraph_1: '',
    paragraph_2: '',
  })

  const headerDescription = useMemo(
    () => 'Gestion administrativa de la seccion Acerca de: titulo, imagen y textos.',
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
      const data = await apiFetch('/admin/acercade')
      const item = data.item ?? null
      if (item) {
        setForm({
          title: item.title ?? 'Acerca de VIAJERO CR',
          paragraph_1: item.paragraph_1 ?? '',
          paragraph_2: item.paragraph_2 ?? '',
        })
        setPreviewUrl(item.image_path ? `${API_BASE_URL}${item.image_path}` : '')
      }
    } catch (err) {
      setError(err?.message ?? 'No se pudo cargar la seccion.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleUpload(file) {
    if (!file) return
    setError(null)
    setIsUploading(true)
    try {
      const data = await uploadTemp('/admin/acercade/upload-temp', file)
      setTempImageKey(data.temp_key ?? '')
      setPreviewUrl(URL.createObjectURL(file))
      showBanner('success', 'Imagen cargada.')
    } catch (err) {
      const message = err?.message ?? 'No se pudo subir imagen.'
      setError(message)
      showBanner('error', message)
      await toastError(message)
    } finally {
      setIsUploading(false)
    }
  }

  async function save() {
    setError(null)
    if (!form.title.trim() || !form.paragraph_1.trim() || !form.paragraph_2.trim()) {
      const msg = 'Completa titulo y ambos parrafos.'
      setError(msg)
      showBanner('error', msg)
      await toastError(msg)
      return
    }

    try {
      await apiFetch('/admin/acercade/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          paragraph_1: form.paragraph_1.trim(),
          paragraph_2: form.paragraph_2.trim(),
          temp_image_key: tempImageKey || undefined,
        }),
      })
      setTempImageKey('')
      await load()
      showBanner('success', 'Seccion actualizada.')
      await toastSuccess('Seccion actualizada.')
    } catch (err) {
      const message = err?.message ?? 'No se pudo guardar.'
      setError(message)
      showBanner('error', message)
      await toastError(message)
    }
  }

  return (
    <DashboardLayout title="Acerca de" description={headerDescription}>
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
        <Card className="border-white/70 bg-white/80 backdrop-blur-xl">
          <CardHeader className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-2xl">Contenido de Acerca de</CardTitle>
                <CardDescription className="mt-2">Edita titulo, imagen y los dos parrafos de la seccion.</CardDescription>
              </div>
              <Button variant="outline" className="rounded-2xl" onClick={load} disabled={isLoading}>
                <RefreshCw className="mr-2 size-4" />
                Actualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <Separator className="mb-5 bg-slate-200/80" />

            {error ? (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Titulo</Label>
                  <Input value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Parrafo 1</Label>
                  <textarea
                    value={form.paragraph_1}
                    onChange={(e) => setForm((c) => ({ ...c, paragraph_1: e.target.value }))}
                    className="min-h-[140px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-slate-200 focus:ring-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Parrafo 2</Label>
                  <textarea
                    value={form.paragraph_2}
                    onChange={(e) => setForm((c) => ({ ...c, paragraph_2: e.target.value }))}
                    className="min-h-[160px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-slate-200 focus:ring-2"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Imagen principal</Label>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50">
                    <Upload className="size-4" />
                    {isUploading ? 'Subiendo...' : 'Subir imagen'}
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
                    <img src={previewUrl} alt="Preview" className="max-h-[420px] w-full object-contain bg-slate-50" />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                    Aun no hay imagen cargada.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Button className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" onClick={save}>
                Guardar cambios
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </DashboardLayout>
  )
}

