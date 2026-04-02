'use client';

import { signOut } from 'next-auth/react';
import { Bell, LogOut, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { UsuarioSession } from '@/types';
import { useEffect, useState } from 'react';

interface Props {
  user: UsuarioSession;
}

interface Config {
  nombreEmpresa: string;
  logoUrl?: string | null;
}

export function AdminHeader({ user }: Props) {
  const [config, setConfig] = useState<Config | null>(null);

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => { if (data.nombreEmpresa) setConfig(data); })
      .catch(() => {});
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
      <div className="flex items-center justify-between">
        <div className="pl-10 md:pl-0">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">
            Hola, {user.nombre}
          </h2>
          <p className="text-xs md:text-sm text-gray-500">
            {config?.nombreEmpresa ? `Administrando ${config.nombreEmpresa}` : 'Panel de Administración'}
          </p>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user.nombre}</p>
              <p className="text-xs text-gray-500">Administrador</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User size={20} className="text-blue-600" />
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-xs md:text-sm"
          >
            <LogOut size={16} className="mr-1" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
