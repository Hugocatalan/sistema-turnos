'use client';

import { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, addWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, Check, Loader2, Clock, CalendarPlus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface Horario {
  id: string;
  clase: string;
  horaInicio: string;
  horaFin: string;
  dia: number;
  instructor?: string;
}

interface Turno {
  id: string;
  fecha: string;
  hora: string;
  clase: string;
  estado: string;
}

interface Actividad {
  id: string;
  nombre: string;
  color: string;
  activo: boolean;
}

interface Recomendacion {
  id: string;
  texto: string;
  color: string;
  activa: boolean;
}

const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function AlumnoReservarPage() {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [recomendaciones, setRecomendaciones] = useState<Recomendacion[]>([]);
  const [selectedClase, setSelectedClase] = useState('');
  const [selectedFecha, setSelectedFecha] = useState<Date | null>(null);
  const [selectedHora, setSelectedHora] = useState('');
  const [selectedHorario, setSelectedHorario] = useState<Horario | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [reservando, setReservando] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hRes, tRes, aRes, rRes] = await Promise.all([
        fetch('/api/horarios'),
        fetch('/api/turnos'),
        fetch('/api/actividades'),
        fetch('/api/recomendaciones')
      ]);
      const hData = await hRes.json();
      const tData = await tRes.json();
      const aData = await aRes.json();
      const rData = await rRes.json();
      setHorarios(Array.isArray(hData) ? hData : []);
      setTurnos(Array.isArray(tData) ? tData : []);
      setActividades(Array.isArray(aData) ? aData.filter((a: Actividad) => a.activo) : []);
      setRecomendaciones(Array.isArray(rData) ? rData.filter((r: Recomendacion) => r.activa) : []);
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const semana = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const handleSelectDia = (fecha: Date) => {
    setSelectedFecha(fecha);
    setSelectedClase('');
    setSelectedHora('');
    setSelectedHorario(null);
  };

  const getHorariosDelDia = () => {
    if (!selectedFecha || !selectedClase) return [];
    const diaSemana = selectedFecha.getDay();
    return horarios.filter(h => h.dia === diaSemana && h.clase === selectedClase);
  };

  const isReservado = (hora: string) => {
    if (!selectedFecha) return false;
    return turnos.some(t => {
      const fechaTurno = new Date(t.fecha);
      return (
        format(fechaTurno, 'yyyy-MM-dd') === format(selectedFecha, 'yyyy-MM-dd') &&
        t.hora === hora &&
        t.estado === 'RESERVADO'
      );
    });
  };

  const handleReservar = async () => {
    if (!selectedFecha || !selectedClase || !selectedHora) return;
    setReservando(true);
    setError('');

    try {
      const res = await fetch('/api/turnos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha: selectedFecha.toISOString(),
          hora: selectedHora,
          clase: selectedClase,
          instructor: selectedHorario?.instructor
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');

      const fecha = new Date(selectedFecha);
      const [hora, minuto] = selectedHora.split(':').map(Number);
      fecha.setHours(hora, minuto, 0, 0);
      const fechaFin = new Date(fecha);
      fechaFin.setHours(fechaFin.getHours() + 1);

      const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

      const title = encodeURIComponent(`Reserva: ${selectedClase}`);
      const details = encodeURIComponent(
        `📅 Actividad: ${selectedClase}\n` +
        `🕐 Hora: ${selectedHora}\n` +
        `📍 Turno reservado`
      );
      const location = encodeURIComponent('');

      const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatDate(fecha)}/${formatDate(fechaFin)}&details=${details}&location=${location}`;

      setModalOpen(false);
      setSelectedClase('');
      setSelectedFecha(null);
      setSelectedHora('');
      setSelectedHorario(null);
      fetchData();

      window.open(googleUrl, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setReservando(false);
    }
  };

  const hoy = format(new Date(), 'yyyy-MM-dd');

  const turnosReservados = turnos.filter(t => t.estado === 'RESERVADO');
  const proximoTurno = turnosReservados
    .filter(t => new Date(t.fecha) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())[0];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reservar Turno</h1>
        <p className="text-gray-500">Elegí tu clase y horario</p>
      </div>

      {proximoTurno && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={20} />
            <span className="text-sm font-medium opacity-90">Tu próximo turno</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold">{proximoTurno.clase}</h3>
              <div className="flex items-center gap-4 mt-2 text-sm opacity-90">
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {format(new Date(proximoTurno.fecha), "EEEE d 'de' MMMM", { locale: es })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {proximoTurno.hora}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <a href={`/api/turnos/${proximoTurno.id}/calendario`} target="_blank" 
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
                <CalendarPlus size={16} />
                Ver en Calendar
              </a>
              <a href="/usuario/mis-turnos"
                className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 hover:bg-white/90 rounded-lg text-sm font-medium transition-colors">
                Ver todos
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      )}

      {recomendaciones.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recomendaciones</h3>
          <div className="space-y-3">
            {recomendaciones.map((rec) => (
              <div key={rec.id} className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: rec.color }} />
                <p className="text-sm text-gray-700">{rec.texto}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Loader2 className="animate-spin mx-auto mb-4" size={32} />
          <p className="text-gray-500">Cargando horarios...</p>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-white via-white to-blue-50 rounded-2xl shadow-lg border border-blue-100 p-6 md:p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-full mb-4">
              <Calendar size={28} className="text-blue-600" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Reserva tu turno aquí</h2>
            <p className="text-gray-500">Selecciona el día y horario que más te convenga</p>
          </div>

          <div className="flex items-center justify-between mb-6 bg-gray-50 rounded-xl p-2">
            <Button variant="outline" size="sm" onClick={() => setWeekStart(addWeeks(weekStart, -1))}>
              <ChevronLeft size={18} />
            </Button>
            <p className="font-bold text-lg">{format(weekStart, "MMMM yyyy", { locale: es })}</p>
            <Button variant="outline" size="sm" onClick={() => setWeekStart(addWeeks(weekStart, 1))}>
              <ChevronRight size={18} />
            </Button>
          </div>

          <div className="flex overflow-x-auto gap-3 pb-4 mb-6 -mx-2 px-2">
            {semana.map((fecha) => {
              const esHoy = format(fecha, 'yyyy-MM-dd') === hoy;
              const esPasado = fecha < new Date(new Date().setHours(0, 0, 0, 0));
              const sel = selectedFecha && format(fecha, 'yyyy-MM-dd') === format(selectedFecha, 'yyyy-MM-dd');
              return (
                <button
                  key={fecha.toISOString()}
                  onClick={() => !esPasado && handleSelectDia(fecha)}
                  disabled={esPasado}
                  className={`flex-shrink-0 p-4 rounded-2xl text-center min-w-[80px] transition-all duration-200 hover:scale-105 ${
                    esPasado ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50' :
                    sel ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-200' :
                    esHoy ? 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 border-2 border-blue-300 shadow-md' :
                    'bg-white hover:bg-blue-50 text-gray-700 border border-gray-200 hover:border-blue-200 hover:shadow-md'
                  }`}
                >
                  <p className="text-xs font-medium uppercase">{format(fecha, 'EEE', { locale: es })}</p>
                  <p className="text-2xl font-bold mt-1">{format(fecha, 'd')}</p>
                  {esHoy && <p className="text-xs font-bold mt-1 text-blue-600">HOY</p>}
                </button>
              );
            })}
          </div>

          {selectedFecha && (
            <div className="mt-8 animate-fadeIn">
              <div className="flex items-center gap-3 mb-6 bg-blue-50 p-4 rounded-xl">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <Calendar size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-lg">
                    {diasSemana[selectedFecha.getDay()]} {format(selectedFecha, "d 'de' MMMM", { locale: es })}
                  </p>
                  <p className="text-sm text-gray-500">{getHorariosDelDia().length} horarios disponibles</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm font-semibold mb-3 text-gray-700">Elegí una actividad:</p>
                {actividades.length === 0 ? (
                  <p className="text-gray-500 text-sm">No hay actividades disponibles</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {actividades.map(act => (
                      <button
                        key={act.id}
                        onClick={() => setSelectedClase(act.nombre)}
                        className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 ${
                          selectedClase === act.nombre 
                            ? 'text-white shadow-lg' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                        style={selectedClase === act.nombre ? { backgroundColor: act.color, boxShadow: `0 4px 14px ${act.color}40` } : {}}
                      >
                        {act.nombre}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedClase && (
                <div className="animate-fadeIn">
                  <p className="text-sm font-semibold mb-3 text-gray-700">Horarios disponibles:</p>
                  {getHorariosDelDia().length === 0 ? (
                    <p className="text-gray-500 text-sm">No hay horarios para {selectedClase} este día</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {getHorariosDelDia().map((h) => {
                        const reservado = isReservado(h.horaInicio);
                        return (
                          <button
                            key={h.id}
                            onClick={() => !reservado && (setSelectedHora(h.horaInicio), setSelectedHorario(h))}
                            disabled={reservado}
                            className={`p-4 rounded-xl text-center transition-all duration-200 hover:scale-105 ${
                              reservado 
                                ? 'bg-red-50 text-red-400 cursor-not-allowed border-2 border-red-200' 
                                : selectedHora === h.horaInicio 
                                  ? 'bg-gradient-to-br from-green-500 to-green-600 text-white border-2 border-green-500 shadow-lg shadow-green-200' 
                                  : 'bg-white hover:bg-green-50 border-2 border-gray-200 hover:border-green-300 hover:shadow-md'
                            }`}
                          >
                            <p className="font-bold text-lg">{h.horaInicio}</p>
                            {reservado && <p className="text-xs font-medium">Ocupado</p>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {selectedClase && selectedHora && (
                <Button className="w-full mt-8 py-4 text-lg font-bold" onClick={() => setModalOpen(true)}>
                  <Check size={22} className="mr-2" />
                  Reservar {selectedClase} - {selectedHora}
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Confirmar Reserva">
        <div className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg mb-4">{error}</div>}
          {selectedFecha && (
            <>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p><span className="text-gray-500">Fecha:</span> {format(selectedFecha, "d 'de' MMMM yyyy", { locale: es })}</p>
                <p><span className="text-gray-500">Hora:</span> {selectedHora}</p>
                <p><span className="text-gray-500">Actividad:</span> {selectedClase}</p>
              </div>
              <p className="text-sm text-gray-500">Al confirmar se abrirá Google Calendar para guardar el evento.</p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancelar</Button>
                <Button className="flex-1" onClick={handleReservar} loading={reservando}>Confirmar</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
