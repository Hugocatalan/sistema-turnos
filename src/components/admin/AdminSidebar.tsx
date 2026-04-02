'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { clsx } from 'clsx';
import { Users, Calendar, Settings, MessageSquare, LayoutDashboard, CreditCard, Menu, X, Home, Bot, Palette, Activity, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

const items = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/usuarios', icon: Users, label: 'Usuarios' },
  { href: '/admin/actividades', icon: Activity, label: 'Actividades' },
  { href: '/admin/turnos', icon: Calendar, label: 'Turnos' },
  { href: '/admin/membresias', icon: CreditCard, label: 'Membresías' },
  { href: '/admin/recomendaciones', icon: MessageCircle, label: 'Recomendaciones' },
  { href: '/admin/chatbot', icon: Bot, label: 'Chatbot' },
  { href: '/admin/configuracion', icon: Settings, label: 'Config' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [config, setConfig] = useState<{ nombreEmpresa?: string; logoUrl?: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    fetch('/api/config')
      .then(res => res.json())
      .then(data => { if (data.id) setConfig(data); })
      .catch(() => {});
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <button 
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-50 p-2 bg-gray-900 text-white rounded-lg md:hidden shadow-lg"
      >
        <Menu size={20} />
      </button>

      <aside className={clsx(
        "fixed inset-y-0 left-0 z-50 w-56 sm:w-64 bg-gray-900 text-white flex flex-col transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:h-screen md:flex-shrink-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-3 sm:p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h1 className="text-sm sm:text-lg font-bold flex items-center gap-2 min-w-0">
              {config?.logoUrl ? (
                <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded object-contain bg-white p-1 flex-shrink-0">
                  <Image src={config.logoUrl} alt="Logo" fill className="object-contain" />
                </div>
              ) : (
                <span className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <LayoutDashboard size={14} className="text-white sm:w-[18px]" />
                </span>
              )}
              <span className="truncate hidden xs:inline">{config?.nombreEmpresa || 'Admin'}</span>
            </h1>
            <button 
              onClick={() => setMobileOpen(false)}
              className="p-1 hover:bg-gray-800 rounded md:hidden flex-shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-2 sm:p-3 space-y-1 overflow-y-auto">
          {items.map(item => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  "flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg transition-colors text-xs sm:text-sm",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
              >
                <item.icon size={16} className="sm:w-[20px]" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <p className="text-xs text-gray-500">v1.0.0</p>
        </div>
      </aside>

      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
