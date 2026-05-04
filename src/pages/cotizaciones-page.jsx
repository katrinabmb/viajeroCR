import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Eye, Mail, Phone, Plus, RefreshCw, Save, Search, User, X } from 'lucide-react'
import DataTableModule from 'react-data-table-component'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { apiFetch } from '@/lib/api-client'
import { toastError, toastSuccess } from '@/lib/swal'

const ESTADOS_GESTION = [
  { value: '', label: 'Todos' },
  { value: 'sin_abrir', label: 'Sin abrir' },
  { value: 'abierto', label: 'Abierto' },
  { value: 'gestionado', label: 'Gestionado' },
]

const ESTADOS_COMPRA = [
  { value: '', label: 'Todos' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'compro', label: 'Compro' },
  { value: 'no_compro', label: 'No compro' },
]

const DataTable = DataTableModule?.default ?? DataTableModule

const tableCustomStyles = {
  headCells: {
    style: {
      fontSize: '12px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      color: '#334155',
      backgroundColor: '#f8fafc',
    },
  },
  rows: {
    style: {
      minHeight: '68px',
      fontSize: '14px',
      color: '#0f172a',
    },
  },
  cells: {
    style: {
      paddingTop: '12px',
      paddingBottom: '12px',
    },
  },
}

function splitFechasReales(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return { fecha_real_inicio: '', fecha_real_fin: '' }
  if (raw.includes('|')) {
    const [inicio = '', fin = ''] = raw.split('|')
    return {
      fecha_real_inicio: inicio.trim(),
      fecha_real_fin: fin.trim(),
    }
  }
  return { fecha_real_inicio: '', fecha_real_fin: '' }
}

function buildFechasReales(inicio, fin) {
  const a = String(inicio ?? '').trim()
  const b = String(fin ?? '').trim()
  if (!a && !b) return ''
  return `${a}|${b}`
}

function splitSelectedDates(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return []
  return raw
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

export function CotizacionesPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [banner, setBanner] = useState(null)
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ total: 0, page: 1, per_page: 20, total_pages: 0 })
  const [filters, setFilters] = useState({
    search: '',
    estado_gestion: 'sin_abrir',
    estado_compra: '',
  })
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [newSelectedDate, setNewSelectedDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [serviciosInteres, setServiciosInteres] = useState([])

  const columns = [
      {
        name: 'Cliente',
        grow: 1.5,
        cell: (row) => (
          <div>
            <div className="font-medium text-slate-900">{row.nombre_completo}</div>
            <div className="text-xs text-slate-500">{row.correo}</div>
          </div>
        ),
      },
      { name: 'Servicio', selector: (row) => row.servicio_interes, grow: 1.3, wrap: true },
      { name: 'Gestion', selector: (row) => row.estado_gestion, width: '130px' },
      { name: 'Compra', selector: (row) => row.estado_compra, width: '130px' },
      { name: 'Fecha', selector: (row) => row.created_at, width: '170px' },
      {
        name: 'Accion',
        width: '130px',
        cell: (row) => (
          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => openDetail(row.id_cotizacion)}>
            <Eye className="mr-1 size-4" />
            Abrir
          </Button>
        ),
      },
    ]

  const headerDescription = useMemo(
    () => 'Gestion de cotizaciones recibidas desde el formulario publico. Abre cada caso para marcar estado, compra y seguimiento.',
    []
  )

  function showBanner(type, message) {
    setBanner({ type, message })
    window.clearTimeout(showBanner._t)
    showBanner._t = window.setTimeout(() => setBanner(null), 3500)
  }

  async function loadList() {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filters.search.trim() !== '') params.set('search', filters.search.trim())
      if (filters.estado_gestion) params.set('estado_gestion', filters.estado_gestion)
      if (filters.estado_compra) params.set('estado_compra', filters.estado_compra)
      params.set('page', '1')
      params.set('per_page', '50')

      const data = await apiFetch(`/admin/cotizaciones?${params.toString()}`)
      setItems(data.items ?? [])
      setMeta(data.meta ?? { total: 0, page: 1, per_page: 50, total_pages: 0 })
    } catch (err) {
      setError(err?.message ?? 'No se pudo cargar cotizaciones.')
    } finally {
      setIsLoading(false)
    }
  }

  async function loadServiciosInteres() {
    try {
      const data = await apiFetch('/admin/servicios-interes')
      setServiciosInteres(Array.isArray(data?.items) ? data.items : [])
    } catch {
      setServiciosInteres([])
    }
  }

  async function openDetail(id) {
    try {
      const data = await apiFetch(`/admin/cotizaciones/detail?id_cotizacion=${id}`)
      const item = data.item ?? null
      const fechas = splitFechasReales(item?.fechas_reales)
      const fechasSeleccionadas = splitSelectedDates(item?.fechas_seleccionadas)
      setSelectedId(id)
      setDetail(
        item
          ? {
              ...item,
              ...fechas,
              fechas_seleccionadas_lista: fechasSeleccionadas,
            }
          : null
      )
      await loadList()
    } catch (err) {
      const message = err?.message ?? 'No se pudo abrir la cotizacion.'
      setError(message)
      await toastError(message)
    }
  }

  useEffect(() => {
    loadList()
    loadServiciosInteres()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSaveDetail() {
    if (!detail?.id_cotizacion) return

    const inicio = String(detail.fecha_real_inicio ?? '')
    const fin = String(detail.fecha_real_fin ?? '')
    if (inicio && fin && fin < inicio) {
      const message = 'La fecha fin no puede ser menor que la fecha inicio.'
      setError(message)
      showBanner('error', message)
      await toastError(message)
      return
    }

    setSaving(true)
    try {
      await apiFetch('/admin/cotizaciones/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_cotizacion: detail.id_cotizacion,
          nombre_completo: detail.nombre_completo ?? '',
          correo: detail.correo ?? '',
          telefono: detail.telefono ?? '',
          fechas_aproximadas: detail.fechas_aproximadas ?? '',
          cantidad_personas: detail.cantidad_personas ?? '',
          cantidad_dias: detail.cantidad_dias ?? '',
          servicio_interes: detail.servicio_interes ?? '',
          id_servicio_interes: Number(detail.id_servicio_interes ?? 0),
          destino_detalles: detail.destino_detalles ?? '',
          estado_gestion: detail.estado_gestion,
          estado_compra: detail.estado_compra,
          presupuesto_viaje: detail.presupuesto_viaje ?? '',
          fechas_reales: buildFechasReales(detail.fecha_real_inicio, detail.fecha_real_fin),
          fechas_seleccionadas: detail.fechas_seleccionadas_lista ?? [],
          paquete_comprado: detail.paquete_comprado ?? '',
          destino_final: detail.destino_final ?? '',
          observaciones_internas: detail.observaciones_internas ?? '',
        }),
      })

      await openDetail(detail.id_cotizacion)
      showBanner('success', 'Cotizacion actualizada.')
      await toastSuccess('Cotizacion actualizada.')
    } catch (err) {
      const message = err?.message ?? 'No se pudo guardar la cotizacion.'
      setError(message)
      showBanner('error', message)
      await toastError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout title="Cotizaciones" description={headerDescription}>
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
        <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr] 2xl:grid-cols-[1.55fr_1fr]">
          <Card className="border-white/70 bg-white/80 backdrop-blur-xl">
            <CardHeader className="p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-2xl">Lista de cotizaciones</CardTitle>
                  <CardDescription className="mt-2">
                    Solicitudes entrantes del formulario. Total: {meta.total}
                  </CardDescription>
                </div>
                <Button variant="outline" className="rounded-2xl" onClick={loadList} disabled={isLoading}>
                  <RefreshCw className="mr-2 size-4" />
                  Actualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-6 pt-0">
              <Separator className="bg-slate-200/80" />
              {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

              <div className="grid gap-3 xl:grid-cols-[1.45fr_1fr_1fr_auto] xl:items-end">
                <div className="space-y-2 xl:col-span-1">
                  <Label>Busqueda</Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      className="pl-9"
                      placeholder="Nombre, correo, telefono, servicio o destino..."
                      value={filters.search}
                      onChange={(e) => setFilters((s) => ({ ...s, search: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Estado gestion</Label>
                  <select
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                    value={filters.estado_gestion}
                    onChange={(e) => setFilters((s) => ({ ...s, estado_gestion: e.target.value }))}
                  >
                    {ESTADOS_GESTION.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Estado compra</Label>
                  <select
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                    value={filters.estado_compra}
                    onChange={(e) => setFilters((s) => ({ ...s, estado_compra: e.target.value }))}
                  >
                    {ESTADOS_COMPRA.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex xl:justify-end">
                  <Button className="w-full rounded-2xl bg-slate-950 text-white hover:bg-slate-800 xl:w-auto xl:px-7" onClick={loadList}>
                    Filtrar
                  </Button>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <DataTable
                  columns={columns}
                  data={items}
                  customStyles={tableCustomStyles}
                  dense={false}
                  pagination
                  paginationPerPage={10}
                  paginationRowsPerPageOptions={[10, 20, 50]}
                  highlightOnHover
                  pointerOnHover
                  noDataComponent={
                    <div className="px-4 py-10 text-sm text-slate-500">
                      No hay cotizaciones registradas.
                    </div>
                  }
                  conditionalRowStyles={[
                    {
                      when: (row) => selectedId === row.id_cotizacion,
                      style: {
                        backgroundColor: '#fffbeb',
                      },
                    },
                  ]}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-white/80 backdrop-blur-xl xl:sticky xl:top-24 xl:h-fit">
            <CardHeader className="p-6">
              <CardTitle className="text-2xl">Detalle / Gestion</CardTitle>
              <CardDescription className="mt-2">
                {detail ? `Cotizacion #${detail.id_cotizacion} de ${detail.nombre_completo}` : 'Selecciona una cotizacion para ver el detalle completo.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6 pt-0">
              <Separator className="bg-slate-200/80" />
              {!detail ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-600">
                  Aun no has abierto una cotizacion.
                </div>
              ) : (
                <>
                  <div className="grid gap-3 lg:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nombre</Label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          className="pl-9"
                          value={detail.nombre_completo ?? ''}
                          onChange={(e) => setDetail((d) => ({ ...d, nombre_completo: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Correo</Label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          type="email"
                          className="pl-9"
                          value={detail.correo ?? ''}
                          onChange={(e) => setDetail((d) => ({ ...d, correo: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Telefono</Label>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          className="pl-9"
                          value={detail.telefono ?? ''}
                          onChange={(e) => setDetail((d) => ({ ...d, telefono: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Fechas aproximadas</Label>
                      <div className="relative">
                        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          className="pl-9"
                          value={detail.fechas_aproximadas ?? ''}
                          onChange={(e) => setDetail((d) => ({ ...d, fechas_aproximadas: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Personas</Label>
                      <Input
                        type="number"
                        min="1"
                        value={detail.cantidad_personas ?? 1}
                        onChange={(e) => setDetail((d) => ({ ...d, cantidad_personas: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dias</Label>
                      <Input
                        type="number"
                        min="1"
                        value={detail.cantidad_dias ?? ''}
                        onChange={(e) => setDetail((d) => ({ ...d, cantidad_dias: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Servicio de interes</Label>
                      <select
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                        value={String(detail.id_servicio_interes ?? '')}
                        onChange={(e) => {
                          const selectedId = Number(e.target.value)
                          const selected = serviciosInteres.find((item) => item.id_servicio_interes === selectedId)
                          setDetail((d) => ({
                            ...d,
                            id_servicio_interes: selectedId,
                            servicio_interes: selected?.nombre ?? d?.servicio_interes ?? '',
                          }))
                        }}
                      >
                        <option value="">Selecciona servicio</option>
                        {serviciosInteres.map((item) => (
                          <option key={item.id_servicio_interes} value={item.id_servicio_interes}>
                            {item.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2 lg:col-span-2">
                      <Label>Destino / detalles</Label>
                      <textarea
                        className="min-h-[100px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-slate-200 focus:ring-2"
                        value={detail.destino_detalles ?? ''}
                        onChange={(e) => setDetail((d) => ({ ...d, destino_detalles: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-2">
                    <div className="space-y-2 lg:col-span-2">
                      <Label>Fechas seleccionadas (multiples)</Label>
                      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <Input
                            type="date"
                            value={newSelectedDate}
                            onChange={(e) => setNewSelectedDate(e.target.value)}
                            className="sm:w-[220px]"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-2xl"
                            onClick={() => {
                              if (!newSelectedDate) return
                              setDetail((d) => {
                                const current = Array.isArray(d?.fechas_seleccionadas_lista) ? d.fechas_seleccionadas_lista : []
                                if (current.includes(newSelectedDate)) return d
                                const next = [...current, newSelectedDate].sort()
                                return { ...d, fechas_seleccionadas_lista: next }
                              })
                              setNewSelectedDate('')
                            }}
                          >
                            <Plus className="mr-2 size-4" />
                            Agregar fecha
                          </Button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {(detail.fechas_seleccionadas_lista ?? []).length === 0 ? (
                            <span className="text-sm text-slate-500">No hay fechas seleccionadas.</span>
                          ) : (
                            (detail.fechas_seleccionadas_lista ?? []).map((date) => (
                              <span
                                key={date}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                              >
                                {date}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDetail((d) => ({
                                      ...d,
                                      fechas_seleccionadas_lista: (d?.fechas_seleccionadas_lista ?? []).filter((x) => x !== date),
                                    }))
                                  }
                                  className="rounded-full p-0.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                >
                                  <X className="size-3" />
                                </button>
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Estado gestion</Label>
                      <select
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                        value={detail.estado_gestion ?? 'sin_abrir'}
                        onChange={(e) => setDetail((d) => ({ ...d, estado_gestion: e.target.value }))}
                      >
                        {ESTADOS_GESTION.filter((i) => i.value !== '').map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Estado compra</Label>
                      <select
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                        value={detail.estado_compra ?? 'pendiente'}
                        onChange={(e) => setDetail((d) => ({ ...d, estado_compra: e.target.value }))}
                      >
                        {ESTADOS_COMPRA.filter((i) => i.value !== '').map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Presupuesto del viaje (opcional)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={detail.presupuesto_viaje ?? ''}
                        onChange={(e) => setDetail((d) => ({ ...d, presupuesto_viaje: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha real inicio (opcional)</Label>
                      <Input
                        type="date"
                        value={detail.fecha_real_inicio ?? ''}
                        onChange={(e) => setDetail((d) => ({ ...d, fecha_real_inicio: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha real fin (opcional)</Label>
                      <Input
                        type="date"
                        value={detail.fecha_real_fin ?? ''}
                        onChange={(e) => setDetail((d) => ({ ...d, fecha_real_fin: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Paquete comprado (opcional)</Label>
                      <Input
                        value={detail.paquete_comprado ?? ''}
                        onChange={(e) => setDetail((d) => ({ ...d, paquete_comprado: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Destino final (opcional)</Label>
                      <Input
                        value={detail.destino_final ?? ''}
                        onChange={(e) => setDetail((d) => ({ ...d, destino_final: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2 lg:col-span-2">
                      <Label>Observaciones internas</Label>
                      <textarea
                        className="min-h-[110px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-slate-200 focus:ring-2"
                        value={detail.observaciones_internas ?? ''}
                        onChange={(e) => setDetail((d) => ({ ...d, observaciones_internas: e.target.value }))}
                      />
                    </div>
                  </div>

                  <Button
                    className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
                    onClick={handleSaveDetail}
                    disabled={saving}
                  >
                    <Save className="mr-2 size-4" />
                    Guardar gestion
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </DashboardLayout>
  )
}
