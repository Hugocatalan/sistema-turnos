'use client';

import { useState, Suspense, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const errorParam = searchParams.get('error');

  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [config, setConfig] = useState<{ nombreEmpresa?: string; logoUrl?: string; colorPrimario?: string } | null>(null);

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => { 
        if (data.id) setConfig(data);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn(isAdmin ? 'admin' : 'credentials', {
        dni,
        password: isAdmin ? password : undefined,
        redirect: false
      });

      if (result?.error) {
        setError(result.error === 'CredentialsSignin' ? 'Credenciales incorrectas' : result.error);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('Error al intentar iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const colorPrimario = config?.colorPrimario || '#3B82F6';
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br p-4" style={{ background: `linear-gradient(135deg, ${colorPrimario} 0%, ${colorPrimario}cc 100%)` }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            {config?.logoUrl ? (
              <div className="w-20 h-20 mx-auto mb-3 rounded-xl overflow-hidden flex items-center justify-center bg-gray-50">
                <img src={config.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: colorPrimario + '20' }}>
                <svg className="w-6 h-6" style={{ color: colorPrimario }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            <h1 className="text-xl font-bold text-gray-900">{config?.nombreEmpresa || 'Bienvenido'}</h1>
            <p className="text-gray-500 mt-1 text-sm">Ingresá tu DNI para continuar</p>
          </div>

          {errorParam && !error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {errorParam === 'CredentialsSignin' ? 'Credenciales incorrectas' : errorParam}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => setIsAdmin(false)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  !isAdmin
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Alumno
              </button>
              <button
                type="button"
                onClick={() => setIsAdmin(true)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  isAdmin
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Admin
              </button>
            </div>

            <Input
              id="dni"
              type="text"
              label="DNI"
              placeholder="Ej: 12345678"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              required
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={10}
            />

            {isAdmin && (
              <Input
                id="password"
                type="password"
                label="Contraseña"
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            )}

            <Button type="submit" className="w-full" loading={loading}>
              Ingresar
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            ¿No tenés cuenta? Contactá al administrador
          </p>
        </div>

        <p className="text-center text-white/80 text-sm mt-6">
          © {new Date().getFullYear()} {config?.nombreEmpresa || 'Sistema de Reservas'}
        </p>
      </div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 animate-pulse">
        <div className="h-12 bg-gray-200 rounded mb-4" />
        <div className="h-6 bg-gray-200 rounded w-2/3 mx-auto" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
