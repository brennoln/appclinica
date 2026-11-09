import React, { useEffect } from 'react';
import { Appointment, EXAM_LABELS } from '../types';
import { X, Info, CheckCircle2, ShieldAlert } from 'lucide-react';

interface ExamPreparationModalProps {
  appointment: Appointment;
  onClose: () => void;
}

export const ExamPreparationModal: React.FC<ExamPreparationModalProps> = ({ appointment, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const examTitle = EXAM_LABELS[appointment.examType] || appointment.examType;
  const notes = appointment.preparationNotes;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="prep-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-lg shadow-lg border border-slate-200 w-full max-w-md overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-100">
        <div className="px-5 py-3.5 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/70">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-700" />
            <div>
              <h2 id="prep-modal-title" className="font-bold text-xs uppercase tracking-wider text-emerald-950">
                Orientações da Clínica • {examTitle}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar guia de preparo"
            className="text-slate-400 hover:text-slate-600 p-1 rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3.5 text-xs text-slate-700">
          <div className="p-3 bg-emerald-50/40 border border-emerald-200/80 rounded">
            <p className="text-[10px] uppercase font-bold text-emerald-800 mb-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Instruções de Preparo para este Exame
            </p>
            {notes ? (
              <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line font-medium">
                {notes}
              </p>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Não há orientações específicas cadastradas pela clínica para este exame. Chegue com 15 minutos de antecedência munido de documento com foto e pedidos médicos.
              </p>
            )}
          </div>

          <div className="p-3 rounded bg-slate-50 border border-slate-200 text-slate-600">
            <p className="font-bold uppercase tracking-wider text-[10px] text-slate-700 mb-1 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
              Recomendações Gerais da Clínica
            </p>
            <ul className="space-y-1 text-[11px] text-slate-600">
              <li>• Apresentar documento de identificação original com foto.</li>
              <li>• Levar exames anteriores relacionados para comparação diagnóstica.</li>
              <li>• Em caso de impossibilidade de comparecimento, contate a clínica para liberação da sala.</li>
            </ul>
          </div>
        </div>

        <div className="bg-slate-50 px-5 py-2.5 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
