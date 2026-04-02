'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Clock, Loader2, Activity, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

interface Actividad {
  id: string;
  nombre: string;
  descripcion?: string | null;
  duracion: number;
  color: string;
  activo: boolean;
}

export default function ActividadesPage() {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Actividad | null>(null);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '', duracion: 60, color: '#3B82F6' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchActividades = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/actividades');
      const data = await res.json();
      setActividades(Array.isArray(data) ? data : []);
    } catch { setError('Error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchActividades(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) { setError('El nombre es requerido'); return; }
    setSaving(true);
    setError('');
    try {
      const url = editing ? `/api/actividades/${editing.id}` : '/api/actividades';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setModalOpen(false);
      setEditing(null);
      setFormData({ nombre: '', descripcion: '', duracion: 60, color: '#3B82F6' });
      fetchActividades();
    } catch (err) { setError(err instanceof Error ? err.message : 'Error'); }
    finally { setSaving(false); }
  };

  const handleEdit = (act: Actividad) => {
    setEditing(act);
    setFormData({ nombre: act.nombre, descripcion: act.descripcion || '', duracion: act.duracion, color: act.color });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar actividad?')) return;
    try {
      await fetch(`/api/actividades/${id}`, { method: 'DELETE' });
      fetchActividades();
    } catch { alert('Error'); }
  };

  const toggleActivo = async (act: Actividad) => {
    await fetch(`/api/actividades/${act.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !act.activo })
    });
    fetchActividades();
  };

  const presetColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Actividades</h1>
          <p className="text-sm text-gray-500">{actividades.length} actividad{actividades.length !== 1 ? 'es' : ''}</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormData({ nombre: '', descripcion: '', duracion: 60, color: '#3B82F6' }); setModalOpen(true); }} className="w-full sm:w-auto">
          <Plus size={18} className="mr-2" />
          Nueva Actividad
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={32} /></div>
      ) : actividades.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Activity size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No hay actividades cargadas</p>
          <p className="text-sm text-gray-400 mt-1">Hacé clic en "Nueva Actividad" para comenzar</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {actividades.map((act) => (
            <div key={act.id} className={`bg-white rounded-xl border p-4 ${act.activo ? 'border-gray-100 shadow-sm' : 'border-gray-200 opacity-60'}`}>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: act.color + '20' }}>
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: act.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">{act.nombre}</h3>
                    {!act.activo && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Inactiva</span>}
                  </div>
                  {act.descripcion && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{act.descripcion}</p>}
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                    <Clock size={12} />
                    <span>{act.duracion} min</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                <button onClick={() => toggleActivo(act)} className={`flex-1 text-xs py-1.5 rounded ${act.activo ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}`}>
                  {act.activo ? 'Desactivar' : 'Activar'}
                </button>
                <button onClick={() => handleEdit(act)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(act.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Editar Actividad' : 'Nueva Actividad'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
          <Input label="Nombre" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} placeholder="Ej: Spinning, Yoga, Consulta médica" required />
          <Input label="Descripción (opcional)" value={formData.descripcion} onChange={(e) => setFormData({...formData, descripcion: e.target.value})} placeholder="Breve descripción" />
          <Input label="Duración (minutos)" type="number" value={formData.duracion} onChange={(e) => setFormData({...formData, duracion: parseInt(e.target.value) || 60})} min={15} max={480} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {presetColors.map((c) => (
                <button key={c} type="button" onClick={() => setFormData({...formData, color: c})}
                  className={`w-8 h-8 rounded-lg transition-transform ${formData.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }} />
              ))}
              <input type="color" value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})}
                className="w-8 h-8 rounded-lg cursor-pointer" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => { setModalOpen(false); setEditing(null); }}>Cancelar</Button>
            <Button type="submit" loading={saving}>{editing ? 'Guardar' : 'Crear'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
