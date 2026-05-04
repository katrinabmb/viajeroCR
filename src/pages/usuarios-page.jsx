import { useEffect, useState } from 'react'
import { KeyRound, Pencil, PlusCircle, RefreshCw, Shield, ToggleLeft, ToggleRight, UserRound } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { apiFetch } from '@/lib/api-client'
import { toastError, toastSuccess } from '@/lib/swal'

export function UsuariosPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [banner, setBanner] = useState(null)
  const [usuarios, setUsuarios] = useState([])
  const [permisos, setPermisos] = useState([])
  const [form, setForm] = useState({
    id_usuario: null,
    nombre: '',
    correo: '',
    password: '',
    id_permiso: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    id_usuario: null,
    password: '',
  })

  function showBanner(type, message) {
    setBanner({ type, message })
    window.clearTimeout(showBanner._t)
    showBanner._t = window.setTimeout(() => setBanner(null), 3500)
  }

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [usersData, permisosData] = await Promise.all([
        apiFetch('/admin/usuarios'),
        apiFetch('/admin/permisos'),
      ])
      setUsuarios(Array.isArray(usersData?.items) ? usersData.items : [])
      setPermisos(Array.isArray(permisosData?.items) ? permisosData.items : [])
    } catch (err) {
      setError(err?.message ?? 'No se pudo cargar usuarios.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function resetForm() {
    setForm({
      id_usuario: null,
      nombre: '',
      correo: '',
      password: '',
      id_permiso: permisos?.[0]?.id_permiso ? String(permisos[0].id_permiso) : '',
    })
  }

  function editRow(row) {
    setForm({
      id_usuario: row.id_usuario,
      nombre: row.nombre ?? '',
      correo: row.correo ?? '',
      password: '',
      id_permiso: row.id_permiso ? String(row.id_permiso) : '',
    })
  }

  async function saveUser() {
    const nombre = form.nombre.trim()
    const correo = form.correo.trim()
    const id_permiso = Number(form.id_permiso || 0)

    if (!nombre || !correo) {
      const m = 'Nombre y correo son obligatorios.'
      setError(m)
      showBanner('error', m)
      await toastError(m)
      return
    }

    try {
      if (form.id_usuario) {
        await apiFetch('/admin/usuarios/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_usuario: form.id_usuario,
            nombre,
            correo,
            id_permiso,
          }),
        })
        showBanner('success', 'Usuario actualizado.')
        await toastSuccess('Usuario actualizado.')
      } else {
        const password = String(form.password ?? '')
        if (password.length < 8) {
          const m = 'La clave debe tener al menos 8 caracteres.'
          setError(m)
          showBanner('error', m)
          await toastError(m)
          return
        }
        await apiFetch('/admin/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre,
            correo,
            password,
            id_permiso,
          }),
        })
        showBanner('success', 'Usuario creado.')
        await toastSuccess('Usuario creado.')
      }
      resetForm()
      await load()
    } catch (err) {
      const m = err?.message ?? 'No se pudo guardar el usuario.'
      setError(m)
      showBanner('error', m)
      await toastError(m)
    }
  }

  async function toggleActive(row) {
    try {
      await apiFetch('/admin/usuarios/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_usuario: row.id_usuario,
          is_active: row.estado === 'activo' ? 0 : 1,
        }),
      })
      showBanner('success', row.estado === 'activo' ? 'Usuario inactivado.' : 'Usuario activado.')
      await toastSuccess(row.estado === 'activo' ? 'Usuario inactivado.' : 'Usuario activado.')
      await load()
    } catch (err) {
      const m = err?.message ?? 'No se pudo cambiar estado del usuario.'
      setError(m)
      showBanner('error', m)
      await toastError(m)
    }
  }

  async function changePassword() {
    const id = Number(passwordForm.id_usuario || 0)
    const password = String(passwordForm.password ?? '')
    if (id < 1 || password.length < 8) {
      const m = 'Selecciona usuario y define clave de al menos 8 caracteres.'
      setError(m)
      showBanner('error', m)
      await toastError(m)
      return
    }

    try {
      await apiFetch('/admin/usuarios/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_usuario: id,
          password,
        }),
      })
      setPasswordForm({ id_usuario: null, password: '' })
      showBanner('success', 'Clave actualizada correctamente.')
      await toastSuccess('Clave actualizada correctamente.')
    } catch (err) {
      const m = err?.message ?? 'No se pudo cambiar la clave.'
      setError(m)
      showBanner('error', m)
      await toastError(m)
    }
  }

  return (
    <DashboardLayout
      title="Usuarios y permisos"
      description="Gestiona usuarios del sistema, su permiso de acceso y cambios de clave. Sin eliminar, solo activar/inactivar."
    >
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
        <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
          <Card className="border-white/70 bg-white/80 backdrop-blur-xl">
            <CardHeader className="p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-2xl">Usuarios registrados</CardTitle>
                  <CardDescription className="mt-2">Lista del sistema con control de estado y permiso.</CardDescription>
                </div>
                <Button variant="outline" className="rounded-2xl" onClick={load} disabled={loading}>
                  <RefreshCw className="mr-2 size-4" />
                  Actualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-6 pt-0">
              <Separator className="bg-slate-200/80" />
              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              ) : null}
              {usuarios.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-600">
                  No hay usuarios registrados.
                </div>
              ) : (
                usuarios.map((row) => (
                  <div
                    key={row.id_usuario}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{row.nombre}</p>
                      <p className="mt-1 text-xs text-slate-500">{row.correo}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Permiso: {row.permiso_nombre ?? 'Sin permiso'} | Estado: {row.estado}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline" className="rounded-xl" onClick={() => editRow(row)}>
                        <Pencil className="mr-2 size-4" />
                        Editar
                      </Button>
                      <Button variant="outline" className="rounded-xl" onClick={() => setPasswordForm({ id_usuario: row.id_usuario, password: '' })}>
                        <KeyRound className="mr-2 size-4" />
                        Clave
                      </Button>
                      <Button variant="outline" className="rounded-xl" onClick={() => toggleActive(row)}>
                        {row.estado === 'activo' ? (
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

          <div className="space-y-6">
            <Card className="border-white/70 bg-white/80 backdrop-blur-xl">
              <CardHeader className="p-6">
                <CardTitle className="text-xl">{form.id_usuario ? 'Editar usuario' : 'Crear usuario'}</CardTitle>
                <CardDescription className="mt-2">Define perfil y permiso de acceso.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6 pt-0">
                <Separator className="bg-slate-200/80" />
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      className="pl-9"
                      value={form.nombre}
                      onChange={(e) => setForm((s) => ({ ...s, nombre: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Correo</Label>
                  <Input
                    type="email"
                    value={form.correo}
                    onChange={(e) => setForm((s) => ({ ...s, correo: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Permiso</Label>
                  <div className="relative">
                    <Shield className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <select
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm"
                      value={form.id_permiso}
                      onChange={(e) => setForm((s) => ({ ...s, id_permiso: e.target.value }))}
                    >
                      <option value="">Selecciona permiso</option>
                      {permisos.map((p) => (
                        <option key={p.id_permiso} value={p.id_permiso}>
                          {p.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {!form.id_usuario ? (
                  <div className="space-y-2">
                    <Label>Clave inicial</Label>
                    <Input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                      placeholder="Minimo 8 caracteres"
                    />
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <Button className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" onClick={saveUser}>
                    <PlusCircle className="mr-2 size-4" />
                    {form.id_usuario ? 'Actualizar' : 'Crear usuario'}
                  </Button>
                  <Button variant="outline" className="rounded-2xl" onClick={resetForm}>
                    Limpiar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-white/80 backdrop-blur-xl">
              <CardHeader className="p-6">
                <CardTitle className="text-xl">Cambio de clave</CardTitle>
                <CardDescription className="mt-2">Selecciona usuario y define su nueva clave.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6 pt-0">
                <Separator className="bg-slate-200/80" />
                <div className="space-y-2">
                  <Label>Usuario</Label>
                  <select
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                    value={passwordForm.id_usuario ?? ''}
                    onChange={(e) => setPasswordForm((s) => ({ ...s, id_usuario: Number(e.target.value || 0) }))}
                  >
                    <option value="">Selecciona usuario</option>
                    {usuarios.map((u) => (
                      <option key={u.id_usuario} value={u.id_usuario}>
                        {u.nombre} ({u.correo})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Nueva clave</Label>
                  <Input
                    type="password"
                    value={passwordForm.password}
                    onChange={(e) => setPasswordForm((s) => ({ ...s, password: e.target.value }))}
                    placeholder="Minimo 8 caracteres"
                  />
                </div>
                <Button className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" onClick={changePassword}>
                  <KeyRound className="mr-2 size-4" />
                  Guardar nueva clave
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </DashboardLayout>
  )
}

