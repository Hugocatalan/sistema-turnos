'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Clock, User, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

interface HorarioClase {
  id: string;
  clase: string;
  horaInicio: string;
  horaFin: string;
  dia: number;
  instructor?: string;
  activo: boolean;
}

interface Actividad {
  id: string;
  nombre: string;
  color: string;
  activo: boolean;
}

const diasSemana = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' }
];

export function HorariosManager() {
  const [horarios, setHorarios] = useState<HorarioClase[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    clase: '',
    horaInicio: '09:00',
    horaFin: '10:00',
    dia: 1,
    instructor: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchHorarios = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/horarios');
      const data = await res.json();
      setHorarios(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching:', err);
      setError('Error al cargar horarios');
    } finally {
      setLoading(false);
    }
  };

  const fetchActividades = async () => {
    try {
      const res = await fetch('/api/actividades');
      const data = await res.json();
      setActividades(Array.isArray(data) ? data.filter((a: Actividad) => a.activo) : []);
    } catch (err) {
      console.error('Error fetching actividades:', err);
    }
  };

  useEffect(() => {
    fetchHorarios();
    fetchActividades();
  }, [refreshKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      console.log('Creando horario:', formData);
      const res = await fetch('/api/horarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response data:', data);

      if (!res.ok) {
        throw new Error(data.error || 'Error al crear');
      }

      setModalOpen(false);
      setFormData({ clase: '', horaInicio: '09:00', horaFin: '10:00', dia: 1, instructor: '' });
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (horario: HorarioClase) => {
    try {
      const res = await fetch('/api/horarios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: horario.id, activo: !horario.activo })
      });
      if (res.ok) {
        setRefreshKey(k => k + 1);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este horario?')) return;
    try {
      const res = await fetch(`/api/horarios?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRefreshKey(k => k + 1);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const diasAbreviados = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock size={20} />
          Horarios de Actividades
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setRefreshKey(k => k + 1)}>
            <RefreshCw size={16} />
          </Button>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus size={16} className="mr-1" />
            Agregar
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-center py-8 text-gray-500">Cargando...</p>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500 mb-3">{error}</p>
          <Button variant="outline" onClick={() => setRefreshKey(k => k + 1)}>
            Reintentar
          </Button>
        </div>
      ) : horarios.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Clock size={48} className="mx-auto mb-3 text-gray-300" />
          <p>No hay horarios configurados</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setModalOpen(true)}>
            Agregar el primero
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {diasSemana.map(dia => {
            const delDia = horarios.filter(h => h.dia === dia.value);
            if (delDia.length === 0) return null;
            
            return (
              <div key={dia.value} className="border rounded-lg overflow-hidden">
                <div className="bg-blue-50 px-4 py-2 font-medium text-sm text-blue-800">
                  {dia.label}
                </div>
                <div className="divide-y">
                  {delDia.map(horario => (
                    <div key={horario.id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 ${!horario.activo ? 'opacity-50 bg-gray-50' : ''}`}>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                        <span className="font-bold text-blue-600 text-sm sm:text-base">
                          {horario.horaInicio} - {horario.horaFin}
                        </span>
                        <span className="font-medium">{horario.clase}</span>
                        {horario.instructor && (
                          <span className="text-gray-500 text-xs sm:text-sm flex items-center gap-1">
                            <User size={14} />
                            {horario.instructor}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggle(horario)}
                          className={`px-2 py-1 text-xs rounded ${
                            horario.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {horario.activo ? 'Activo' : 'Inactivo'}
                        </button>
                        <button
                          onClick={() => handleDelete(horario.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Agregar Horario">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

          <Select
            label="Día"
            value={String(formData.dia)}
            onChange={(e) => setFormData({...formData, dia: parseInt(e.target.value)})}
            options={diasSemana.map(d => ({ value: String(d.value), label: d.label }))}
          />

          <Select
            label="Actividad"
            value={formData.clase}
            onChange={(e) => setFormData({...formData, clase: e.target.value})}
            options={[
              { value: '', label: 'Seleccionar...' },
              ...actividades.map(a => ({ value: a.nombre, label: a.nombre }))
            ]}
          />
          {actividades.length === 0 && (
            <p className="text-xs text-orange-600 mt-1">
              Primero creá actividades en la sección &quot;Actividades&quot;
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Hora Inicio"
              type="time"
              value={formData.horaInicio}
              onChange={(e) => setFormData({...formData, horaInicio: e.target.value})}
              required
            />
            <Input
              label="Hora Fin"
              type="time"
              value={formData.horaFin}
              onChange={(e) => setFormData({...formData, horaFin: e.target.value})}
              required
            />
          </div>

          <Input
            label="Instructor (opcional)"
            value={formData.instructor}
            onChange={(e) => setFormData({...formData, instructor: e.target.value})}
          />

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Crear</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
