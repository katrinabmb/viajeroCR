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

export function TestimoniosPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [banner, setBanner] = useState(null)
  const [isPending, startTransition] = useTransition()
  const [dragId, setDragId] = useState(null)

  const [config, setConfig] = useState({ title: 'Testimonios' })
  const [recuerdos, setRecuerdos] = useState([
    { slot_no: 1, image_path: '' },
    { slot_no: 2, image_path: '' },
  ])
  const [tempRecuerdo1, setTempRecuerdo1] = useState('')
  const [tempRecuerdo2, setTempRecuerdo2] = useState('')

  const [items, setItems] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ destino: '', author_name: '', testimonio: '', sort_order: 1 })
  const [tempPhoto, setTempPhoto] = useState('')
  const [previewPhoto, setPreviewPhoto] = useState('')

  const headerDescription = useMemo(
    () => 'Gestion administrativa de Testimonios: titulo, imagenes inferiores y carrusel.',
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
      const data = await apiFetch('/testimonios')
      const cfg = data.config ?? {}
      setConfig({
        title: cfg.title ?? 'Testimonios',
      })
      const rs = Array.isArray(data.recuerdos) ? data.recuerdos : []
      const one = rs.find((x) => Number(x.slot_no) === 1) ?? { slot_no: 1, image_path: '' }
      const two = rs.find((x) => Number(x.slot_no) === 2) ?? { slot_no: 2, image_path: '' }
      setRecuerdos([one, two])
      setItems((data.items ?? []).map((x) => ({ ...x, is_active: Number(x.is_active ?? 1) })))
    } catch (err) {
      setError(err?.message ?? 'No se pudo cargar.')
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
    setForm({ destino: '', author_name: '', testimonio: '', sort_order: 1 })
    setTempPhoto('')
    setPreviewPhoto('')
  }

  function startEdit(item) {
    setEditing(item)
    setForm({
      destino: item.destino ?? '',
      author_name: item.author_name ?? '',
      testimonio: item.testimonio ?? '',
      sort_order: Number(item.sort_order ?? 1),
    })
    setTempPhoto('')
    setPreviewPhoto(item.photo_path ? `${API_BASE_URL}${item.photo_path}` : '')
  }

  async function uploadAny(file, setter) {
    if (!file) return
    try {
      const data = await uploadTemp('/admin/testimonios/upload-temp', file)
      setter(data.temp_key ?? '')
      return URL.createObjectURL(file)
    } catch (err) {
      const message = err?.message ?? 'No se pudo subir.'
      setError(message)
      showBanner('error', message)
      await toastError(message)
      return ''
    }
  }

  async function saveConfig() {
    setError(null)
    if (!config.title.trim()) {
      const m = 'Titulo requerido.'
      setError(m); showBanner('error', m); await toastError(m); return
    }
    try {
      await apiFetch('/admin/testimonios/config/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: config.title.trim(),
        }),
      })
      await load()
      showBanner('success', 'Configuracion actualizada.')
      await toastSuccess('Configuracion actualizada.')
    } catch (err) {
      const m = err?.message ?? 'No se pudo guardar.'
      setError(m); showBanner('error', m); await toastError(m)
    }
  }

  async function saveRecuerdo(slotNo) {
    const tempKey = slotNo === 1 ? tempRecuerdo1 : tempRecuerdo2
    if (!tempKey) {
      const m = `Primero sube imagen para el slot ${slotNo}.`
      setError(m); showBanner('error', m); await toastError(m); return
    }
    try {
      await apiFetch('/admin/testimonios/recuerdos/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_no: slotNo, temp_image_key: tempKey }),
      })
      if (slotNo === 1) setTempRecuerdo1('')
      if (slotNo === 2) setTempRecuerdo2('')
      await load()
      showBanner('success', `Recuerdo ${slotNo} actualizado.`)
      await toastSuccess(`Recuerdo ${slotNo} actualizado.`)
    } catch (err) {
      const m = err?.message ?? 'No se pudo guardar el recuerdo.'
      setError(m); showBanner('error', m); await toastError(m)
    }
  }

  async function saveItem() {
    setError(null)
    if (!form.destino.trim() || !form.author_name.trim() || !form.testimonio.trim()) {
      const m = 'Completa destino, autor y testimonio.'
      setError(m); showBanner('error', m); await toastError(m); return
    }
    try {
      if (editing) {
        await apiFetch('/admin/testimonios/items/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_testimonio: editing.id_testimonio,
            destino: form.destino.trim(),
            author_name: form.author_name.trim(),
            testimonio: form.testimonio.trim(),
            sort_order: Math.max(1, Number(form.sort_order || 1)),
            temp_photo_key: tempPhoto || undefined,
          }),
        })
      } else {
        await apiFetch('/admin/testimonios/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            destino: form.destino.trim(),
            author_name: form.author_name.trim(),
            testimonio: form.testimonio.trim(),
            sort_order: Math.max(1, Number(form.sort_order || 1)),
            temp_photo_key: tempPhoto || undefined,
          }),
        })
      }
      startTransition(() => resetEditor())
      await load()
      showBanner('success', editing ? 'Testimonio actualizado.' : 'Testimonio creado.')
      await toastSuccess(editing ? 'Testimonio actualizado.' : 'Testimonio creado.')
    } catch (err) {
      const m = err?.message ?? 'No se pudo guardar.'
      setError(m); showBanner('error', m); await toastError(m)
    }
  }

  async function setActive(item) {
    try {
      await apiFetch('/admin/testimonios/items/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_testimonio: item.id_testimonio, is_active: Number(item.is_active) ? 0 : 1 }),
      })
      await load()
    } catch (err) {
      const m = err?.message ?? 'No se pudo actualizar estado.'
      setError(m); showBanner('error', m); await toastError(m)
    }
  }

  async function deleteItem(item) {
    const ok = await confirmDanger({ title: 'Eliminar testimonio', text: 'Esta accion elimina el registro.', confirmButtonText: 'Eliminar' })
    if (!ok) return
    try {
      await apiFetch('/admin/testimonios/items/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_testimonio: item.id_testimonio }),
      })
      if (editing?.id_testimonio === item.id_testimonio) resetEditor()
      await load()
    } catch (err) {
      const m = err?.message ?? 'No se pudo eliminar.'
      setError(m); showBanner('error', m); await toastError(m)
    }
  }

  async function reorder(next) {
    setItems(next)
    try {
      await apiFetch('/admin/testimonios/items/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordered_ids: next.map((x) => x.id_testimonio) }),
      })
      await load()
    } catch (err) {
      const m = err?.message ?? 'No se pudo reordenar.'
      setError(m); showBanner('error', m); await toastError(m)
    }
  }

  return (
    <DashboardLayout title="Testimonios" description={headerDescription}>
      {banner ? <div className={['sticky top-3 z-40 mb-4 w-full rounded-2xl border px-4 py-3 text-sm', banner.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'].join(' ')}>{banner.message}</div> : null}

      <section className="w-full space-y-6 px-0 pb-10 pt-6">
        <Card className="border-white/70 bg-white/80 backdrop-blur-xl">
          <CardHeader className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Configuracion</CardTitle>
            <CardDescription className="mt-2">Titulo de la seccion de testimonios.</CardDescription>
              </div>
              <Button variant="outline" className="rounded-2xl" onClick={load} disabled={isLoading}><RefreshCw className="mr-2 size-4" />Actualizar</Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-4">
            <Separator className="bg-slate-200/80" />
            <div className="space-y-2"><Label>Titulo</Label><Input value={config.title} onChange={(e) => setConfig((c) => ({ ...c, title: e.target.value }))} /></div>
            <Button className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" onClick={saveConfig}>Guardar configuracion</Button>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/80 backdrop-blur-xl">
          <CardHeader className="p-6">
            <CardTitle className="text-2xl">Recuerdos (2 imagenes fijas)</CardTitle>
            <CardDescription className="mt-2">Solo se permiten dos imagenes: slot 1 y slot 2.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <Separator className="mb-5 bg-slate-200/80" />
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2].map((slotNo) => {
                const item = recuerdos.find((x) => Number(x.slot_no) === slotNo) ?? { slot_no: slotNo, image_path: '' }
                const tempKey = slotNo === 1 ? tempRecuerdo1 : tempRecuerdo2
                const imageSrc = item.image_path ? `${API_BASE_URL}${item.image_path}` : ''
                return (
                  <div key={slotNo} className="space-y-3 rounded-[1.4rem] border border-slate-200 bg-white/70 p-4">
                    <p className="text-sm font-semibold text-slate-900">Imagen {slotNo}</p>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm">
                      <Upload className="size-4" />
                      Subir
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0]
                          e.target.value = ''
                          const u = await uploadAny(f, slotNo === 1 ? setTempRecuerdo1 : setTempRecuerdo2)
                          if (u) {
                            setRecuerdos((prev) => prev.map((r) => Number(r.slot_no) === slotNo ? { ...r, image_path: u } : r))
                          }
                        }}
                      />
                    </label>
                    {tempKey ? <p className="text-xs text-slate-500">Imagen temporal lista para guardar.</p> : null}
                    {imageSrc ? (
                      <img
                        src={item.image_path.startsWith('blob:') ? item.image_path : imageSrc}
                        alt={`Recuerdo ${slotNo}`}
                        className="max-h-48 w-full rounded-2xl border border-slate-200 object-contain bg-slate-50"
                      />
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                        Sin imagen en este slot.
                      </div>
                    )}
                    <Button className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" onClick={() => saveRecuerdo(slotNo)}>
                      Guardar imagen {slotNo}
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-white/70 bg-white/80 backdrop-blur-xl">
            <CardHeader className="p-6"><CardTitle className="text-2xl">Lista de testimonios</CardTitle></CardHeader>
            <CardContent className="p-6 pt-0 space-y-3">
              {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
              {items.map((item) => {
                const isActive = Boolean(Number(item.is_active))
                const photoUrl = item.photo_path ? `${API_BASE_URL}${item.photo_path}` : ''
                return (
                  <div key={item.id_testimonio} draggable onDragStart={() => setDragId(item.id_testimonio)} onDragEnd={() => setDragId(null)} onDragOver={(e) => e.preventDefault()} onDrop={() => {
                    if (!dragId || dragId === item.id_testimonio) return
                    const from = items.findIndex((x) => x.id_testimonio === dragId)
                    const to = items.findIndex((x) => x.id_testimonio === item.id_testimonio)
                    if (from < 0 || to < 0) return
                    const next = items.slice()
                    const [moved] = next.splice(from, 1)
                    next.splice(to, 0, moved)
                    reorder(next)
                  }} className="flex flex-col gap-3 rounded-[1.6rem] border border-slate-200/80 bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500"><GripVertical className="size-4" /></div>
                      <div className="h-12 w-12 overflow-hidden rounded-full border border-slate-200 bg-slate-50">{photoUrl ? <img src={photoUrl} alt={item.author_name} className="h-full w-full object-cover" /> : null}</div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">{item.author_name}</p>
                        <p className="mt-1 text-xs text-slate-400">{item.destino} | Orden: {item.sort_order}</p>
                        <p className="mt-2 line-clamp-2 max-w-[560px] text-sm text-slate-600">{item.testimonio}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                      <Button variant="outline" className="rounded-2xl" onClick={() => startEdit(item)}><Pencil className="mr-2 size-4" />Editar</Button>
                      <Button variant="outline" className="rounded-2xl border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800" onClick={() => deleteItem(item)}><Trash2 className="mr-2 size-4" />Eliminar</Button>
                      <Button variant={isActive ? 'outline' : 'default'} className={['rounded-2xl', isActive ? '' : 'bg-slate-950 text-white hover:bg-slate-800'].join(' ')} onClick={() => setActive(item)}>{isActive ? <><XCircle className="mr-2 size-4" />Inactivar</> : <><CheckCircle2 className="mr-2 size-4" />Activar</>}</Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-white/80 backdrop-blur-xl">
            <CardHeader className="p-6"><CardTitle className="text-2xl">{editing ? 'Editar testimonio' : 'Crear testimonio'}</CardTitle></CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="space-y-2"><Label>Destino</Label><Input value={form.destino} onChange={(e) => setForm((c) => ({ ...c, destino: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Autor</Label><Input value={form.author_name} onChange={(e) => setForm((c) => ({ ...c, author_name: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Testimonio</Label><textarea value={form.testimonio} onChange={(e) => setForm((c) => ({ ...c, testimonio: e.target.value }))} className="min-h-[140px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-slate-200 focus:ring-2" /></div>
              <div className="space-y-2"><Label>Orden</Label><Input type="number" min={1} value={form.sort_order} onChange={(e) => setForm((c) => ({ ...c, sort_order: Number(e.target.value || 1) }))} /></div>
              <div className="space-y-2">
                <Label>Foto (opcional)</Label>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm"><Upload className="size-4" />Subir<input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; const u = await uploadAny(f, setTempPhoto); if (u) setPreviewPhoto(u) }} /></label>
                {previewPhoto ? <img src={previewPhoto} alt="preview" className="max-h-44 w-full rounded-2xl border border-slate-200 object-contain bg-white" /> : null}
              </div>
              <div className="flex gap-2">
                <Button className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" onClick={saveItem} disabled={isPending}>Guardar</Button>
                <Button variant="outline" className="rounded-2xl" onClick={resetEditor}>Limpiar</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </DashboardLayout>
  )
}
