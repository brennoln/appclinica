import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { execSync } from 'child_process';
import request from 'supertest';
import { app } from '../src/server.js';
import { prisma } from '../src/config/database.js';
import bcrypt from 'bcryptjs';

let clinicToken: string;
let patient1Token: string;
let patient2Token: string;
let patient1Id: string;
let patient2Id: string;

beforeAll(async () => {
  // Garante que o esquema do banco de testes isolado (test.db) esteja sincronizado sem afetar dev.db
  execSync('npx prisma db push --skip-generate', {
    env: {
      ...process.env,
      DATABASE_URL: process.env.TEST_DATABASE_URL || 'file:./test.db',
    },
    stdio: 'ignore',
  });

  // Limpar dados do banco de testes e recriar usuários base para os testes
  await prisma.report.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('123456', 10);

  const clinic = await prisma.user.create({
    data: {
      name: 'Recepcionista Maria (Clínica)',
      email: 'clinica@demo.com',
      password: hashedPassword,
      role: 'CLINIC',
    },
  });

  const p1 = await prisma.user.create({
    data: {
      name: 'Carlos Alberto (Paciente 1)',
      email: 'carlos@demo.com',
      password: hashedPassword,
      role: 'PATIENT',
    },
  });

  const p2 = await prisma.user.create({
    data: {
      name: 'Juliana Silveira (Paciente 2)',
      email: 'juliana@demo.com',
      password: hashedPassword,
      role: 'PATIENT',
    },
  });

  patient1Id = p1.id;
  patient2Id = p2.id;

  // Login como Clínica
  const clinicRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'clinica@demo.com', password: '123456' });
  clinicToken = clinicRes.body.token;

  // Login como Paciente 1 (Carlos)
  const p1Res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'carlos@demo.com', password: '123456' });
  patient1Token = p1Res.body.token;

  // Login como Paciente 2 (Juliana)
  const p2Res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'juliana@demo.com', password: '123456' });
  patient2Token = p2Res.body.token;
});

beforeEach(async () => {
  // Limpa agendamentos e laudos entre testes para isolamento completo
  await prisma.report.deleteMany();
  await prisma.appointment.deleteMany();
});

describe('Desafio Técnico - Testes de Integração E2E', () => {
  // Cenário 5: Uma tentativa de agendar no passado é rejeitada.
  it('5. Deve rejeitar uma tentativa de agendar no passado', async () => {
    const pastDate = new Date('2020-01-01T10:00:00.000Z');

    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        patientId: patient1Id,
        examType: 'RAIO_X',
        dateTime: pastDate.toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/passada/i);
  });

  // Cenário 1: Duas tentativas simultâneas de agendamento no mesmo horário: apenas uma deve ser aceita.
  it('1. Duas tentativas simultâneas de agendamento no mesmo horário: apenas uma deve ser aceita', async () => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 10);
    targetDate.setHours(14, 0, 0, 0);

    const p1 = request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        patientId: patient1Id,
        examType: 'RAIO_X',
        dateTime: targetDate.toISOString(),
      });

    const p2 = request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        patientId: patient2Id,
        examType: 'ULTRASSOM',
        dateTime: targetDate.toISOString(),
      });

    const results = await Promise.all([p1, p2]);
    const statuses = results.map((r) => r.status);

    expect(statuses).toContain(201);
    expect(statuses).toContain(409);
  });

  // Cenário 2: Um paciente tenta consultar um laudo de outro paciente: o acesso deve ser negado.
  it('2. Um paciente tenta consultar um laudo de outro paciente: o acesso deve ser negado (403)', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 11);
    futureDate.setHours(10, 0, 0, 0);

    const apptRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        patientId: patient1Id,
        examType: 'RAIO_X',
        dateTime: futureDate.toISOString(),
      });

    const reportRes = await request(app)
      .post(`/api/appointments/${apptRes.body.id}/report`)
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        title: 'Laudo Privado de Carlos',
        content: 'Conteúdo médico confidencial.',
        doctorName: 'Dr. Silveira',
        status: 'PUBLISHED',
      });

    const reportId = reportRes.body.id;

    // Paciente 2 (Juliana) tenta acessar o laudo de Carlos
    const unauthorizedRes = await request(app)
      .get(`/api/reports/${reportId}`)
      .set('Authorization', `Bearer ${patient2Token}`);

    expect(unauthorizedRes.status).toBe(403);
    expect(unauthorizedRes.body.error).toMatch(/pertence a outro paciente/i);
  });

  // Cenário 3: Um paciente tenta acessar um rascunho: seu conteúdo não deve ser disponibilizado.
  it('3. Um paciente tenta acessar um rascunho do seu próprio exame: seu conteúdo não deve ser disponibilizado', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 12);
    futureDate.setHours(11, 30, 0, 0);

    const apptRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        patientId: patient1Id,
        examType: 'ULTRASSOM',
        dateTime: futureDate.toISOString(),
      });

    const reportRes = await request(app)
      .post(`/api/appointments/${apptRes.body.id}/report`)
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        title: 'Rascunho de Laudo',
        content: 'Notas preliminares do radiologista.',
        doctorName: 'Dr. Investigador',
        status: 'DRAFT',
      });

    const draftId = reportRes.body.id;

    // Paciente 1 tenta acessar o laudo em status DRAFT diretamente
    const accessDraftRes = await request(app)
      .get(`/api/reports/${draftId}`)
      .set('Authorization', `Bearer ${patient1Token}`);

    expect(accessDraftRes.status).toBe(403);
    expect(accessDraftRes.body.error).toMatch(/rascunho/i);
  });

  // Cenário 4: Um laudo é publicado e passa a estar disponível para o paciente correto.
  it('4. Um laudo é publicado e passa a estar disponível para o paciente correto', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 13);
    futureDate.setHours(15, 0, 0, 0);

    const apptRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        patientId: patient1Id,
        examType: 'RESSONANCIA_MAGNETICA',
        dateTime: futureDate.toISOString(),
      });

    // 1. Cria como Rascunho
    const draftRes = await request(app)
      .post(`/api/appointments/${apptRes.body.id}/report`)
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        title: 'Ressonância Crânio',
        content: 'Aguardando laudo final.',
        doctorName: 'Dra. Neurologista',
        status: 'DRAFT',
      });

    const reportId = draftRes.body.id;

    // Paciente não tem acesso ao rascunho
    const p1Before = await request(app)
      .get(`/api/reports/${reportId}`)
      .set('Authorization', `Bearer ${patient1Token}`);
    expect(p1Before.status).toBe(403);

    // 2. Clínica publica o laudo
    const publishRes = await request(app)
      .put(`/api/reports/${reportId}`)
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        title: 'Ressonância Crânio - Finalizado',
        content: 'Exame dentro dos padrões da normalidade.',
        doctorName: 'Dra. Neurologista',
        status: 'PUBLISHED',
      });
    expect(publishRes.status).toBe(200);
    expect(publishRes.body.status).toBe('PUBLISHED');
    expect(publishRes.body.publishedAt).toBeDefined();

    // 3. Paciente agora consegue ler o laudo publicado
    const p1After = await request(app)
      .get(`/api/reports/${reportId}`)
      .set('Authorization', `Bearer ${patient1Token}`);

    expect(p1After.status).toBe(200);
    expect(p1After.body.title).toBe('Ressonância Crânio - Finalizado');
    expect(p1After.body.content).toBe('Exame dentro dos padrões da normalidade.');
  });

  // Reutilizar horário de agendamento cancelado
  it('Deve permitir reutilizar o horário de um agendamento cancelado', async () => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 14);
    targetDate.setHours(16, 0, 0, 0);

    // 1. Cria agendamento inicial
    const appt1 = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        patientId: patient1Id,
        examType: 'RAIO_X',
        dateTime: targetDate.toISOString(),
      });
    expect(appt1.status).toBe(201);

    // 2. Cancela o agendamento
    const cancelRes = await request(app)
      .patch(`/api/appointments/${appt1.body.id}/cancel`)
      .set('Authorization', `Bearer ${clinicToken}`);
    expect(cancelRes.status).toBe(200);

    // 3. Reutiliza o mesmo horário com outro paciente
    const appt2 = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        patientId: patient2Id,
        examType: 'ULTRASSOM',
        dateTime: targetDate.toISOString(),
      });
    expect(appt2.status).toBe(201);
    expect(appt2.body.id).not.toBe(appt1.body.id);
  });

  // Cenário Extra 1: Concorrência ampliada (10 requisições simultâneas em dois lotes sem erros 500)
  it('Deve suportar 10 tentativas simultâneas de agendamento no mesmo horário sem erros 500 (1 criado, 9 conflitos 409)', async () => {
    for (let batch = 1; batch <= 2; batch++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 15 + batch);
      targetDate.setUTCHours(13, 0, 0, 0);

      const requests = Array.from({ length: 10 }, (_, idx) =>
        request(app)
          .post('/api/appointments')
          .set('Authorization', `Bearer ${clinicToken}`)
          .send({
            patientId: idx % 2 === 0 ? patient1Id : patient2Id,
            examType: 'RAIO_X',
            dateTime: targetDate.toISOString(),
          })
      );

      const results = await Promise.all(requests);
      const statuses = results.map((r) => r.status);

      const createdCount = statuses.filter((s) => s === 201).length;
      const conflictCount = statuses.filter((s) => s === 409).length;
      const serverErrorCount = statuses.filter((s) => s >= 500).length;

      expect(serverErrorCount).toBe(0);
      expect(createdCount).toBe(1);
      expect(conflictCount).toBe(9);
    }
  });

  // Cenário Extra 2: Bloqueio de publicação de rascunho após cancelamento do agendamento
  it('Deve impedir publicar um rascunho após o agendamento ter sido cancelado e negar acesso ao paciente', async () => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 18);
    targetDate.setUTCHours(14, 0, 0, 0);

    // 1. Cria agendamento e rascunho de laudo
    const apptRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        patientId: patient1Id,
        examType: 'RAIO_X',
        dateTime: targetDate.toISOString(),
      });
    expect(apptRes.status).toBe(201);

    const draftRes = await request(app)
      .post(`/api/appointments/${apptRes.body.id}/report`)
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        title: 'Rascunho aberto antes do cancelamento',
        content: 'Conteúdo preliminar',
        doctorName: 'Dr. Teste',
        status: 'DRAFT',
      });
    expect(draftRes.status).toBe(201);

    // 2. Cancela o agendamento enquanto o rascunho estava criado
    const cancelRes = await request(app)
      .patch(`/api/appointments/${apptRes.body.id}/cancel`)
      .set('Authorization', `Bearer ${clinicToken}`);
    expect(cancelRes.status).toBe(200);

    // 3. Tenta publicar o rascunho do exame já cancelado -> deve ser rejeitado (400)
    const publishRes = await request(app)
      .put(`/api/reports/${draftRes.body.id}`)
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        title: 'Tentativa de publicação após cancelamento',
        content: 'Conteúdo final',
        doctorName: 'Dr. Teste',
        status: 'PUBLISHED',
      });
    expect(publishRes.status).toBe(400);

    // 4. Paciente não deve conseguir consultar o laudo
    const patientRes = await request(app)
      .get(`/api/reports/${draftRes.body.id}`)
      .set('Authorization', `Bearer ${patient1Token}`);
    expect(patientRes.status).toBe(403);
  });

  // Cenário Extra 3: Cancelar e publicar simultaneamente nunca deve produzir estado inválido (CANCELLED + PUBLISHED)
  it('Cancelar agendamento e publicar laudo simultaneamente nunca deve gerar estado inválido nas repetições', async () => {
    for (let i = 0; i < 5; i++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 20 + i);
      targetDate.setUTCHours(15, 0, 0, 0);

      const apptRes = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${clinicToken}`)
        .send({
          patientId: patient1Id,
          examType: 'ULTRASSOM',
          dateTime: targetDate.toISOString(),
        });

      const draftRes = await request(app)
        .post(`/api/appointments/${apptRes.body.id}/report`)
        .set('Authorization', `Bearer ${clinicToken}`)
        .send({
          title: `Rascunho Concorrente ${i}`,
          content: 'Conteúdo em revisão',
          doctorName: 'Dr. Concorrência',
          status: 'DRAFT',
        });

      const cancelReq = request(app)
        .patch(`/api/appointments/${apptRes.body.id}/cancel`)
        .set('Authorization', `Bearer ${clinicToken}`);

      const publishReq = request(app)
        .put(`/api/reports/${draftRes.body.id}`)
        .set('Authorization', `Bearer ${clinicToken}`)
        .send({
          title: `Publicado Concorrente ${i}`,
          content: 'Conteúdo publicado',
          doctorName: 'Dr. Concorrência',
          status: 'PUBLISHED',
        });

      const [cancelOut, publishOut] = await Promise.all([cancelReq, publishReq]);
      const statuses = [cancelOut.status, publishOut.status];

      // Uma operação deve ter sucesso (200) e a outra deve ser rejeitada por regra de negócio (400)
      expect(statuses).toContain(200);
      expect(statuses).toContain(400);

      // Verifica no banco que jamais ocorre (status === CANCELLED && report.status === PUBLISHED)
      const dbAppt = await prisma.appointment.findUnique({
        where: { id: apptRes.body.id },
        include: { report: true },
      });
      const isInvalidState =
        dbAppt?.status === 'CANCELLED' && dbAppt?.report?.status === 'PUBLISHED';
      expect(isInvalidState).toBe(false);
    }
  });

  // Cenário Extra 4: Consistência de fuso horário America/Sao_Paulo independente do cliente
  it('Deve registrar corretamente 30/11 às 09:00 no fuso America/Sao_Paulo (-03:00)', async () => {
    const saoPauloDateTime = '2027-11-30T09:00:00.000-03:00';

    const createRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        patientId: patient1Id,
        examType: 'RESSONANCIA_MAGNETICA',
        dateTime: saoPauloDateTime,
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.dateTime).toBe('2027-11-30T12:00:00.000Z');

    // Filtrando pelo dia 2027-11-30 deve retornar o exame às 09:00 de São Paulo
    const listRes = await request(app)
      .get('/api/appointments?date=2027-11-30')
      .set('Authorization', `Bearer ${clinicToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(1);
    expect(listRes.body[0].id).toBe(createRes.body.id);
  });
});
