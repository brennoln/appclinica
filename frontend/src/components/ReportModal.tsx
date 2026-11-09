import React, { useState, useEffect, useRef } from 'react';
import { Appointment } from '../types';
import { api } from '../services/api';
import { X, FileText, CheckCircle, Save, Printer } from 'lucide-react';
import { toast } from 'sonner';

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
  const [loading, setLoading] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isReadOnly) {
      titleInputRef.current?.focus();
    }
  }, [isReadOnly]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (targetStatus: 'DRAFT' | 'PUBLISHED') => {
    if (!title.trim() || !content.trim() || !doctorName.trim()) {
      toast.warning('Preencha todos os campos do laudo.');
      return;
    }

    setLoading(true);
    try {
      if (existingReport) {
        await api.put(`/reports/${existingReport.id}`, {
          title,
          content,
          doctorName,
          status: targetStatus,
        });
      } else {
        await api.post(`/appointments/${appointment.id}/report`, {
          title,
          content,
          doctorName,
          status: targetStatus,
        });
      }

      toast.success(
        targetStatus === 'PUBLISHED'
          ? 'Laudo publicado com sucesso.'
          : 'Rascunho de laudo salvo.'
      );
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar o laudo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-lg shadow-lg border border-slate-200 w-full max-w-xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-100">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-700" />
            <div>
              <h2 id="report-modal-title" className="font-semibold text-xs uppercase tracking-wider text-slate-800">
                {isReadOnly ? 'Laudo Médico Oficial' : existingReport ? 'Editar Laudo' : 'Cadastrar Laudo'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-slate-400 hover:text-slate-600 p-1 rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="text-xs text-slate-500 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>Paciente: <strong className="text-slate-800">{appointment.patient.name}</strong></span>
            <span>Exame: <strong className="text-slate-800">{appointment.examType}</strong></span>
          </div>

          {existingReport?.status === 'PUBLISHED' && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded flex items-center justify-between">
              <span className="font-medium flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Laudo Publicado
              </span>
              {existingReport.publishedAt && (
                <span className="text-[11px] text-emerald-700">
                  {new Date(existingReport.publishedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                </span>
              )}
            </div>
          )}

          <div>
            <label htmlFor="report-title" className="block text-[11px] font-semibold text-slate-700 mb-1">
              Título do Exame <span className="text-rose-500">*</span>
            </label>
            <input
              id="report-title"
              ref={titleInputRef}
              type="text"
              disabled={isReadOnly}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Radiografia do Tórax PA"
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-900 disabled:bg-slate-50 disabled:text-slate-600 focus:ring-1 focus:ring-slate-900 outline-none transition"
            />
          </div>

          <div>
            <label htmlFor="report-doctor" className="block text-[11px] font-semibold text-slate-700 mb-1">
              Médico Responsável (CRM) <span className="text-rose-500">*</span>
            </label>
            <input
              id="report-doctor"
              type="text"
              disabled={isReadOnly}
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="Ex: Dr. Roberto Médio - CRM 12345/SP"
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-900 disabled:bg-slate-50 disabled:text-slate-600 focus:ring-1 focus:ring-slate-900 outline-none transition"
            />
          </div>

          <div>
            <label htmlFor="report-content" className="block text-[11px] font-semibold text-slate-700 mb-1">
              Parecer e Conclusão <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="report-content"
              rows={6}
              disabled={isReadOnly}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Descreva o laudo detalhadamente..."
              className="w-full p-3 bg-white border border-slate-200 rounded text-xs font-mono text-slate-900 disabled:bg-slate-50 disabled:text-slate-600 focus:ring-1 focus:ring-slate-900 outline-none transition resize-y leading-relaxed"
            />
          </div>
        </div>

        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          {isReadOnly && existingReport?.status === 'PUBLISHED' ? (
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-100 rounded text-xs font-medium text-slate-700 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded text-xs font-medium transition"
            >
              Fechar
            </button>

            {!isReadOnly && (
              <>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSubmit('DRAFT')}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-medium transition"
                >
                  Salvar Rascunho
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSubmit('PUBLISHED')}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium transition"
                >
                  Publicar Laudo
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
