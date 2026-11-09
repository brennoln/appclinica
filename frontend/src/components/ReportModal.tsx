import React, { useState, useEffect, useRef } from 'react';
import { Appointment } from '../types';
import { api } from '../services/api';
import { X, FileText, CheckCircle, Save, AlertCircle, Printer } from 'lucide-react';
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
      toast.warning('Por favor, preencha todos os campos do laudo.');
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
          ? 'Laudo publicado com sucesso! Disponível para o paciente.'
          : 'Rascunho de laudo salvo com sucesso.'
      );
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar o laudo.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header acessível com alto contraste */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl" aria-hidden="true">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 id="report-modal-title" className="font-bold text-lg text-white">
                {isReadOnly ? 'Laudo Médico Oficial' : existingReport ? 'Editar Laudo do Exame' : 'Novo Laudo Médico'}
              </h2>
              <p className="text-xs text-slate-300">
                Paciente: <span className="font-semibold text-white">{appointment.patient.name}</span> • Exame: {appointment.examType}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar janela de laudo"
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-400 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Laudo */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {existingReport?.status === 'PUBLISHED' && (
            <div
              role="status"
              className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-900 text-xs rounded-r-lg flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  <strong>Laudo Publicado:</strong> Documento médico oficial disponibilizado para o paciente.
                </span>
              </div>
              {existingReport.publishedAt && (
                <span className="text-emerald-700">
                  {new Date(existingReport.publishedAt).toLocaleString('pt-BR')}
                </span>
              )}
            </div>
          )}

          {existingReport?.status === 'DRAFT' && isClinic && (
            <div
              role="alert"
              className="p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-900 text-xs rounded-r-lg flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                <strong>Modo Rascunho:</strong> Visível apenas para a clínica. O paciente não terá acesso até que seja publicado.
              </span>
            </div>
          )}

          <div>
            <label htmlFor="report-title" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Título do Laudo <span className="text-rose-500">*</span>
            </label>
            <input
              id="report-title"
              ref={titleInputRef}
              type="text"
              disabled={isReadOnly}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Radiografia do Tórax - Vista PA e Lateral"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          <div>
            <label htmlFor="report-doctor" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Profissional Responsável <span className="text-rose-500">*</span>
            </label>
            <input
              id="report-doctor"
              type="text"
              disabled={isReadOnly}
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="Ex: Dr. Roberto Guimarães - CRM/SP 123456"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          <div>
            <label htmlFor="report-content" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Texto e Parecer Clínico <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="report-content"
              rows={8}
              disabled={isReadOnly}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Insira a descrição detalhada do exame, análise clínica e conclusões..."
              className="w-full p-3.5 border border-slate-300 rounded-lg text-sm text-slate-900 font-mono disabled:bg-slate-100 disabled:text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition leading-relaxed resize-y"
            />
          </div>
        </div>

        {/* Rodapé e Ações */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {isReadOnly && existingReport?.status === 'PUBLISHED' ? (
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-400 transition"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Imprimir / Salvar PDF</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-400 transition"
            >
              Fechar
            </button>

            {!isReadOnly && (
              <>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSubmit('DRAFT')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs focus:outline-hidden focus:ring-2 focus:ring-amber-400 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Rascunho</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSubmit('PUBLISHED')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Publicar Laudo Oficial</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
