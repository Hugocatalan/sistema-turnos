'use client';

import { useEffect, useState, useCallback } from 'react';
import { Calendar, Clock, User, X, Plus, CalendarPlus } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/Button';
import { Select, Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

interface Turno {
  id: string;
  fecha: string;
  hora: string;
  clase: string;
  instructor?: string;
  estado: string;
  usuario: { id: string; nombre: string; apellido: string; telefono?: string };
  archivado?: boolean;
  archivadoEn?: string | null;
}

interface Usuario {
  id: string;
  dni: string;
  nombre: string;
  apellido: string;
}

interface Actividad {
  id: string;
  nombre: string;
  color: string;
  activo: boolean;
}

export default function TurnosPage() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ usuarioId: '', fecha: '', hora: '09:00', clase: '', instructor: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [vista, setVista] = useState<'todos' | 'hoy'>('todos');

  const fetchTurnos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/turnos');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al cargar turnos');
        setTurnos([]);
      } else {
        setTurnos(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError('Error de conexión');
      setTurnos([]);
    }
    finally { setLoading(false); }
  }, []);

  const fetchUsuarios = useCallback(async () => {
    try {
      const res = await fetch('/api/users?pageSize=100');
      const data = await res.json();
      setUsuarios(data.data?.map((u: Usuario) => ({ id: u.id, dni: u.dni, nombre: u.nombre, apellido: u.apellido })) || []);
    } catch { console.error('Error'); }
  }, []);

  const fetchActividades = useCallback(async () => {
    try {
      const res = await fetch('/api/actividades');
      const data = await res.json();
      setActividades(Array.isArray(data) ? data.filter((a: Actividad) => a.activo) : []);
    } catch { console.error('Error'); }
  }, []);

  useEffect(() => { fetchTurnos(); fetchUsuarios(); fetchActividades(); }, [fetchTurnos, fetchUsuarios, fetchActividades]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const fechaConHora = new Date(`${formData.fecha}T${formData.hora}:00`);
      const res = await fetch('/api/turnos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, fecha: fechaConHora.toISOString(), usuarioId: formData.usuarioId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setModalOpen(false);
      setFormData({ usuarioId: '', fecha: '', hora: '09:00', clase: '', instructor: '' });
      fetchTurnos();
    } catch (err) { setError(err instanceof Error ? err.message : 'Error'); }
    finally { setSaving(false); }
  };

  const handleCancelar = async (turnoId: string) => {
    if (!confirm('¿Cancelar?')) return;
    try {
      await fetch('/api/turnos/modificar', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ turnoId, accion: 'cancelar' }) });
      fetchTurnos();
    } catch { alert('Error'); }
  };

  const estadoColors: Record<string, string> = { RESERVADO: 'bg-blue-100 text-blue-800', CANCELADO: 'bg-gray-100 text-gray-800', COMPLETADO: 'bg-green-100 text-green-800', NO_ASISTIO: 'bg-red-100 text-red-800' };

  const proximosDias = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));
  const diasAMostrar = vista === 'hoy' ? [new Date()] : proximosDias;
  const hoy = format(new Date(), 'yyyy-MM-dd');

  const turnosPorDia = proximosDias.reduce((acc, fecha) => {
    const fechaStr = format(fecha, 'yyyy-MM-dd');
    acc[fechaStr] = turnos.filter(t => format(new Date(t.fecha), 'yyyy-MM-dd') === fechaStr);
    return acc;
  }, {} as Record<string, Turno[]>);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Turnos</h1>
          <p className="text-sm text-gray-500">{turnos.length} turno{turnos.length !== 1 ? 's' : ''} en total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setVista('hoy')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${vista === 'hoy' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Hoy</button>
          <button onClick={() => setVista('todos')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${vista === 'todos' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Todos</button>
        </div>
        <Button onClick={() => setModalOpen(true)} className="w-full sm:w-auto">
          <Plus size={18} className="mr-2" />
          Nuevo Turno
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {loading ? (
        <p className="text-center text-gray-500 py-8">Cargando...</p>
      ) : turnos.length === 0 ? (
        <div className="text-center py-12">
          <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No hay turnos registrados</p>
          <p className="text-sm text-gray-400 mt-1">Hacé clic en &quot;Nuevo Turno&quot; para crear uno</p>
        </div>
      ) : (
        <div className="space-y-4">
          {diasAMostrar.map((fecha) => {
            const fechaStr = format(fecha, 'yyyy-MM-dd');
            const turnosDelDia = turnosPorDia[fechaStr] || [];
            const esHoy = fechaStr === hoy;
            
            return (
              <div key={fechaStr} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar size={20} className={esHoy ? 'text-blue-600' : 'text-gray-400'} />
                  <h2 className={`text-lg font-semibold ${esHoy ? 'text-blue-600' : 'text-gray-900'}`}>
                    {format(fecha, "EEEE, d 'de' MMMM", { locale: es })}
                    {esHoy && <span className="ml-2 text-sm font-normal">(Hoy)</span>}
                  </h2>
                  <span className="ml-auto text-sm text-gray-500">{turnosDelDia.length} turno{turnosDelDia.length !== 1 ? 's' : ''}</span>
                </div>
                
                {turnosDelDia.length === 0 ? (
                  <p className="text-center text-gray-400 py-4">No hay turnos</p>
                ) : (
                  <div className="space-y-3">
                    {turnosDelDia.map((turno) => (
                      <div key={turno.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Clock size={24} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{turno.hora} - {turno.clase}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <User size={14} />
                              <span>{turno.usuario.nombre} {turno.usuario.apellido}</span>
                              {turno.instructor && <span>• {turno.instructor}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-14 sm:ml-0">
                          <a href={`/api/turnos/${turno.id}/calendario`} download className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Agregar a calendario">
                            <CalendarPlus size={18} />
                          </a>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${estadoColors[turno.estado]}`}>{turno.estado}</span>
                          {turno.estado === 'RESERVADO' && (
                            <Button variant="outline" size="sm" onClick={() => handleCancelar(turno.id)}>Cancelar</Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo Turno">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
          <Select label="Alumno" value={formData.usuarioId} onChange={(e) => setFormData({...formData, usuarioId: e.target.value})}
            options={[{ value: '', label: 'Seleccionar...' }, ...usuarios.map(u => ({ value: u.id, label: `${u.nombre} ${u.apellido}` }))]} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Fecha" type="date" value={formData.fecha} onChange={(e) => setFormData({...formData, fecha: e.target.value})} min={format(new Date(), 'yyyy-MM-dd')} required />
            <Input label="Hora" type="time" value={formData.hora} onChange={(e) => setFormData({...formData, hora: e.target.value})} required />
          </div>
          <Select label="Actividad" value={formData.clase} onChange={(e) => setFormData({...formData, clase: e.target.value})}
            options={[{ value: '', label: 'Seleccionar...' }, ...actividades.map(a => ({ value: a.nombre, label: a.nombre }))]} required />
          <Input label="Instructor (opcional)" value={formData.instructor} onChange={(e) => setFormData({...formData, instructor: e.target.value})} />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Crear</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
