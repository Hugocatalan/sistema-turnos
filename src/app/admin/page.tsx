'use client';

import { useEffect, useState } from 'react';
import { Users, Calendar, AlertTriangle, TrendingUp, Clock, CheckCircle, Loader2 } from 'lucide-react';

interface Stats {
  totalUsuarios: number;
  turnosHoy: number;
  vencidas: number;
  porVencer: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalUsuarios: 0, turnosHoy: 0, vencidas: 0, porVencer: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [usersRes, turnosRes, statsRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/turnos?fecha=' + new Date().toISOString().split('T')[0]),
          fetch('/api/users/estadisticas')
        ]);
        const users = await usersRes.json();
        const turnos = await turnosRes.json();
        const estadisticas = await statsRes.json();
        setStats({
          totalUsuarios: users.total || 0,
          turnosHoy: Array.isArray(turnos) ? turnos.length : 0,
          vencidas: estadisticas.resumen?.vencidos || 0,
          porVencer: estadisticas.resumen?.porVencer || 0
        });
      } catch (e) { console.error('Error:', e); }
      finally { setLoading(false); }
    }
    fetchStats();
  }, []);

  const cards = [
    { title: 'Total Alumnos', value: stats.totalUsuarios, icon: Users, color: 'bg-blue-500', trend: '+12%' },
    { title: 'Turnos Hoy', value: stats.turnosHoy, icon: Calendar, color: 'bg-green-500', trend: '+5%' },
    { title: 'Vencidas', value: stats.vencidas, icon: AlertTriangle, color: 'bg-red-500', trend: '-3%' },
    { title: 'Por Vencer', value: stats.porVencer, icon: Clock, color: 'bg-yellow-500', trend: '+8%' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm md:text-base text-gray-500">Resumen de actividad</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {cards.map((card) => (
          <div key={card.title} className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-500 font-medium">{card.title}</p>
                {loading ? (
                  <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mt-1" />
                ) : (
                  <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                )}
              </div>
              <div className={`${card.color} p-2 md:p-3 rounded-xl`}>
                <card.icon size={20} className="text-white md:w-6 md:h-6" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1">
              <TrendingUp size={12} className="text-green-500" />
              <span className="text-xs text-green-500 font-medium">{card.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={16} className="text-blue-600 md:w-5 md:h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">Nuevo turno reservado</p>
                  <p className="text-xs text-gray-500">Hace {i * 15} minutos</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Próximos Turnos</h3>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Usuario #{i}</p>
                  <p className="text-xs text-gray-500">Spinning - 18:00</p>
                </div>
                <span className="text-xs text-blue-600 font-medium">En {i}h</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
