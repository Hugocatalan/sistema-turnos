'use client';

import { useState, Suspense, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
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
  const [showPassword, setShowPassword] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [shake, setShake] = useState(false);
  const [config, setConfig] = useState<{ nombreEmpresa?: string; logoUrl?: string; colorPrimario?: string; tipoFondo?: string; fondoPersonalizado?: string } | null>(null);

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => { 
        if (data.id) setConfig(data);
      })
      .catch(() => {});
    setTimeout(() => setAnimate(true), 100);
  }, []);

  useEffect(() => {
    if (error || errorParam) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }, [error, errorParam]);

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
  
  const getBackground = () => {
    if (config?.tipoFondo === 'imagen' && config?.fondoPersonalizado) {
      return `url(${config.fondoPersonalizado})`;
    }
    if (config?.tipoFondo === 'gradiente' && config?.fondoPersonalizado) {
      return config.fondoPersonalizado;
    }
    return `linear-gradient(135deg, ${colorPrimario} 0%, ${colorPrimario}cc 100%)`;
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat p-4" style={{ 
      backgroundImage: getBackground(),
      backgroundSize: 'cover'
    }}>
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="relative w-full max-w-md">
        <div className={`bg-white/20 backdrop-blur-sm rounded-2xl shadow-2xl p-8 transition-all duration-500 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${shake ? 'animate-shake' : ''}`}>
          <div className="text-center mb-6">
            <div className="relative inline-block">
              {config?.logoUrl ? (
                <div className="w-20 h-20 mx-auto mb-3 rounded-xl overflow-hidden flex items-center justify-center bg-gray-50 animate-bounce">
                  <Image src={config.logoUrl} alt="Logo" fill className="object-contain" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse" style={{ backgroundColor: colorPrimario + '20' }}>
                  <svg className="w-10 h-10 animate-ping" style={{ color: colorPrimario }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            <h1 className="text-xl font-bold text-black">{config?.nombreEmpresa || 'Bienvenido'}</h1>
            <p className="text-black mt-1 text-sm">Ingresá tu DNI para continuar</p>
          </div>

          {errorParam && !error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-fadeIn">
              {errorParam === 'CredentialsSignin' ? 'Credenciales incorrectas' : errorParam}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-fadeIn">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => setIsAdmin(false)}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                  !isAdmin
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-black hover:bg-gray-200'
                }`}
              >
                Alumno
              </button>
              <button
                type="button"
                onClick={() => setIsAdmin(true)}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                  isAdmin
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-black hover:bg-gray-200'
                }`}
              >
                Admin
              </button>
            </div>

            <div className="relative">
              <Input
                id="dni"
                type="text"
                label="DNI"
                placeholder="Ej: 12345678"
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                required
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                className="transition-all duration-200 focus:scale-[1.02]"
              />
            </div>

            {isAdmin && (
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  label="Contraseña"
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="transition-all duration-200 focus:scale-[1.02] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[34px] text-black/60 hover:text-black transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            )}

            <Button type="submit" className="w-full h-11 text-base" loading={loading}>
              Ingresar
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-black">
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
