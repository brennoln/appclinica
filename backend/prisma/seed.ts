import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Executando seed do banco de dados...');

  // Limpar tabelas para um seed limpo
  await prisma.report.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('123456', 10);

  // Usuário da Clínica
  const clinicUser = await prisma.user.create({
    data: {
      name: 'Recepcionista Maria (Clínica)',
      email: 'clinica@demo.com',
      password: hashedPassword,
      role: 'CLINIC',
    },
  });

  // Pacientes
  const patient1 = await prisma.user.create({
    data: {
      name: 'Carlos Alberto (Paciente 1)',
      email: 'carlos@demo.com',
      password: hashedPassword,
      role: 'PATIENT',
    },
  });

  const patient2 = await prisma.user.create({
    data: {
      name: 'Juliana Silveira (Paciente 2)',
      email: 'juliana@demo.com',
      password: hashedPassword,
      role: 'PATIENT',
    },
  });

  console.log('Usuários criados com sucesso:');
  console.log('- Clínica: clinica@demo.com / 123456');
  console.log('- Paciente 1: carlos@demo.com / 123456');
  console.log('- Paciente 2: juliana@demo.com / 123456');

  // Criar data base para amanhã às 09:00 (UTC)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setMinutes(0, 0, 0);

  const slot1 = new Date(tomorrow);
  slot1.setHours(9, 0, 0, 0);

  const slot2 = new Date(tomorrow);
  slot2.setHours(9, 30, 0, 0);

  const slot3 = new Date(tomorrow);
  slot3.setHours(10, 0, 0, 0);

  // Agendamento 1: Carlos - Raio-X com Laudo Publicado
  const appt1 = await prisma.appointment.create({
    data: {
      patientId: patient1.id,
      examType: 'RAIO_X',
      dateTime: slot1,
      status: 'SCHEDULED',
    },
  });

  await prisma.report.create({
    data: {
      appointmentId: appt1.id,
      title: 'Raio-X de Tórax PA e Perfil',
      content: 'Estruturas ósseas preservadas. Campos pleuropulmonares com transparência normal. Silhueta cardíaca com dimensões normais.',
      doctorName: 'Dra. Fernanda Médica (CRM 123456-SP)',
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  // Agendamento 2: Carlos - Ultrassom com Laudo Rascunho (Carlos NÃO pode ver ainda)
  const appt2 = await prisma.appointment.create({
    data: {
      patientId: patient1.id,
      examType: 'ULTRASSOM',
      dateTime: slot2,
      status: 'SCHEDULED',
    },
  });

  await prisma.report.create({
    data: {
      appointmentId: appt2.id,
      title: 'Ultrassonografia de Abdome Total - Em Análise',
      content: 'Fígado com dimensões normais. Rascunho inicial aguardando revisão do especialista.',
      doctorName: 'Dr. Roberto Radiologista',
      status: 'DRAFT',
    },
  });

  // Agendamento 3: Juliana - Ressonância sem laudo
  await prisma.appointment.create({
    data: {
      patientId: patient2.id,
      examType: 'RESSONANCIA_MAGNETICA',
      dateTime: slot3,
      status: 'SCHEDULED',
    },
  });

  console.log('✅ Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
