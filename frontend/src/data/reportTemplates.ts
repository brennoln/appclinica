export interface MedicalReportTemplate {
  id: string;
  label: string;
  examType: string;
  title: string;
  content: string;
}

export const MEDICAL_REPORT_TEMPLATES: MedicalReportTemplate[] = [
  {
    id: 'rx-torax-normal',
    label: 'Raio-X de Tórax (Sem alterações)',
    examType: 'RAIO_X',
    title: 'Radiografia de Tórax PA e Perfil',
    content: `INDICAÇÃO CLÍNICA: Avaliação de rotina / dor torácica atípica.

TÉCNICA: Incidências posteroanterior (PA) e perfil esquerdo em ortostase.

RELATÓRIO:
- Campos pleuropulmonares com transparência radiológica preservada, sem evidências de infiltrados alveolares, consolidações ou nódulos suspeitos.
- Trama broncovascular de calibre e distribuição anatômica normais.
- Silhueta cardíaca com dimensões e morfologia dentro dos limites da normalidade (Índice Cardiotorácico < 0,5).
- Seios costofrênicos e cardiofrênicos livres bilateralmente.
- Estruturas ósseas da caixa torácica e partes moles parietais sem alterações apreciáveis ao método.

IMPRESSÃO DIAGNÓSTICA:
Exame radiográfico do tórax sem evidência de alterações pleuropulmonares ativas no momento.`,
  },
  {
    id: 'us-abdome-normal',
    label: 'Ultrassom Abdome Total (Normal)',
    examType: 'ULTRASSOM',
    title: 'Ultrassonografia de Abdome Total',
    content: `INDICAÇÃO CLÍNICA: Check-up clínico / desconforto epigástrico.

RELATÓRIO:
- Fígado com contornos regulares, dimensões preservadas e ecotextura homogênea, sem lesões focais ou sinais de esteatose hepática.
- Vesícula biliar de paredes finas, limites nítidos e conteúdo anecoico, livre de cálculos ou espessamentos parietais.
- Vias biliares intra e extra-hepáticas de calibre normal.
- Pâncreas e baço com dimensões, contornos e ecogenicidade preservados.
- Rins tópicos, com dimensões normais, boa diferenciação córtico-medular e sem sinais de hidronefrose, cálculos ou formações císticas/sólidas.
- Aorta abdominal de calibre habitual.
- Bexiga urinária com boa repleção fisiológica, paredes finas e regulares.
- Ausência de líquido livre na cavidade peritoneal.

IMPRESSÃO DIAGNÓSTICA:
Ultrassonografia de abdome total dentro dos padrões habituais de normalidade.`,
  },
  {
    id: 'rm-cranio-normal',
    label: 'Ressonância Crânio (Normal)',
    examType: 'RESSONANCIA_MAGNETICA',
    title: 'Ressonância Magnética do Crânio',
    content: `INDICAÇÃO CLÍNICA: Cefaleia crônica a esclarecer.

TÉCNICA: Cortes multiplanares obtidos em sequências ponderadas em T1, T2, FLAIR e difusão.

RELATÓRIO:
- Parênquima encefálico com intensidade de sinal preservada nas substâncias branca e cinzenta.
- Ausência de áreas com restrição à difusão da água, afastando eventos isquêmicos agudos.
- Ausência de coleções hemorrágicas intra ou extra-axiais.
- Sistema ventricular de morfologia e dimensões normais para a faixa etária.
- Cisternas da base e sulcos corticais com amplitude habitual.
- Transição crânio-cervical anatômica, sem ectopia das tonsilas cerebelares.
- Órbitas, seios da face e mastoides com aeração normal.

IMPRESSÃO DIAGNÓSTICA:
Estudo por ressonância magnética do crânio sem alterações estruturais patológicas evidentes.`,
  },
];
