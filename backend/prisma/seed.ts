import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Executando seed do banco de dados com fuso horário America/Sao_Paulo...');

  await prisma.report.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('123456', 10);

  // Usuário da Clínica
  await prisma.user.create({
    data: {
      name: 'Maria Santos',
      email: 'clinica@demo.com',
      password: hashedPassword,
      role: 'CLINIC',
    },
  });

  // Pacientes
  const patient1 = await prisma.user.create({
    data: {
      name: 'Carlos Alberto da Silva',
      email: 'carlos@demo.com',
      password: hashedPassword,
      role: 'PATIENT',
    },
  });

  const patient2 = await prisma.user.create({
    data: {
      name: 'Juliana Silveira',
      email: 'juliana@demo.com',
      password: hashedPassword,
      role: 'PATIENT',
    },
  });

  // Cria datas com fuso horário local de São Paulo (-03:00)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  const datePrefix = `${year}-${month}-${day}`;

  // Slot 1: 09:00 no Brasil (-03:00)
  const slot1 = new Date(`${datePrefix}T09:00:00-03:00`);
  // Slot 2: 09:30 no Brasil (-03:00)
  const slot2 = new Date(`${datePrefix}T09:30:00-03:00`);
  // Slot 3: 14:00 no Brasil (-03:00)
  const slot3 = new Date(`${datePrefix}T14:00:00-03:00`);

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
      title: 'Radiografia de Tórax PA e Perfil',
      content: 'Campos pleuropulmonares com transparência radiológica habitual. Trama vascular pulmonar de aspecto normal. Silhueta cardíaca com morfologia e dimensões normais. Ausência de derrame pleural evidente.',
      doctorName: 'Dra. Fernanda Médica (CRM 123456-SP)',
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  // Agendamento 2: Carlos - Ultrassom com Laudo Rascunho
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
      title: 'Ultrassonografia de Abdome Total - Avaliação Inicial',
      content: 'Fígado com dimensões normais e ecotextura homogênea. Vesícula biliar fisiologicamente distendida, de paredes finas e conteúdo anecoico. Em fase de revisão para conclusão diagnóstica.',
      doctorName: 'Dr. Roberto Radiologista (CRM 654321-SP)',
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

  console.log('✅ Seed finalizado com sucesso nos horários locais corretos!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
