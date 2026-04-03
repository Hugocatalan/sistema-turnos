'use client';

import { useEffect, useState, useRef } from 'react';
import { Settings, Palette, Image as ImageIcon, Save, RotateCcw, Clock, Shield, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { HorariosManager } from '@/components/admin/HorariosManager';

interface Configuracion {
  nombreEmpresa: string;
  logoUrl?: string;
  colorPrimario: string;
  colorSecundario: string;
  colorFondo: string;
  colorTexto: string;
  tipoFondo: 'color' | 'gradiente' | 'imagen';
  fondoPersonalizado?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  horaApertura: string;
  horaCierre: string;
  diasLaborales: string;
}

interface Reglas {
  horasMinimasAntelacion: number;
  permiteCancelar: boolean;
  permiteReprogramar: boolean;
  maxCambiosPorSemana: number;
  requierePagoDia: boolean;
  mensajePersonalizado?: string | null;
}

const plantillasFondo = [
  { id: 'gym1', name: 'Deportivo', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'gym2', name: 'Energético', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 'gym3', name: 'Profesional', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { id: 'gym4', name: 'Motivación', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { id: 'gym5', name: 'Fuego', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { id: 'gym6', name: 'Noche', gradient: 'linear-gradient(135deg, #0c3483 0%, #a2b6df 100%)' },
];

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<Configuracion | null>(null);
  const [reglas, setReglas] = useState<Reglas | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [fondoPreview, setFondoPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'colores' | 'reglas' | 'horarios'>('general');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const fondoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [configRes, reglasRes] = await Promise.all([
        fetch('/api/config'),
        fetch('/api/config/reglas')
      ]);
      const configData = await configRes.json();
      const reglasData = await reglasRes.json();
      setConfig(configData);
      setReglas(reglasData);
      setLogoPreview(configData.logoUrl || null);
      setFondoPreview(configData.fondoPersonalizado || null);
    } catch { console.error('Error'); }
    finally { setLoading(false); }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('tipo', 'logo');

    try {
      const res = await fetch('/api/config/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        setLogoPreview(data.url);
        setConfig({ ...config!, logoUrl: data.url });
      }
    } catch { console.error('Error uploading logo'); }
  };

  const handleFondoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('tipo', 'fondo');

    try {
      const res = await fetch('/api/config/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        setFondoPreview(data.url);
        setConfig({ ...config!, tipoFondo: 'imagen', fondoPersonalizado: data.url });
      }
    } catch { console.error('Error uploading fondo'); }
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      console.log('Guardando config:', config);
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      console.log('Response:', res.status);
      const data = await res.json();
      console.log('Data:', data);
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
      setSuccess('Configuración guardada correctamente');
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveReglas = async () => {
    if (!reglas) return;
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      console.log('Guardando reglas:', reglas);
      const res = await fetch('/api/config/reglas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reglas)
      });
      console.log('Response:', res.status);
      const data = await res.json();
      console.log('Data:', data);
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
      setSuccess('Reglas guardadas correctamente');
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-500">Cargando...</div>;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500">Personalizá tu sitio</p>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {[
            { id: 'general', label: 'General', icon: Settings },
            { id: 'colores', label: 'Colores y Fondo', icon: Palette },
            { id: 'reglas', label: 'Reglas de Turnos', icon: Shield },
            { id: 'horarios', label: 'Horarios', icon: Calendar }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'general' && config && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Nombre de la Empresa"
                  value={config.nombreEmpresa}
                  onChange={(e) => setConfig({ ...config, nombreEmpresa: e.target.value })}
                />
                <Input
                  label="Teléfono"
                  value={config.telefono || ''}
                  onChange={(e) => setConfig({ ...config, telefono: e.target.value })}
                  type="tel"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Email"
                  value={config.email || ''}
                  onChange={(e) => setConfig({ ...config, email: e.target.value })}
                  type="email"
                />
                <Input
                  label="Dirección"
                  value={config.direccion || ''}
                  onChange={(e) => setConfig({ ...config, direccion: e.target.value })}
                />
              </div>
              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock size={20} />
                  Horario de Atención
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Hora de Apertura"
                    type="time"
                    value={config.horaApertura || '08:00'}
                    onChange={(e) => setConfig({ ...config, horaApertura: e.target.value })}
                  />
                  <Input
                    label="Hora de Cierre"
                    type="time"
                    value={config.horaCierre || '22:00'}
                    onChange={(e) => setConfig({ ...config, horaCierre: e.target.value })}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Los horarios de las clases se configuran en la pestaña &quot;Horarios&quot;
                </p>
              </div>
              <div className="pt-4 border-t">
                <Button onClick={handleSaveConfig} loading={saving}>
                  <Save size={18} className="mr-2" />
                  Guardar Cambios
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'colores' && config && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Logo</p>
                  <div className="w-24 h-24 sm:w-32 sm:h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors overflow-hidden"
                    onClick={() => logoInputRef.current?.click()}>
                    {logoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon size={32} className="text-gray-400" />
                    )}
                  </div>
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </div>
                <Button variant="outline" onClick={() => logoInputRef.current?.click()}>
                  Cambiar Logo
                </Button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Color Primario</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={config.colorPrimario}
                      onChange={(e) => setConfig({ ...config, colorPrimario: e.target.value })}
                      className="w-12 h-10 border rounded cursor-pointer"
                    />
                    <Input
                      value={config.colorPrimario}
                      onChange={(e) => setConfig({ ...config, colorPrimario: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Color Secundario</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={config.colorSecundario}
                      onChange={(e) => setConfig({ ...config, colorSecundario: e.target.value })}
                      className="w-12 h-10 border rounded cursor-pointer"
                    />
                    <Input
                      value={config.colorSecundario}
                      onChange={(e) => setConfig({ ...config, colorSecundario: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Color Fondo</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={config.colorFondo}
                      onChange={(e) => setConfig({ ...config, colorFondo: e.target.value })}
                      className="w-12 h-10 border rounded cursor-pointer"
                    />
                    <Input
                      value={config.colorFondo}
                      onChange={(e) => setConfig({ ...config, colorFondo: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Color Texto</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={config.colorTexto}
                      onChange={(e) => setConfig({ ...config, colorTexto: e.target.value })}
                      className="w-12 h-10 border rounded cursor-pointer"
                    />
                    <Input
                      value={config.colorTexto}
                      onChange={(e) => setConfig({ ...config, colorTexto: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Tipo de Fondo</p>
                <div className="flex gap-4">
                  {['color', 'gradiente', 'imagen'].map(tipo => (
                    <button
                      key={tipo}
                      onClick={() => setConfig({ ...config, tipoFondo: tipo as any })}
                      className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                        config.tipoFondo === tipo
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Plantillas de Fondo</p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {plantillasFondo.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setConfig({ ...config, tipoFondo: 'gradiente', fondoPersonalizado: p.gradient });
                        setFondoPreview(p.gradient);
                      }}
                      className="h-20 rounded-lg border-2 transition-all hover:scale-105"
                      style={{ background: p.gradient }}
                      title={p.name}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Fondo Personalizado</p>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="w-full sm:w-48 h-24 border rounded-lg overflow-hidden"
                    style={{ background: config.tipoFondo === 'color' ? config.colorFondo : config.fondoPersonalizado }}>
                    {config.tipoFondo === 'imagen' && config.fondoPersonalizado && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={config.fondoPersonalizado} alt="Fondo" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <Button variant="outline" onClick={() => fondoInputRef.current?.click()}>
                    Subir Imagen
                  </Button>
                  <input ref={fondoInputRef} type="file" accept="image/*" className="hidden" onChange={handleFondoUpload} />
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button onClick={handleSaveConfig} loading={saving}>
                  <Save size={18} className="mr-2" />
                  Guardar Colores
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'reglas' && reglas && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-800">
                  <Clock size={20} />
                  <p className="font-medium">Estas reglas aplican para los alumnos cuando intenten modificar sus turnos</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Horas mínimas de anticipación
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={72}
                    value={reglas.horasMinimasAntelacion}
                    onChange={(e) => setReglas({ ...reglas, horasMinimasAntelacion: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Los alumnos deben solicitar cambios con esta anticipación</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Máx. cambios por semana
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={reglas.maxCambiosPorSemana}
                    onChange={(e) => setReglas({ ...reglas, maxCambiosPorSemana: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={reglas.permiteCancelar}
                    onChange={(e) => setReglas({ ...reglas, permiteCancelar: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Permitir cancelaciones</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={reglas.permiteReprogramar}
                    onChange={(e) => setReglas({ ...reglas, permiteReprogramar: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Permitir reprogramaciones</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={reglas.requierePagoDia}
                    onChange={(e) => setReglas({ ...reglas, requierePagoDia: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Requerir pago del día para cambios</span>
                </label>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Mensaje personalizado</label>
                <Textarea
                  value={reglas.mensajePersonalizado || ''}
                  onChange={(e) => setReglas({ ...reglas, mensajePersonalizado: e.target.value })}
                  placeholder="Este mensaje se muestra cuando un alumno no puede hacer un cambio..."
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">Se muestra cuando se infringe alguna regla</p>
              </div>

              <div className="pt-4 border-t">
                <Button onClick={handleSaveReglas} loading={saving}>
                  <Save size={18} className="mr-2" />
                  Guardar Reglas
                </Button>
              </div>
            </div>
          )}
        </div>

        {activeTab === 'horarios' && (
          <HorariosManager />
        )}
      </div>
    </div>
  );
}
