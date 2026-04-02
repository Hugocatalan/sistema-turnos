'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, CheckCircle, XCircle, User, Loader2 } from 'lucide-react';
import { Select } from '@/components/ui/Input';

interface UsuarioEstadistica {
  id: string;
  dni: string;
  nombre: string;
  apellido: string;
  estadoMembresia: 'ACTIVA' | 'VENCIDA' | 'SUSPENDIDA';
  fechaVencimiento?: string;
  diasRestantes: number | null;
  estadoCalculado: 'ACTIVO' | 'VENCIDO' | 'POR_VENCER' | 'SIN_FECHA';
  _count: { turnos: { _count: number } };
}

interface Resumen { total: number; activos: number; vencidos: number; suspendidos: number; porVencer: number; }

export default function MembresiasPage() {
  const [usuarios, setUsuarios] = useState<UsuarioEstadistica[]>([]);
  const [resumen, setResumen] = useState<Resumen>({ total: 0, activos: 0, vencidos: 0, suspendidos: 0, porVencer: 0 });
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const params = filtroEstado ? `?estado=${filtroEstado}` : '';
        const res = await fetch(`/api/users/estadisticas${params}`);
        const data = await res.json();
        setUsuarios(data.usuarios || []);
        setResumen(data.resumen || { total: 0, activos: 0, vencidos: 0, suspendidos: 0, porVencer: 0 });
      } catch { console.error('Error'); }
      finally { setLoading(false); }
    }
    fetchData();
  }, [filtroEstado]);

  const estadoColors: Record<string, string> = { ACTIVO: 'bg-green-500', VENCIDO: 'bg-red-500', POR_VENCER: 'bg-yellow-500', SIN_FECHA: 'bg-gray-400' };
  const estadoTextColors: Record<string, string> = { ACTIVO: 'text-green-700', VENCIDO: 'text-red-700', POR_VENCER: 'text-yellow-700', SIN_FECHA: 'text-gray-600' };

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Membresías</h1>
        <p className="text-sm text-gray-500">Control de pagos</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-500">Total</p>
              <p className="text-2xl md:text-3xl font-bold">{resumen.total}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <User size={20} className="text-blue-600 md:w-6 md:h-6" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-500">Activas</p>
              <p className="text-2xl md:text-3xl font-bold text-green-600">{resumen.activos}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600 md:w-6 md:h-6" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-500">Por Vencer</p>
              <p className="text-2xl md:text-3xl font-bold text-yellow-600">{resumen.porVencer}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock size={20} className="text-yellow-600 md:w-6 md:h-6" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-500">Vencidas</p>
              <p className="text-2xl md:text-3xl font-bold text-red-600">{resumen.vencidos}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600 md:w-6 md:h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <Select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
          options={[{ value: '', label: 'Todos' }, { value: 'ACTIVA', label: 'Activas' }, { value: 'VENCIDA', label: 'Vencidas' }, { value: 'SUSPENDIDA', label: 'Suspendidas' }]}
          className="w-full sm:w-48" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                <th className="px-4 py-3">Alumno</th>
                <th className="px-4 py-3 hidden sm:table-cell">DNI</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 hidden md:table-cell">Días</th>
                <th className="px-4 py-3 hidden lg:table-cell">Vencimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center"><Loader2 className="animate-spin mx-auto" size={24} /></td></tr>
              ) : usuarios.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">No hay alumnos</td></tr>
              ) : usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 text-sm">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-8 rounded-full ${estadoColors[u.estadoCalculado]}`} />
                      <span className="font-medium">{u.nombre} {u.apellido}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono hidden sm:table-cell">{u.dni}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${u.estadoMembresia === 'ACTIVA' ? 'bg-green-100 text-green-800' : u.estadoMembresia === 'VENCIDA' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {u.estadoMembresia}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`text-lg font-bold ${u.diasRestantes === null ? 'text-gray-400' : u.diasRestantes < 0 ? 'text-red-600' : u.diasRestantes <= 7 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {u.diasRestantes === null ? '-' : Math.abs(u.diasRestantes)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                    {u.fechaVencimiento ? new Date(u.fechaVencimiento).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
