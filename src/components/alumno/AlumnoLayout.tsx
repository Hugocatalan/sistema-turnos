'use client';

import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { Calendar, Clock, User, MessageSquare, LogOut, Menu, X, Home, Users, CreditCard, Settings, Bot } from 'lucide-react';
import { useState, useEffect } from 'react';
import { UsuarioSession } from '@/types';

interface Props {
  children: React.ReactNode;
  user: UsuarioSession;
}

const navItems = [
  { href: '/alumno', icon: Home, label: 'Inicio' },
  { href: '/alumno/mis-turnos', icon: Clock, label: 'Mis Turnos' },
  { href: '/alumno/perfil', icon: User, label: 'Mi Perfil' },
];

export function AlumnoLayout({ children, user }: Props) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'bot'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [empresaNombre, setEmpresaNombre] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [userImage, setUserImage] = useState('');

  useEffect(() => {
    setMounted(true);
    Promise.all([
      fetch('/api/config').then(res => res.json()),
      fetch('/api/users/me').then(res => res.json())
    ]).then(([configData, userData]) => {
      if (configData.nombreEmpresa) setEmpresaNombre(configData.nombreEmpresa);
      if (configData.logoUrl) setLogoUrl(configData.logoUrl);
      if (userData.imagenUrl) setUserImage(userData.imagenUrl);
    }).catch(() => {});
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Cargando...</div>
      </div>
    );
  }

  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      const res = await fetch('/api/chatbot/pregunta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta: userMessage })
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'bot', content: data.respuesta || 'No pude entender tu pregunta.' }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'bot', content: 'Error al procesar. Intentá de nuevo.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <nav className="bg-white shadow-sm sticky top-0 z-40 flex-shrink-0">
        <div className="px-4">
          <div className="flex justify-between h-14">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)} 
                className="p-2 rounded-lg hover:bg-gray-100 md:hidden"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <Link href="/alumno" className="flex items-center gap-2">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-9 w-auto object-contain" />
                ) : (
                  <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Calendar size={18} className="text-white" />
                  </div>
                )}
                <span className="font-bold text-gray-900 hidden sm:block">{empresaNombre || 'Reserva de Turnos'}</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setChatOpen(true)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                <MessageSquare size={22} />
              </button>
              <button 
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-1">
        <aside className={clsx(
          "fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:flex-shrink-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                {userImage ? (
                  <img src={userImage} alt="Perfil" className="w-11 h-11 rounded-full object-cover ring-2 ring-white" />
                ) : (
                  <div className="w-11 h-11 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-white">
                    <User size={22} className="text-gray-600" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{user.nombre} {user.apellido}</p>
                  <p className="text-xs text-gray-500">DNI: {user.dni}</p>
                </div>
              </div>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map(item => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={clsx(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm",
                      isActive ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
                    )}>
                    <item.icon size={20} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="p-3 border-t">
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={20} />
                Cerrar sesión
              </button>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 md:hidden" 
            onClick={() => setSidebarOpen(false)} 
          />
        )}

        <main className="flex-1 p-4 md:p-6 min-h-[calc(100vh-56px)] overflow-x-hidden">
          {children}
        </main>
      </div>

      {chatOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setChatOpen(false)} />
          <div className="absolute right-0 bottom-0 left-0 md:right-4 md:bottom-4 md:left-auto md:w-96 bg-white rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <MessageSquare size={20} className="text-blue-600" />
                <h3 className="font-semibold">Asistente</h3>
              </div>
              <button onClick={() => setChatOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[250px] max-h-[400px]">
              {chatMessages.length === 0 && (
                <p className="text-center text-gray-500 text-sm py-8">
                  ¡Hola! Preguntame lo que necesites.
                </p>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={clsx(
                  "p-3 rounded-lg max-w-[85%] text-sm",
                  msg.role === "user" ? "bg-blue-600 text-white ml-auto" : "bg-gray-100 mr-auto"
                )}>
                  {msg.content}
                </div>
              ))}
              {chatLoading && (
                <div className="bg-gray-100 rounded-lg p-3 max-w-[85%]">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Escribí tu pregunta..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  disabled={chatLoading}
                />
                <button 
                  onClick={sendMessage} 
                  disabled={chatLoading || !chatInput.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
