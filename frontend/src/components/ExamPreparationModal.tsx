import React, { useEffect } from 'react';
import { ExamType, EXAM_LABELS } from '../types';
import { EXAM_INSTRUCTIONS } from '../data/examInstructions';
import { X, Info, UtensilsCrossed, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ExamPreparationModalProps {
  examType: ExamType;
  onClose: () => void;
}

export const ExamPreparationModal: React.FC<ExamPreparationModalProps> = ({ examType, onClose }) => {
  const instructions = EXAM_INSTRUCTIONS[examType];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!instructions) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="prep-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-lg shadow-lg border border-slate-200 w-full max-w-lg overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-100">
        <div className="px-5 py-3.5 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/70">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-700" />
            <div>
              <h2 id="prep-modal-title" className="font-bold text-xs uppercase tracking-wider text-emerald-950">
                Guia de Preparo • {EXAM_LABELS[examType]}
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

        <div className="p-5 space-y-4 text-xs text-slate-700">
          {/* Destaques Rápidos */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Duração estimada</span>
                <span className="font-semibold text-slate-800">{instructions.duration}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center gap-2.5">
              <UtensilsCrossed className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Jejum</span>
                <span className="font-semibold text-slate-800">{instructions.fasting}</span>
              </div>
            </div>
          </div>

          {/* Orientações */}
          <div>
            <h3 className="font-bold uppercase tracking-wider text-[11px] text-slate-900 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Recomendações para o Dia do Exame
            </h3>
            <ul className="space-y-1.5 pl-1">
              {instructions.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contraindicações / Alertas */}
          {instructions.contraindications && (
            <div className="p-3 rounded bg-rose-50/70 border border-rose-200 text-rose-900">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-rose-800 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Avisos Importantes de Segurança
              </div>
              <ul className="space-y-1">
                {instructions.contraindications.map((contra, i) => (
                  <li key={i} className="text-[11px] leading-relaxed">
                    • {contra}
                  </li>
                ))}
              </ul>
            </div>
          )}
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
