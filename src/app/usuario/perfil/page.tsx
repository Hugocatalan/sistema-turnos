'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { User, Mail, Phone, CreditCard, Calendar, Camera, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface UserData {
  id: string;
  dni: string;
  nombre: string;
  apellido: string;
  email?: string | null;
  telefono?: string | null;
  estadoMembresia: string;
  fechaVencimiento?: string | null;
  imagenUrl?: string | null;
}

export default function PerfilPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  const estadoColors = {
    ACTIVA: 'bg-green-100 text-green-800',
    VENCIDA: 'bg-red-100 text-red-800',
    SUSPENDIDA: 'bg-yellow-100 text-yellow-800'
  };

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/users/me');
      if (res.ok) {
        const data = await res.json();
        setUserData(data);
      }
    } catch {
      console.error('Error fetching user data');
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setPendingImage(preview);
  };

  const handleSavePhoto = async () => {
    const fileInput = fileInputRef.current?.files?.[0];
    if (!fileInput) {
      alert('Por favor seleccioná una imagen primero');
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('file', fileInput);

      const res = await fetch('/api/users/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (res.ok && data.success) {
        await fetchUserData();
        setPendingImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        window.dispatchEvent(new Event('user-updated'));
        alert('¡Foto guardada exitosamente!');
      } else {
        alert(data.error || 'Error al guardar imagen');
      }
    } catch (err) {
      console.error('Error uploading:', err);
      alert('Error al conectar con el servidor. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setPendingImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!user) return null;

  const displayImage = pendingImage || userData?.imagenUrl;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-500">Tus datos personales</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white/20 flex items-center justify-center overflow-hidden ring-4 ring-white/30">
                {displayImage ? (
                  <div className="relative w-full h-full">
                    <Image src={displayImage} alt="Perfil" fill className="object-cover" />
                  </div>
                ) : (
                  <User size={40} className="text-white" />
                )}
              </div>
              {!pendingImage && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
                >
                  <Camera size={18} className="text-blue-600" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {pendingImage && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleSavePhoto}
                  loading={saving}
                >
                  <Save size={16} className="mr-1" />
                  Guardar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  <X size={16} className="mr-1" />
                  Cancelar
                </Button>
              </div>
            )}

            {!pendingImage && (
              <div className="text-white">
                <h2 className="text-xl sm:text-2xl font-bold">{user.nombre} {user.apellido}</h2>
                <p className="text-blue-100">Alumno</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Personal</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <User size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">DNI</p>
                <p className="font-medium text-gray-900">{user.dni}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Mail size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{user.email || 'No registrado'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Phone size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Teléfono</p>
                <p className="font-medium text-gray-900">{user.telefono || 'No registrado'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <CreditCard size={20} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Estado de Membresía</p>
                <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${estadoColors[user.estadoMembresia]}`}>
                  {user.estadoMembresia}
                </span>
              </div>
            </div>
          </div>

          {user.fechaVencimiento && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600">Fecha de Vencimiento</p>
                  <p className="font-semibold text-blue-900">
                    {new Date(user.fechaVencimiento).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
