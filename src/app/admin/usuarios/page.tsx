'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, Eye, X, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

interface Usuario {
  id: string;
  dni: string;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  estadoMembresia: 'ACTIVA' | 'VENCIDA' | 'SUSPENDIDA';
  fechaVencimiento?: string;
  _count: { turnos: number };
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    dni: '', nombre: '', apellido: '', email: '', telefono: '',
    estadoMembresia: 'ACTIVA', fechaVencimiento: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '20',
        ...(search && { search }),
        ...(filtroEstado && { estado: filtroEstado })
      });
      const res = await fetch(`/api/users?${params}`);
      const data = await res.json();
      setUsuarios(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch { setError('Error al cargar'); }
    finally { setLoading(false); }
  }, [page, search, filtroEstado]);

  useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]);

  const handleOpenModal = (usuario?: Usuario) => {
    if (usuario) {
      setSelectedUsuario(usuario);
      setFormData({
        dni: usuario.dni, nombre: usuario.nombre, apellido: usuario.apellido,
        email: usuario.email || '', telefono: usuario.telefono || '',
        estadoMembresia: usuario.estadoMembresia,
        fechaVencimiento: usuario.fechaVencimiento?.split('T')[0] || ''
      });
    } else {
      setSelectedUsuario(null);
      setFormData({ dni: '', nombre: '', apellido: '', email: '', telefono: '', estadoMembresia: 'ACTIVA', fechaVencimiento: '' });
    }
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const url = selectedUsuario ? `/api/users/${selectedUsuario.id}` : '/api/users';
      const method = selectedUsuario ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setModalOpen(false);
      fetchUsuarios();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    try {
      await fetch(`/api/users/${id}`, { method: 'DELETE' });
      fetchUsuarios();
    } catch { alert('Error'); }
  };

  const estadoColors = { ACTIVA: 'bg-green-100 text-green-800', VENCIDA: 'bg-red-100 text-red-800', SUSPENDIDA: 'bg-yellow-100 text-yellow-800' };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-500">Gestión de alumnos</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="w-full sm:w-auto">
          <UserPlus size={18} className="mr-2" />
          <span className="hidden sm:inline">Nuevo </span>Alumno
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <Select
            value={filtroEstado}
            onChange={(e) => { setFiltroEstado(e.target.value); setPage(1); }}
            options={[
              { value: '', label: 'Todos' },
              { value: 'ACTIVA', label: 'Activa' },
              { value: 'VENCIDA', label: 'Vencida' },
              { value: 'SUSPENDIDA', label: 'Suspendida' }
            ]}
            className="w-full md:w-40"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                <th className="px-4 py-3">DNI</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3 hidden sm:table-cell">Contacto</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">Cargando...</td></tr>
              ) : usuarios.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">No hay usuarios</td></tr>
              ) : usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 text-sm">
                  <td className="px-4 py-3 font-mono">{u.dni}</td>
                  <td className="px-4 py-3 font-medium">{u.nombre} {u.apellido}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    {u.email && <div>{u.email}</div>}
                    {u.telefono && <div className="text-xs">{u.telefono}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${estadoColors[u.estadoMembresia]}`}>
                      {u.estadoMembresia}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleOpenModal(u)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(u.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-xs text-gray-500">Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft size={16} />
              </Button>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedUsuario ? 'Editar Alumno' : 'Nuevo Alumno'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="DNI" value={formData.dni} onChange={(e) => setFormData({...formData, dni: e.target.value})} required maxLength={10} />
            <Input label="Nombre" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Apellido" value={formData.apellido} onChange={(e) => setFormData({...formData, apellido: e.target.value})} required />
            <Input label="Teléfono" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} type="tel" />
          </div>
          <Input label="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} type="email" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Estado" value={formData.estadoMembresia} onChange={(e) => setFormData({...formData, estadoMembresia: e.target.value as any})}
              options={[{ value: 'ACTIVA', label: 'Activa' }, { value: 'VENCIDA', label: 'Vencida' }, { value: 'SUSPENDIDA', label: 'Suspendida' }]} />
            <Input label="Vencimiento" type="date" value={formData.fechaVencimiento} onChange={(e) => setFormData({...formData, fechaVencimiento: e.target.value})} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>{selectedUsuario ? 'Guardar' : 'Crear'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
