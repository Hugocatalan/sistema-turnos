'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Plus, Edit2, Trash2, Save, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

interface Pregunta {
  id: string;
  pregunta: string;
  respuesta: string;
  categoria?: string;
  activa: boolean;
  orden: number;
}

export default function ChatbotPage() {
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedPregunta, setSelectedPregunta] = useState<Pregunta | null>(null);
  const [formData, setFormData] = useState({
    pregunta: '',
    respuesta: '',
    categoria: '',
    activa: true,
    orden: 0
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [previewInput, setPreviewInput] = useState('');
  const [previewResponse, setPreviewResponse] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    fetchPreguntas();
  }, []);

  const fetchPreguntas = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/chatbot');
      const data = await res.json();
      setPreguntas(data);
    } catch { console.error('Error'); }
    finally { setLoading(false); }
  };

  const handleOpenModal = (pregunta?: Pregunta) => {
    if (pregunta) {
      setSelectedPregunta(pregunta);
      setFormData({
        pregunta: pregunta.pregunta,
        respuesta: pregunta.respuesta,
        categoria: pregunta.categoria || '',
        activa: pregunta.activa,
        orden: pregunta.orden
      });
    } else {
      setSelectedPregunta(null);
      setFormData({ pregunta: '', respuesta: '', categoria: '', activa: true, orden: 0 });
    }
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');

      setModalOpen(false);
      fetchPreguntas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta pregunta?')) return;
    // Por ahora no hay endpoint DELETE, pero el admin puede cambiar activa a false
  };

  const handlePreview = async () => {
    if (!previewInput.trim()) return;
    setPreviewLoading(true);
    try {
      const res = await fetch('/api/chatbot/pregunta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta: previewInput })
      });
      const data = await res.json();
      setPreviewResponse(data.respuesta);
    } catch { setPreviewResponse('Error al procesar'); }
    finally { setPreviewLoading(false); }
  };

  const categorias = Array.from(new Set(preguntas.filter(p => p.categoria).map(p => p.categoria)));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chatbot</h1>
          <p className="text-gray-500">Configurá las preguntas frecuentes</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => setPreviewOpen(true)}>
            <Eye size={18} className="mr-2" />
            Probar
          </Button>
          <Button onClick={() => handleOpenModal()}>
            <Plus size={18} className="mr-2" />
            Nueva
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-6 text-gray-600">
          <MessageSquare size={20} />
          <span className="font-medium">El chatbot responde automáticamente preguntas de los alumnos</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{preguntas.length}</p>
            <p className="text-sm text-blue-600">Total Preguntas</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-green-600">
              {preguntas.filter(p => p.activa).length}
            </p>
            <p className="text-sm text-green-600">Activas</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-purple-600">{categorias.length}</p>
            <p className="text-sm text-purple-600">Categorías</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pregunta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Respuesta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Cargando...</td></tr>
              ) : preguntas.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No hay preguntas configuradas. Agregá la primera!
                </td></tr>
              ) : preguntas.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate">{p.pregunta}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-md">
                    <span className="line-clamp-2">{p.respuesta}</span>
                  </td>
                  <td className="px-6 py-4">
                    {p.categoria && (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                        {p.categoria}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      p.activa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {p.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleOpenModal(p)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={selectedPregunta ? 'Editar Pregunta' : 'Nueva Pregunta'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

          <Textarea
            label="Pregunta"
            value={formData.pregunta}
            onChange={(e) => setFormData({...formData, pregunta: e.target.value})}
            placeholder="¿Cuáles son los horarios?"
            rows={2}
            required
          />

          <Textarea
            label="Respuesta"
            value={formData.respuesta}
            onChange={(e) => setFormData({...formData, respuesta: e.target.value})}
            placeholder="Nuestro horario es de lunes a viernes de 8:00 a 22:00..."
            rows={4}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Categoría (opcional)"
              value={formData.categoria}
              onChange={(e) => setFormData({...formData, categoria: e.target.value})}
              placeholder="Horarios, Precios, etc."
            />
            <Select
              label="Estado"
              value={formData.activa ? 'true' : 'false'}
              onChange={(e) => setFormData({...formData, activa: e.target.value === 'true'})}
              options={[
                { value: 'true', label: 'Activa' },
                { value: 'false', label: 'Inactiva' }
              ]}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>
              <Save size={18} className="mr-2" />
              {selectedPregunta ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} title="Probar Chatbot" size="lg">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Escribí una pregunta para ver cómo responde el chatbot según las preguntas configuradas.
          </p>
          <div className="flex gap-3">
            <Input
              value={previewInput}
              onChange={(e) => setPreviewInput(e.target.value)}
              placeholder="Escribí tu pregunta aquí..."
              onKeyDown={(e) => e.key === 'Enter' && handlePreview()}
            />
            <Button onClick={handlePreview} loading={previewLoading}>Enviar</Button>
          </div>
          {previewResponse && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-medium mb-1">Respuesta del chatbot:</p>
              <p className="text-gray-700">{previewResponse}</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
