import React, { useState, useEffect, useRef } from 'react';
import { Appointment } from '../types';
import { api } from '../services/api';
import { MEDICAL_REPORT_TEMPLATES } from '../data/reportTemplates';
import { X, FileText, CheckCircle, Save, Printer, Sparkles, ShieldCheck, Copy, Share2, QrCode } from 'lucide-react';
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
  const [doctorName, setDoctorName] = useState(existingReport?.doctorName || 'Dr. Carlos Silveira (CRM 128490-SP)');
  const [loading, setLoading] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Filtra templates clínicos para o tipo de exame atual
  const matchingTemplates = MEDICAL_REPORT_TEMPLATES.filter(
    (t) => t.examType === appointment.examType
  );

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

  const handleApplyTemplate = (tpl: (typeof MEDICAL_REPORT_TEMPLATES)[0]) => {
    setTitle(tpl.title);
    setContent(tpl.content);
    toast.success('Modelo de laudo aplicado!');
  };

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
          ? 'Laudo publicado com sucesso e liberado para o paciente!'
          : 'Rascunho de laudo salvo com sucesso.'
      );
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar o laudo.');
      if (err.response?.status === 400) {
        onSaved();
      }
    } finally {
      setLoading(false);
    }
  };

  // Código de validação simulado para documento oficial
  const reportCode = existingReport
    ? `MED-${existingReport.id.slice(0, 8).toUpperCase()}`
    : 'MED-PREVIEW';

  const handleCopyReport = () => {
    const reportText = `*LAUDO MÉDICO - CLÍNICA MEDVIDA*
Autenticação: ${reportCode}
Paciente: ${appointment.patient.name}
Exame: ${appointment.examType}
Data: ${new Date(appointment.dateTime).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
Médico: ${doctorName}

*Título:* ${title}
*Parecer Diagnóstico:*
${content}

Documento assinado digitalmente.`;

    navigator.clipboard.writeText(reportText);
    toast.success('Texto do laudo copiado para a área de transferência!');
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `*Laudo Médico MedVida*\nPaciente: ${appointment.patient.name}\nExame: ${appointment.examType}\nCódigo de Autenticação: ${reportCode}\n\n*Resultado:* ${title}\n${content.slice(0, 300)}...`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-100">
        {/* Cabeçalho do Laudo */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <div>
              <h2 id="report-modal-title" className="font-bold text-xs uppercase tracking-wider text-slate-800">
                {isReadOnly ? 'Laudo Médico Oficial' : existingReport ? 'Editar Laudo Médico' : 'Elaboração de Laudo'}
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

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto" id="printable-report">
          {/* Cabeçalho Timbrado do Documento Médico */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/90 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <p className="font-extrabold text-sm text-slate-900 tracking-tight">Clínica Médica MedVida</p>
                <p className="text-[11px] text-slate-500">Centro Avançado de Diagnóstico por Imagem</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Autenticação: {reportCode}
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">Fuso: America/Sao_Paulo</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 text-[11px] text-slate-600">
              <div>Paciente: <strong className="text-slate-900">{appointment.patient.name}</strong></div>
              <div>E-mail: <span className="text-slate-800">{appointment.patient.email}</span></div>
              <div>Exame: <strong className="text-slate-900">{appointment.examType}</strong></div>
              <div>Data Realização: <span className="text-slate-800">{new Date(appointment.dateTime).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</span></div>
            </div>
          </div>

          {/* Banner de Status */}
          {existingReport?.status === 'PUBLISHED' && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded flex items-center justify-between">
              <span className="font-semibold flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Laudo Médico Publicado e Disponibilizado
              </span>
              {existingReport.publishedAt && (
                <span className="text-[11px] text-emerald-700">
                  Emitido em: {new Date(existingReport.publishedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                </span>
              )}
            </div>
          )}

          {/* Modelos Rápidos de Laudos (Apenas para Clínica em modo edição) */}
          {!isReadOnly && matchingTemplates.length > 0 && (
            <div className="p-2.5 bg-blue-50/60 border border-blue-200/80 rounded">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900">
                  Modelos de Laudo Clínico Prontos:
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {matchingTemplates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="px-2 py-1 rounded bg-white hover:bg-blue-100/60 border border-blue-200 text-blue-900 text-[10px] font-semibold transition"
                  >
                    + {tpl.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="report-title" className="block text-[11px] font-semibold text-slate-700 mb-1">
              Título do Laudo <span className="text-rose-500">*</span>
            </label>
            <input
              id="report-title"
              ref={titleInputRef}
              type="text"
              disabled={isReadOnly}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Radiografia de Tórax PA e Perfil"
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-900 disabled:bg-slate-50 disabled:text-slate-700 focus:ring-1 focus:ring-blue-600 outline-none transition"
            />
          </div>

          <div>
            <label htmlFor="report-doctor" className="block text-[11px] font-semibold text-slate-700 mb-1">
              Médico / Profissional Responsável <span className="text-rose-500">*</span>
            </label>
            <input
              id="report-doctor"
              type="text"
              disabled={isReadOnly}
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="Ex: Dr. Roberto Médio - CRM 12345/SP"
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-900 disabled:bg-slate-50 disabled:text-slate-700 focus:ring-1 focus:ring-blue-600 outline-none transition"
            />
          </div>

          <div>
            <label htmlFor="report-content" className="block text-[11px] font-semibold text-slate-700 mb-1">
              Conteúdo / Parecer Diagnóstico <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="report-content"
              rows={8}
              disabled={isReadOnly}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Descreva o relatório, achados anatômicos e conclusão diagnóstica..."
              className="w-full p-3 bg-white border border-slate-200 rounded text-xs font-mono text-slate-900 disabled:bg-slate-50 disabled:text-slate-800 focus:ring-1 focus:ring-blue-600 outline-none transition resize-y leading-relaxed"
            />
          </div>

          {/* Rodapé de Assinatura Médica e Autenticidade Digital */}
          {existingReport?.status === 'PUBLISHED' && (
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Documento com Assinatura Digital e ICP-Brasil Simulado</span>
                </div>
                <div className="text-center sm:text-right font-medium text-slate-800">
                  <p className="border-t border-slate-400 pt-1 px-4 font-semibold text-slate-900">{existingReport.doctorName}</p>
                  <p className="text-[10px] text-slate-400">Responsável Técnico / Radiologista</p>
                </div>
              </div>

              {/* Selo de Verificação com Código de Autenticidade */}
              <div className="p-2.5 rounded bg-slate-100/80 border border-slate-200 flex items-center justify-between text-[10px] text-slate-600">
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-slate-600" />
                  <div>
                    <span className="font-semibold text-slate-800">Validação de Integridade: </span>
                    <span className="font-mono text-slate-700">{reportCode}</span>
                    <p className="text-[9px] text-slate-400">A integridade deste laudo pode ser confirmada no portal MedVida.</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-white text-emerald-800 font-bold border border-slate-200">
                  VÁLIDO
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          {existingReport?.status === 'PUBLISHED' ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-100 rounded text-xs font-medium text-slate-700 transition"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Imprimir / PDF</span>
              </button>

              <button
                type="button"
                onClick={handleCopyReport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-100 rounded text-xs font-medium text-slate-700 transition"
                title="Copiar texto completo do laudo"
              >
                <Copy className="w-3.5 h-3.5 text-slate-600" />
                <span>Copiar Laudo</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded text-xs font-medium transition"
                title="Compartilhar resumo via WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </button>
            </div>
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
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition shadow-2xs"
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
