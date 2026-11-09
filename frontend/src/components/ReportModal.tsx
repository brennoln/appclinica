import React, { useState } from 'react';
import { Appointment, Report } from '../types';
import { api } from '../services/api';
import { X, FileText, CheckCircle, Save, AlertCircle } from 'lucide-react';

interface ReportModalProps {
  appointment: Appointment;
  isClinic: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  appointment,
  isClinic,
  onClose,
  onSaved,
}) => {
  const existingReport = appointment.report;
  const isReadOnly = !isClinic || existingReport?.status === 'PUBLISHED';

  const [title, setTitle] = useState(existingReport?.title || '');
  const [content, setContent] = useState(existingReport?.content || '');
  const [doctorName, setDoctorName] = useState(existingReport?.doctorName || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (targetStatus: 'DRAFT' | 'PUBLISHED') => {
    setError(null);
    if (!title.trim() || !content.trim() || !doctorName.trim()) {
      setError('Todos os campos (Título, Conteúdo e Nome do Médico) são obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      if (existingReport) {
        // Atualiza laudo existente
        await api.put(`/reports/${existingReport.id}`, {
          title,
          content,
          doctorName,
          status: targetStatus,
        });
      } else {
        // Cria novo laudo
        await api.post(`/appointments/${appointment.id}/report`, {
          title,
          content,
          doctorName,
          status: targetStatus,
        });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao salvar laudo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">
                {isReadOnly ? 'Visualização do Laudo' : existingReport ? 'Editar Laudo' : 'Cadastrar Novo Laudo'}
              </h3>
              <p className="text-xs text-slate-300">
                Paciente: <span className="font-semibold text-white">{appointment.patient.name}</span> • Exame: {appointment.examType}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {existingReport?.status === 'PUBLISHED' && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center justify-between">
              <span className="font-semibold flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Laudo Oficial Publicado
              </span>
              {existingReport.publishedAt && (
                <span>Publicado em: {new Date(existingReport.publishedAt).toLocaleString('pt-BR')}</span>
              )}
            </div>
          )}

          {existingReport?.status === 'DRAFT' && isClinic && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg">
              ⚠️ <strong>Rascunho:</strong> Este laudo só está visível para a clínica. O paciente não tem acesso até que seja publicado.
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Título do Laudo
              </label>
              <input
                type="text"
                disabled={isReadOnly}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Raio-X de Tórax PA e Perfil"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 disabled:bg-slate-50 disabled:text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Profissional Responsável (Médico / CRM)
              </label>
              <input
                type="text"
                disabled={isReadOnly}
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Ex: Dr. Roberto Médio - CRM 12345/SP"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 disabled:bg-slate-50 disabled:text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Conteúdo / Conclusão do Laudo
              </label>
              <textarea
                rows={6}
                disabled={isReadOnly}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Descreva o laudo detalhadamente..."
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 disabled:bg-slate-50 disabled:text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-xs leading-relaxed"
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium transition"
          >
            Fechar
          </button>

          {!isReadOnly && (
            <>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSubmit('DRAFT')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Rascunho</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleSubmit('PUBLISHED')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition shadow-sm"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Publicar Laudo</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
