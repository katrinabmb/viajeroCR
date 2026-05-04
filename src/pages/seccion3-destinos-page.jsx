import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Compass,
  GripVertical,
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
import { confirmDanger, toastError, toastSuccess } from '@/lib/swal'

const API_BASE_URL = getApiBase()

export function Seccion3DestinosPage() {
  const [banner, setBanner] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const [sectionTitle, setSectionTitle] = useState('Destinos')

  const [continents, setContinents] = useState([])
  const [selectedContinentId, setSelectedContinentId] = useState(null)
  const [dragContinentId, setDragContinentId] = useState(null)

  const [destinations, setDestinations] = useState([])
  const [dragDestinationId, setDragDestinationId] = useState(null)
  const [showDestinationsEditor, setShowDestinationsEditor] = useState(false)

  const [continentEditing, setContinentEditing] = useState(null)
  const [continentForm, setContinentForm] = useState({ title: '', sort_order: '' })
  const [continentTempKey, setContinentTempKey] = useState('')
  const [continentPreviewUrl, setContinentPreviewUrl] = useState('')
  const [showContinentEditor, setShowContinentEditor] = useState(true)

  const [destinationEditing, setDestinationEditing] = useState(null)
  const [destinationForm, setDestinationForm] = useState({ title: '', sort_order: '' })
  const [destinationTempKey, setDestinationTempKey] = useState('')
  const [destinationPreviewUrl, setDestinationPreviewUrl] = useState('')

  const [imageModal, setImageModal] = useState({ open: false, url: '', title: '' })

  const headerDescription = useMemo(
    () => 'Gestion administrativa de Destinos: continentes (padre) y destinos (hijo) con orden e imagenes.',
    []
  )

  const selectedContinent = useMemo(
    () => continents.find((c) => c.id_continent === selectedContinentId) ?? null,
    [continents, selectedContinentId]
  )

  function showBanner(type, message) {
    setBanner({ type, message })
    window.clearTimeout(showBanner._t)
    showBanner._t = window.setTimeout(() => setBanner(null), 3500)
  }

  async function loadContinents() {
    setIsLoading(true)
    setError(null)
    try {
      const data = await apiFetch('/admin/seccion3/continents')
      setSectionTitle(data.title ?? 'Destinos')
      setContinents(data.items ?? [])
      if (!selectedContinentId && (data.items?.[0]?.id_continent ?? 0)) {
        setSelectedContinentId(data.items[0].id_continent)
      }
    } catch (err) {
      setError(err?.message ?? 'No se pudo cargar.')
    } finally {
      setIsLoading(false)
    }
  }

  async function loadDestinations(continentId) {
    if (!continentId) {
      setDestinations([])
      return
    }
    try {
      const data = await apiFetch(`/admin/seccion3/destinations?continent_id=${continentId}`)
      setDestinations(data.items ?? [])
    } catch (err) {
      const message = err?.message ?? 'No se pudo cargar destinos.'
      setError(message)
    }
  }

  useEffect(() => {
    loadContinents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (showDestinationsEditor) {
      loadDestinations(selectedContinentId)
    } else {
      setDestinations([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContinentId, showDestinationsEditor])

  async function saveSectionTitle() {
    setError(null)
    try {
      await apiFetch('/admin/seccion3/title', {
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

  function resetContinentEditor() {
    setContinentEditing(null)
    setContinentForm({ title: '', sort_order: '' })
    setContinentTempKey('')
    setContinentPreviewUrl('')
  }

  function resetDestinationEditor() {
    setDestinationEditing(null)
    setDestinationForm({ title: '', sort_order: '' })
    setDestinationTempKey('')
    setDestinationPreviewUrl('')
  }

  function startCreateContinent() {
    setShowDestinationsEditor(false)
    setShowContinentEditor(true)
    resetContinentEditor()
  }

  function startEditContinent(item) {
    setShowDestinationsEditor(false)
    setShowContinentEditor(true)
    setContinentEditing(item)
    setContinentForm({ title: item.title ?? '', sort_order: String(item.sort_order ?? '') })
    setContinentTempKey('')
    setContinentPreviewUrl(item.image_path ? `${API_BASE_URL}${item.image_path}` : '')
  }

  function startCreateDestination() {
    resetDestinationEditor()
  }

  function openDestinationsForContinent(continentId) {
    setSelectedContinentId(continentId)
    setShowDestinationsEditor(true)
    setShowContinentEditor(false)
    resetDestinationEditor()
    loadDestinations(continentId)
  }

  function closeDestinationsEditor() {
    setShowDestinationsEditor(false)
    setShowContinentEditor(true)
    resetDestinationEditor()
  }

  function startEditDestination(item) {
    setDestinationEditing(item)
    setDestinationForm({ title: item.title ?? '', sort_order: String(item.sort_order ?? '') })
    setDestinationTempKey('')
    setDestinationPreviewUrl(item.image_path ? `${API_BASE_URL}${item.image_path}` : '')
  }

  async function uploadContinentImage(file) {
    if (!file) return
    try {
      const data = await uploadTemp('/admin/seccion3/upload-temp?type=continent', file)
      setContinentTempKey(data.temp_key ?? '')
      setContinentPreviewUrl(URL.createObjectURL(file))
      showBanner('success', 'Imagen de continente cargada.')
    } catch (err) {
      const message = err?.message ?? 'No se pudo subir.'
      setError(message)
      showBanner('error', message)
      await toastError(message)
    }
  }

  async function uploadDestinationImage(file) {
    if (!file) return
    try {
      const data = await uploadTemp('/admin/seccion3/upload-temp?type=destination', file)
      setDestinationTempKey(data.temp_key ?? '')
      setDestinationPreviewUrl(URL.createObjectURL(file))
      showBanner('success', 'Imagen de destino cargada.')
    } catch (err) {
      const message = err?.message ?? 'No se pudo subir.'
      setError(message)
      showBanner('error', message)
      await toastError(message)
    }
  }

  async function saveContinent() {
    setError(null)
    const payload = {
      title: continentForm.title.trim(),
      sort_order: Math.max(1, Number(continentForm.sort_order || 1)),
    }

    try {
      if (continentEditing?.id_continent) {
        await apiFetch('/admin/seccion3/continents/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: continentEditing.id_continent,
            ...payload,
            temp_key: continentTempKey || undefined,
          }),
        })
        showBanner('success', 'Continente actualizado.')
        await toastSuccess('Continente actualizado.')
      } else {
        if (!continentTempKey) {
          const message = 'Debes subir una imagen de continente.'
          setError(message)
          showBanner('error', message)
          return
        }
        await apiFetch('/admin/seccion3/continents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, temp_key: continentTempKey }),
        })
        showBanner('success', 'Continente creado.')
        await toastSuccess('Continente creado.')
      }

      resetContinentEditor()
      await loadContinents()
    } catch (err) {
      const message = err?.message ?? 'No se pudo guardar.'
      setError(message)
      showBanner('error', message)
      await toastError(message)
    }
  }

  async function saveDestination() {
    setError(null)
    const continentId = Number(selectedContinentId || 0)
    const payload = {
      continent_id: continentId,
      title: destinationForm.title.trim(),
      sort_order: Math.max(1, Number(destinationForm.sort_order || 1)),
    }

    try {
      if (destinationEditing?.id_destination) {
        await apiFetch('/admin/seccion3/destinations/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: destinationEditing.id_destination,
            ...payload,
            temp_key: destinationTempKey || undefined,
          }),
        })
        showBanner('success', 'Destino actualizado.')
        await toastSuccess('Destino actualizado.')
      } else {
        if (!destinationTempKey) {
          const message = 'Debes subir una imagen de destino.'
          setError(message)
          showBanner('error', message)
          return
        }
        await apiFetch('/admin/seccion3/destinations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, temp_key: destinationTempKey }),
        })
        showBanner('success', 'Destino creado.')
        await toastSuccess('Destino creado.')
      }

      resetDestinationEditor()
      await loadDestinations(continentId)
    } catch (err) {
      const message = err?.message ?? 'No se pudo guardar.'
      setError(message)
      showBanner('error', message)
      await toastError(message)
    }
  }

  async function toggleContinent(item) {
    try {
      await apiFetch('/admin/seccion3/continents/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id_continent, is_active: !Boolean(Number(item.is_active)) }),
      })
      await loadContinents()
      showBanner('success', 'Estado actualizado.')
    } catch (err) {
      const message = err?.message ?? 'No se pudo actualizar.'
      setError(message)
      showBanner('error', message)
      await toastError(message)
    }
  }

  async function deleteContinent(item) {
    const ok = await confirmDanger({
      title: `Eliminar continente`,
      text: 'Esto eliminara tambien sus destinos e imagenes.',
      confirmButtonText: 'Eliminar',
    })
    if (!ok) return
    try {
      await apiFetch('/admin/seccion3/continents/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id_continent }),
      })
      if (selectedContinentId === item.id_continent) setSelectedContinentId(null)
      await loadContinents()
      showBanner('success', 'Continente eliminado.')
      await toastSuccess('Continente eliminado.')
    } catch (err) {
      const message = err?.message ?? 'No se pudo eliminar.'
      setError(message)
      showBanner('error', message)
      await toastError(message)
    }
  }

  async function toggleDestination(item) {
    try {
      await apiFetch('/admin/seccion3/destinations/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id_destination, is_active: !Boolean(Number(item.is_active)) }),
      })
      await loadDestinations(selectedContinentId)
      showBanner('success', 'Estado actualizado.')
    } catch (err) {
      const message = err?.message ?? 'No se pudo actualizar.'
      setError(message)
      showBanner('error', message)
      await toastError(message)
    }
  }

  async function deleteDestination(item) {
    const ok = await confirmDanger({
      title: 'Eliminar destino',
      text: 'Esta accion tambien elimina la imagen.',
      confirmButtonText: 'Eliminar',
    })
    if (!ok) return
    try {
      await apiFetch('/admin/seccion3/destinations/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id_destination }),
      })
      await loadDestinations(selectedContinentId)
      showBanner('success', 'Destino eliminado.')
      await toastSuccess('Destino eliminado.')
    } catch (err) {
      const message = err?.message ?? 'No se pudo eliminar.'
      setError(message)
      showBanner('error', message)
      await toastError(message)
    }
  }

  return (
    <DashboardLayout title="Seccion 3 (Destinos)" description={headerDescription}>
      {banner ? (
        <div
          className={[
            'sticky top-[76px] z-30 mb-4 rounded-2xl border px-4 py-3 text-sm shadow-sm backdrop-blur',
            banner.type === 'success'
              ? 'border-emerald-200 bg-emerald-50/90 text-emerald-800'
              : 'border-red-200 bg-red-50/90 text-red-700',
          ].join(' ')}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium">{banner.message}</p>
            <button
              type="button"
              className="rounded-xl px-3 py-1 text-xs font-semibold hover:bg-black/5"
              onClick={() => setBanner(null)}
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : null}

      {imageModal.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <button
            type="button"
            aria-label="Cerrar preview"
            className="absolute inset-0 bg-slate-950/60"
            onClick={() => setImageModal({ open: false, url: '', title: '' })}
          />
          <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-[1.6rem] border border-white/15 bg-white shadow-[0_30px_120px_rgba(15,23,42,0.4)]">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">{imageModal.title || 'Preview'}</p>
                <p className="truncate text-xs text-slate-500">{imageModal.url}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                onClick={() => setImageModal({ open: false, url: '', title: '' })}
              >
                Cerrar
              </Button>
            </div>
            <div className="bg-slate-950/5 p-4">
              <div className="flex max-h-[75vh] items-center justify-center overflow-auto rounded-2xl bg-white p-3">
                <img src={imageModal.url} alt={imageModal.title} className="max-h-[70vh] w-auto max-w-full object-contain" />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <section className="grid gap-4 2xl:grid-cols-[1fr_1fr]">
        <Card className="border-white/70 bg-white/80 backdrop-blur-xl">
          <CardHeader className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-2xl">Continentes</CardTitle>
                <CardDescription className="mt-2">Crea, edita y reordena continentes.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="rounded-2xl" onClick={loadContinents} disabled={isLoading}>
                  <RefreshCw className="mr-2 size-4" />
                  Actualizar
                </Button>
                <Button className="rounded-2xl" onClick={startCreateContinent}>
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
                <Label htmlFor="s3_title">Titulo de seccion</Label>
                <Input id="s3_title" value={sectionTitle} onChange={(e) => setSectionTitle(e.target.value)} />
              </div>
              <Button className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" onClick={saveSectionTitle}>
                <Compass className="mr-2 size-4" />
                Guardar titulo
              </Button>
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mt-5 space-y-3">
              {continents.map((item) => {
                const isActive = Boolean(Number(item.is_active))
                const imageUrl = item.image_path ? `${API_BASE_URL}${item.image_path}` : ''

                return (
                  <div
                    key={item.id_continent}
                    draggable
                    onDragStart={() => setDragContinentId(item.id_continent)}
                    onDragEnd={() => setDragContinentId(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={async () => {
                      if (!dragContinentId || dragContinentId === item.id_continent) return
                      const fromIndex = continents.findIndex((x) => x.id_continent === dragContinentId)
                      const toIndex = continents.findIndex((x) => x.id_continent === item.id_continent)
                      if (fromIndex < 0 || toIndex < 0) return
                      const next = continents.slice()
                      const [moved] = next.splice(fromIndex, 1)
                      next.splice(toIndex, 0, moved)
                      setContinents(next)
                      try {
                        await apiFetch('/admin/seccion3/continents/reorder', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ ordered_ids: next.map((x) => x.id_continent) }),
                        })
                        await loadContinents()
                        showBanner('success', 'Orden actualizado.')
                        await toastSuccess('Orden actualizado.')
                      } catch (err) {
                        const message = err?.message ?? 'No se pudo reordenar.'
                        setError(message)
                        showBanner('error', message)
                        await toastError(message)
                      }
                    }}
                    className={[
                      'flex flex-col gap-3 rounded-[1.6rem] border border-slate-200/80 bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between',
                      selectedContinentId === item.id_continent ? 'ring-2 ring-sky-200' : '',
                    ].join(' ')}
                    onClick={() => {
                      setSelectedContinentId(item.id_continent)
                      setShowDestinationsEditor(false)
                      setShowContinentEditor(true)
                      resetDestinationEditor()
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500">
                        <GripVertical className="size-4" />
                      </div>
                      <div className="h-16 w-24 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                        {imageUrl ? (
                          <button
                            type="button"
                            className="h-full w-full"
                            aria-label="Ver imagen"
                            onClick={(e) => {
                              e.stopPropagation()
                              setImageModal({ open: true, url: imageUrl, title: item.title ?? 'Continente' })
                            }}
                          >
                            <img src={imageUrl} alt={item.title} className="h-full w-full object-cover" />
                          </button>
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">{item.title}</p>
                        <p className="mt-2 text-xs text-slate-400">Orden: {item.sort_order}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        className="rounded-2xl"
                        onClick={async () => {
                          openDestinationsForContinent(item.id_continent)
                        }}
                      >
                        Agregar destinos
                      </Button>
                      <Button variant="outline" className="rounded-2xl" onClick={() => startEditContinent(item)}>
                        <Pencil className="mr-2 size-4" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-2xl border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                        onClick={() => deleteContinent(item)}
                      >
                        <Trash2 className="mr-2 size-4" />
                        Eliminar
                      </Button>
                      <Button
                        variant={isActive ? 'outline' : 'default'}
                        className={['rounded-2xl', isActive ? '' : 'bg-slate-950 text-white hover:bg-slate-800'].join(' ')}
                        onClick={() => toggleContinent(item)}
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
            <CardTitle className="text-2xl">Editor</CardTitle>
            <CardDescription className="mt-2">
              Continente seleccionado:{' '}
              {selectedContinent ? (
                <span className="font-semibold text-slate-950">{selectedContinent.title}</span>
              ) : (
                'Ninguno'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <Separator className="mb-5 bg-slate-200/80" />

            <div className="grid gap-4 lg:grid-cols-1">
              {!showDestinationsEditor ? (
                <div className="space-y-3 rounded-[1.6rem] border border-slate-200 bg-white/70 p-4">
                  <p className="text-sm font-semibold text-slate-950">{continentEditing ? 'Editar continente' : 'Crear continente'}</p>
                  <div className="space-y-2">
                    <Label>Titulo</Label>
                    <Input value={continentForm.title} onChange={(e) => setContinentForm((c) => ({ ...c, title: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Orden</Label>
                    <Input
                      type="number"
                      min={1}
                      value={continentForm.sort_order}
                      onChange={(e) => setContinentForm((c) => ({ ...c, sort_order: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Imagen</Label>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50">
                      <Upload className="size-4" />
                      Subir
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          e.target.value = ''
                          uploadContinentImage(f)
                        }}
                      />
                    </label>
                    {continentPreviewUrl ? (
                      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <img src={continentPreviewUrl} alt="Preview" className="max-h-56 w-full object-contain bg-slate-50" />
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" onClick={saveContinent}>
                      Guardar
                    </Button>
                    <Button variant="outline" className="rounded-2xl" onClick={resetContinentEditor}>
                      Limpiar
                    </Button>
                  </div>
                </div>
              ) : null}

              {showDestinationsEditor ? (
                <div className="space-y-3 rounded-[1.6rem] border border-slate-200 bg-white/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">Destinos</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {selectedContinent ? (
                          <>
                            Administrando destinos de <span className="font-semibold text-slate-700">{selectedContinent.title}</span>.
                          </>
                        ) : (
                          'Selecciona un continente y administra sus destinos.'
                        )}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button className="rounded-2xl" onClick={startCreateDestination} disabled={!selectedContinentId}>
                        <ImagePlus className="mr-2 size-4" />
                        Nuevo
                      </Button>
                      <Button variant="outline" className="rounded-2xl" onClick={closeDestinationsEditor}>
                        Volver
                      </Button>
                    </div>
                  </div>

                  {!selectedContinentId ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                      Selecciona un continente y pulsa <span className="font-semibold">Agregar destinos</span>.
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {destinations.map((item) => {
                          const isActive = Boolean(Number(item.is_active))
                          const imageUrl = item.image_path ? `${API_BASE_URL}${item.image_path}` : ''

                          return (
                            <div
                              key={item.id_destination}
                              draggable
                              onDragStart={() => setDragDestinationId(item.id_destination)}
                              onDragEnd={() => setDragDestinationId(null)}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={async () => {
                                if (!dragDestinationId || dragDestinationId === item.id_destination) return
                                const fromIndex = destinations.findIndex((x) => x.id_destination === dragDestinationId)
                                const toIndex = destinations.findIndex((x) => x.id_destination === item.id_destination)
                                if (fromIndex < 0 || toIndex < 0) return
                                const next = destinations.slice()
                                const [moved] = next.splice(fromIndex, 1)
                                next.splice(toIndex, 0, moved)
                                setDestinations(next)
                                try {
                                  await apiFetch('/admin/seccion3/destinations/reorder', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ continent_id: selectedContinentId, ordered_ids: next.map((x) => x.id_destination) }),
                                  })
                                  await loadDestinations(selectedContinentId)
                                  showBanner('success', 'Orden actualizado.')
                                  await toastSuccess('Orden actualizado.')
                                } catch (err) {
                                  const message = err?.message ?? 'No se pudo reordenar.'
                                  setError(message)
                                  showBanner('error', message)
                                  await toastError(message)
                                }
                              }}
                              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500">
                                  <GripVertical className="size-4" />
                                </div>
                                <div className="h-12 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                                  {imageUrl ? (
                                    <button
                                      type="button"
                                      className="h-full w-full"
                                      onClick={() => setImageModal({ open: true, url: imageUrl, title: item.title ?? 'Destino' })}
                                    >
                                      <img src={imageUrl} alt={item.title} className="h-full w-full object-cover" />
                                    </button>
                                  ) : null}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-slate-950">{item.title}</p>
                                  <p className="mt-1 text-xs text-slate-400">Orden: {item.sort_order}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" className="rounded-2xl" onClick={() => startEditDestination(item)}>
                                  <Pencil className="mr-2 size-4" />
                                  Editar
                                </Button>
                                <Button
                                  variant="outline"
                                  className="rounded-2xl border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                                  onClick={() => deleteDestination(item)}
                                >
                                  <Trash2 className="mr-2 size-4" />
                                  Eliminar
                                </Button>
                                <Button
                                  variant={isActive ? 'outline' : 'default'}
                                  className={['rounded-2xl', isActive ? '' : 'bg-slate-950 text-white hover:bg-slate-800'].join(' ')}
                                  onClick={() => toggleDestination(item)}
                                >
                                  {isActive ? (
                                    <>
                                      <XCircle className="mr-2 size-4" />
                                      Off
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="mr-2 size-4" />
                                      On
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      <Separator className="my-4 bg-slate-200/80" />

                      <p className="text-sm font-semibold text-slate-950">{destinationEditing ? 'Editar destino' : 'Crear destino'}</p>
                      <div className="space-y-2">
                        <Label>Titulo</Label>
                        <Input value={destinationForm.title} onChange={(e) => setDestinationForm((c) => ({ ...c, title: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Orden</Label>
                        <Input type="number" min={1} value={destinationForm.sort_order} onChange={(e) => setDestinationForm((c) => ({ ...c, sort_order: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Imagen</Label>
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50">
                          <Upload className="size-4" />
                          Subir
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value=''; uploadDestinationImage(f) }} />
                        </label>
                        {destinationPreviewUrl ? (
                          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                            <img src={destinationPreviewUrl} alt="Preview" className="max-h-56 w-full object-contain bg-slate-50" />
                          </div>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" onClick={saveDestination} disabled={!selectedContinentId}>
                          Guardar
                        </Button>
                        <Button variant="outline" className="rounded-2xl" onClick={resetDestinationEditor}>
                          Limpiar
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </section>
    </DashboardLayout>
  )
}
