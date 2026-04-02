'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, Edit2, X, Check, AlertCircle, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';

interface Turno {
  id: string;
  fecha: string;
  hora: string;
  clase: string;
  instructor?: string;
  estado: 'RESERVADO' | 'CANCELADO' | 'COMPLETADO' | 'NO_ASISTIO';
}

interface Reglas {
  horasMinimasAntelacion: number;
  permiteCancelar: boolean;
  permiteReprogramar: boolean;
  maxCambiosPorSemana: number;
  mensajePersonalizado?: string;
}

export default function MisTurnosPage() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [reglas, setReglas] = useState<Reglas | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'proximos' | 'pasados'>('proximos');
  const [modalOpen, setModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedTurno, setSelectedTurno] = useState<Turno | null>(null);
  const [formData, setFormData] = useState({ nuevaFecha: '', nuevaHora: '' });
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [turnosRes, reglasRes] = await Promise.all([
        fetch('/api/turnos'),
        fetch('/api/config/reglas')
      ]);
      const turnosData = await turnosRes.json();
      const reglasData = await reglasRes.json();
      setTurnos(Array.isArray(turnosData) ? turnosData : []);
      setReglas(reglasData);
    } catch { console.error('Error'); }
    finally { setLoading(false); }
  };

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const turnosProximos = turnos.filter(t =>
    t.estado === 'RESERVADO' && new Date(t.fecha) >= hoy
  );
  const turnosPasados = turnos.filter(t =>
    t.estado !== 'RESERVADO' || new Date(t.fecha) < hoy
  );

  const displayedTurnos = tab === 'proximos' ? turnosProximos : turnosPasados;

  const puedeModificar = (turno: Turno) => {
    if (turno.estado !== 'RESERVADO') return false;
    if (!reglas) return false;
    const fechaTurno = new Date(turno.fecha);
    const horasRestantes = (fechaTurno.getTime() - Date.now()) / (1000 * 60 * 60);
    return horasRestantes >= reglas.horasMinimasAntelacion;
  };

  const handleReprogramar = (turno: Turno) => {
    setSelectedTurno(turno);
    setFormData({ nuevaFecha: '', nuevaHora: '' });
    setMessage({ type: '', text: '' });
    setModalOpen(true);
  };

  const handleCancelar = (turno: Turno) => {
    setSelectedTurno(turno);
    setMessage({ type: '', text: '' });
    setCancelModalOpen(true);
  };

  const submitCambio = async (accion: 'reprogramar' | 'cancelar') => {
    if (!selectedTurno) return;
    setProcessing(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/turnos/modificar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turnoId: selectedTurno.id,
          accion,
          nuevaFecha: accion === 'reprogramar' ? formData.nuevaFecha : undefined,
          nuevaHora: accion === 'reprogramar' ? formData.nuevaHora : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.mensaje || 'Error');

      setMessage({ type: 'success', text: data.message || 'Cambio realizado' });
      setTimeout(() => {
        setModalOpen(false);
        setCancelModalOpen(false);
        setSelectedTurno(null);
        fetchData();
      }, 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error' });
    } finally {
      setProcessing(false);
    }
  };

  const estadoColors = {
    RESERVADO: 'bg-blue-100 text-blue-800',
    CANCELADO: 'bg-gray-100 text-gray-800',
    COMPLETADO: 'bg-green-100 text-green-800',
    NO_ASISTIO: 'bg-red-100 text-red-800'
  };

  const horariosBase = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '14:00', '15:00', '16:00', '17:00', '18:00',
    '19:00', '20:00', '21:00'
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis Turnos</h1>
        <p className="text-gray-500">Gestión de tus reservas</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex border-b border-gray-100">
          <button onClick={() => setTab('proximos')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
              tab === 'proximos' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent'
            }`}>
            Próximos ({turnosProximos.length})
          </button>
          <button onClick={() => setTab('pasados')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
              tab === 'pasados' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent'
            }`}>
            Historial ({turnosPasados.length})
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <p className="text-center text-gray-500 py-12">Cargando...</p>
          ) : displayedTurnos.length === 0 ? (
            <div className="text-center py-12">
              <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                {tab === 'proximos' ? 'No tenés turnos reservados' : 'No hay turnos en el historial'}
              </p>
              {tab === 'proximos' && (
                <Button className="mt-4" onClick={() => window.location.href = '/usuario'}>
                  Reservar Turno
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {displayedTurnos.map((turno) => (
                <div key={turno.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center ${
                      turno.estado === 'RESERVADO' ? 'bg-blue-100' : 'bg-gray-200'
                    }`}>
                      <span className={`text-lg font-bold ${turno.estado === 'RESERVADO' ? 'text-blue-600' : 'text-gray-500'}`}>
                        {format(new Date(turno.fecha), 'd')}
                      </span>
                      <span className={`text-xs ${turno.estado === 'RESERVADO' ? 'text-blue-500' : 'text-gray-400'}`}>
                        {format(new Date(turno.fecha), 'MMM', { locale: es })}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{turno.clase}</p>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {turno.hora}
                        </span>
                        {turno.instructor && <span>• {turno.instructor}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-16 sm:ml-0">
                    {turno.estado === 'RESERVADO' && (
                      <a href={`/api/turnos/${turno.id}/calendario`} download className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Agregar a calendario">
                        <CalendarPlus size={18} />
                      </a>
                    )}
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${estadoColors[turno.estado]}`}>
                      {turno.estado === 'RESERVADO' ? 'Confirmado' : turno.estado}
                    </span>
                    {turno.estado === 'RESERVADO' && puedeModificar(turno) && (
                      <div className="flex gap-2">
                        {reglas?.permiteReprogramar && (
                          <Button variant="outline" size="sm" onClick={() => handleReprogramar(turno)}>
                            <Edit2 size={14} />
                          </Button>
                        )}
                        {reglas?.permiteCancelar && (
                          <Button variant="outline" size="sm" onClick={() => handleCancelar(turno)}>
                            <X size={14} />
                          </Button>
                        )}
                      </div>
                    )}
                    {turno.estado === 'RESERVADO' && !puedeModificar(turno) && reglas && (
                      <span className="text-xs text-gray-400 hidden sm:inline">
                        Cambios con {reglas.horasMinimasAntelacion}h
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Reprogramar Turno">
        {message.text && (
          <div className={`p-3 rounded-lg text-sm mb-4 ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}
        {selectedTurno && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Turno actual:</p>
              <p className="font-medium">{selectedTurno.clase} - {format(new Date(selectedTurno.fecha), "d/MM/yyyy")} {selectedTurno.hora}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nueva Fecha"
                type="date"
                value={formData.nuevaFecha}
                onChange={(e) => setFormData({...formData, nuevaFecha: e.target.value})}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
              <Select
                label="Nueva Hora"
                value={formData.nuevaHora}
                onChange={(e) => setFormData({...formData, nuevaHora: e.target.value})}
                options={[
                  { value: '', label: 'Seleccionar...' },
                  ...horariosBase.map(h => ({ value: h, label: h }))
                ]}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
              <Button onClick={() => submitCambio('reprogramar')} loading={processing} className="flex-1"
                disabled={!formData.nuevaFecha || !formData.nuevaHora}>
                <Check size={16} className="mr-2" />
                Confirmar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={cancelModalOpen} onClose={() => setCancelModalOpen(false)} title="Cancelar Turno">
        {message.text && (
          <div className={`p-3 rounded-lg text-sm mb-4 ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}
        {selectedTurno && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">¿Estás seguro?</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Se cancelará el turno de {selectedTurno.clase} del {format(new Date(selectedTurno.fecha), "d 'de' MMMM", { locale: es })} a las {selectedTurno.hora}.
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setCancelModalOpen(false)} className="flex-1">Volver</Button>
              <Button variant="danger" onClick={() => submitCambio('cancelar')} loading={processing} className="flex-1">
                <X size={16} className="mr-2" />
                Cancelar Turno
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
