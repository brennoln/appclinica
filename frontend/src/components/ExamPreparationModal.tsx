import React, { useState, useEffect } from 'react';
import { Appointment, EXAM_LABELS } from '../types';
import { PREPARATION_TEMPLATES } from '../data/examInstructions';
import { api } from '../services/api';
import { X, Info, CheckCircle2, ShieldAlert, Save } from 'lucide-react';
import { toast } from 'sonner';

interface ExamPreparationModalProps {
  appointment: Appointment;
  isClinic?: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const ExamPreparationModal: React.FC<ExamPreparationModalProps> = ({
  appointment,
  isClinic = false,
  onClose,
  onSaved,
}) => {
  const [notes, setNotes] = useState<string>(appointment.preparationNotes || '');
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const examTitle = EXAM_LABELS[appointment.examType] || appointment.examType;
  const templates = PREPARATION_TEMPLATES[appointment.examType] || [];

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/appointments/${appointment.id}/preparation`, {
        preparationNotes: notes.trim() || null,
      });
      toast.success('Recomendações de preparo atualizadas para o paciente!');
      onSaved?.();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar recomendações de preparo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="prep-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-lg shadow-lg border border-slate-200 w-full max-w-md overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-100">
        <div
          className={`px-5 py-3.5 border-b flex items-center justify-between ${
            isClinic
              ? 'border-blue-100 bg-blue-50/70'
              : 'border-emerald-100 bg-emerald-50/70'
          }`}
        >
          <div className="flex items-center gap-2">
            <Info className={`w-4 h-4 ${isClinic ? 'text-blue-700' : 'text-emerald-700'}`} />
            <div>
              <h2
                id="prep-modal-title"
                className={`font-bold text-xs uppercase tracking-wider ${
                  isClinic ? 'text-blue-950' : 'text-emerald-950'
                }`}
              >
                {isClinic ? 'Instruções de Preparo' : 'Orientações da Clínica'} • {examTitle}
              </h2>
              <p className="text-[11px] text-slate-500">
                Paciente: <strong className="font-semibold text-slate-700">{appointment.patient.name}</strong>
              </p>
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
          {isClinic ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label htmlFor="edit-prep-notes" className="text-[11px] font-semibold text-slate-700">
                  Recomendações de preparo visíveis ao paciente:
                </label>
                <span className="text-[10px] text-slate-400">Modelos rápidos</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setNotes(tpl.text)}
                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition"
                  >
                    + {tpl.label}
                  </button>
                ))}
              </div>

              <textarea
                id="edit-prep-notes"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Descreva o preparo necessário (jejum, bexiga cheia, vestimenta, restrições)..."
                className="w-full p-2.5 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none transition leading-relaxed resize-none"
              />
            </div>
          ) : (
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
          )}

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

        <div className="bg-slate-50 px-5 py-2.5 border-t border-slate-200 flex justify-end gap-2">
          {isClinic ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded text-xs font-medium transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-xs font-semibold transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Salvando...' : 'Salvar Recomendações'}</span>
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold transition"
            >
              Entendido
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
