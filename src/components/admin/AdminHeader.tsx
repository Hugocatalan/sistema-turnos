'use client';

import { signOut } from 'next-auth/react';
import { LogOut, User, Menu } from 'lucide-react';
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
    <header className="bg-white border-b border-gray-200 px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
        <div className="pl-8 sm:pl-0 text-center sm:text-left min-w-0 order-2 sm:order-1">
          <h2 className="text-sm sm:text-lg md:text-xl font-semibold text-gray-900 truncate">
            Hola, {user.nombre}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 truncate">
            {config?.nombreEmpresa ? `Administrando ${config.nombreEmpresa}` : 'Panel de Administración'}
          </p>
        </div>

        <div className="flex items-center justify-end gap-1 sm:gap-2 md:gap-4 flex-shrink-0 order-1 sm:order-2">
          <div className="hidden sm:flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-gray-200">
            <div className="text-right min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.nombre}</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User size={20} className="text-blue-600" />
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-xs px-2 sm:px-3"
          >
            <LogOut size={16} className="mr-1" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
