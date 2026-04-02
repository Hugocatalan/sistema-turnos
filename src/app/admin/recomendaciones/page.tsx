'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, GripVertical, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

interface Recomendacion {
  id: string;
  texto: string;
  color: string;
  orden: number;
  activa: boolean;
}

const presetColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export default function RecomendacionesPage() {
  const [recomendaciones, setRecomendaciones] = useState<Recomendacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Recomendacion | null>(null);
  const [formData, setFormData] = useState({ texto: '', color: '#3B82F6', orden: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchRecomendaciones = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/recomendaciones');
      const data = await res.json();
      setRecomendaciones(Array.isArray(data) ? data : []);
    } catch { setError('Error al cargar'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRecomendaciones(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.texto.trim()) { setError('El texto es requerido'); return; }
    setSaving(true);
    setError('');
    try {
      const url = editing ? `/api/recomendaciones/${editing.id}` : '/api/recomendaciones';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setModalOpen(false);
      setEditing(null);
      setFormData({ texto: '', color: '#3B82F6', orden: 0 });
      fetchRecomendaciones();
    } catch (err) { setError(err instanceof Error ? err.message : 'Error'); }
    finally { setSaving(false); }
  };

  const handleEdit = (rec: Recomendacion) => {
    setEditing(rec);
    setFormData({ texto: rec.texto, color: rec.color, orden: rec.orden });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta recomendación?')) return;
    try {
      await fetch(`/api/recomendaciones/${id}`, { method: 'DELETE' });
      fetchRecomendaciones();
    } catch { alert('Error'); }
  };

  const toggleActivo = async (rec: Recomendacion) => {
    await fetch(`/api/recomendaciones/${rec.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activa: !rec.activa })
    });
    fetchRecomendaciones();
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Recomendaciones</h1>
          <p className="text-sm text-gray-500">{recomendaciones.length} recomendación{recomendaciones.length !== 1 ? 'es' : ''}</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormData({ texto: '', color: '#3B82F6', orden: recomendaciones.length }); setModalOpen(true); }} className="w-full sm:w-auto">
          <Plus size={18} className="mr-2" />
          Nueva
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={32} /></div>
      ) : recomendaciones.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-500">No hay recomendaciones</p>
          <Button variant="outline" className="mt-4" onClick={() => setModalOpen(true)}>Crear primera</Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {recomendaciones.map((rec) => (
            <div key={rec.id} className={`bg-white rounded-xl border p-4 ${rec.activa ? 'border-gray-100 shadow-sm' : 'border-gray-200 opacity-60'}`}>
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: rec.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{rec.texto}</p>
                    {!rec.activa && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Inactiva</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Orden: {rec.orden}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleActivo(rec)} className={`p-2 rounded ${rec.activa ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}`} title={rec.activa ? 'Desactivar' : 'Activar'}>
                    {rec.activa ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <button onClick={() => handleEdit(rec)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={18} /></button>
                  <button onClick={() => handleDelete(rec.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={18} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Editar Recomendación' : 'Nueva Recomendación'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
          
          <Textarea label="Texto" value={formData.texto} onChange={(e) => setFormData({...formData, texto: e.target.value})} placeholder="Ej: Recordá llegar 10 minutos antes" rows={3} required />
          
          <Input label="Orden" type="number" value={formData.orden} onChange={(e) => setFormData({...formData, orden: parseInt(e.target.value) || 0})} />
          
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
