import { ExamType } from '../types';

export interface ExamInstruction {
  title: string;
  duration: string;
  fasting: string;
  recommendations: string[];
  contraindications?: string[];
}

export const EXAM_INSTRUCTIONS: Record<ExamType, ExamInstruction> = {
  RAIO_X: {
    title: 'Radiografia Digital (Raio-X)',
    duration: '15 a 20 minutos',
    fasting: 'Não é necessário jejum',
    recommendations: [
      'Vista roupas confortáveis e sem botões ou detalhes metálicos na região do exame.',
      'Retire colares, brincos, piercings, relógios e próteses dentárias removíveis antes de entrar na sala.',
      'Traga exames radiológicos anteriores para comparação diagnóstica.',
    ],
    contraindications: [
      'Mulheres grávidas ou com suspeita de gravidez devem informar a equipe antes da realização.',
    ],
  },
  ULTRASSOM: {
    title: 'Ultrassonografia Diagnóstica',
    duration: '20 a 30 minutos',
    fasting: 'Jejum de 6 a 8 horas (líquidos claros sem açúcar permitidos até 2h antes)',
    recommendations: [
      'Para exames de abdome total ou vias urinárias: beba 4 a 5 copos de água 1 hora antes e segure a urina (bexiga cheia).',
      'Evite alimentos gordurosos, bebidas gaseificadas e laticínios no dia anterior para reduzir gases.',
      'Mantenha o uso de medicamentos de uso contínuo com pouca água.',
    ],
  },
  RESSONANCIA_MAGNETICA: {
    title: 'Ressonância Magnética de Alta Resolução',
    duration: '30 a 45 minutos',
    fasting: 'Jejum de 4 horas para exames com necessidade de contraste venoso',
    recommendations: [
      'Chegue com 20 minutos de antecedência para preenchimento do questionário de segurança.',
      'Retire qualquer adereço metálico, maquiagem com pigmentos metálicos, grampos de cabelo e cartões magnéticos.',
      'Se fizer uso de aparelhos auditivos ou adesivos transdérmicos, comunique a equipe médica.',
    ],
    contraindications: [
      'Portadores de marca-passo cardíaco não compatível, clipes de aneurisma cerebral ferromagnéticos ou implantes cocleares.',
    ],
  },
};
