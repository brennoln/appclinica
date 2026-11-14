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
    targetDate.setUTCHours(14, 0, 0, 0);

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
    futureDate.setUTCHours(10, 0, 0, 0);

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
    futureDate.setUTCHours(11, 30, 0, 0);

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
    futureDate.setUTCHours(15, 0, 0, 0);

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
    targetDate.setUTCHours(16, 0, 0, 0);

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

  // Cenário Extra 3b: Cancelar e criar laudo publicado (POST) simultaneamente nunca deve produzir estado inválido
  it('Cancelar agendamento e criar laudo publicado diretamente (POST) simultaneamente nunca deve gerar estado inválido', async () => {
    for (let i = 0; i < 3; i++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 26 + i);
      targetDate.setUTCHours(16, 0, 0, 0);

      const apptRes = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${clinicToken}`)
        .send({
          patientId: patient1Id,
          examType: 'RAIO_X',
          dateTime: targetDate.toISOString(),
        });

      const cancelReq = request(app)
        .patch(`/api/appointments/${apptRes.body.id}/cancel`)
        .set('Authorization', `Bearer ${clinicToken}`);

      const createPublishedReq = request(app)
        .post(`/api/appointments/${apptRes.body.id}/report`)
        .set('Authorization', `Bearer ${clinicToken}`)
        .send({
          title: `Laudo Direto Concorrente ${i}`,
          content: 'Conteúdo publicado diretamente',
          doctorName: 'Dr. Concorrência',
          status: 'PUBLISHED',
        });

      const [cancelOut, createOut] = await Promise.all([cancelReq, createPublishedReq]);

      // Se o cancelamento venceu (200), a criação do laudo deve falhar (400).
      // Se a criação publicada venceu (201), o cancelamento deve falhar (400).
      if (cancelOut.status === 200) {
        expect(createOut.status).toBe(400);
      } else {
        expect(createOut.status).toBe(201);
        expect(cancelOut.status).toBe(400);
      }

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

  // Cenário Extra 5: Filtro de data inválido e JSON malformado devem retornar 400 (nunca 500)
  it('Deve retornar 400 para filtro de data malformado, data inexistente no calendário ou JSON inválido sem gerar erro 500', async () => {
    const badDateRes = await request(app)
      .get('/api/appointments?date=data-invalida')
      .set('Authorization', `Bearer ${clinicToken}`);
    expect(badDateRes.status).toBe(400);

    const rolloverDateRes = await request(app)
      .get('/api/appointments?date=2027-02-30')
      .set('Authorization', `Bearer ${clinicToken}`);
    expect(rolloverDateRes.status).toBe(400);

    const rolloverCreateRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        patientId: patient1Id,
        examType: 'RAIO_X',
        dateTime: '2027-02-30T09:00:00.000-03:00',
      });
    expect(rolloverCreateRes.status).toBe(400);

    const badJsonRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${clinicToken}`)
      .set('Content-Type', 'application/json')
      .send('{"patientId": "incompleto"');
    expect(badJsonRes.status).toBe(400);
  });

  // Cenário Extra 6: ISO 8601 sem sufixo de fuso deve assumir o fuso documentado (America/Sao_Paulo, -03:00)
  it('Deve interpretar strings ISO 8601 sem fuso explícito diretamente em America/Sao_Paulo (-03:00)', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        patientId: patient1Id,
        examType: 'RAIO_X',
        dateTime: '2027-12-01T09:00:00',
      });

    expect(res.status).toBe(201);
    expect(res.body.dateTime).toBe('2027-12-01T12:00:00.000Z');
  });

  // Cenário Extra 7: RBAC completo, autenticação JWT e isolamento na listagem de exames do paciente
  it('Deve garantir controle de acesso estrito (401/403) em rotas restritas e ocultar rascunhos na listagem do paciente', async () => {
    // Sem token -> 401
    const noTokenRes = await request(app).get('/api/appointments');
    expect(noTokenRes.status).toBe(401);

    // Token inválido -> 401
    const badTokenRes = await request(app)
      .get('/api/appointments')
      .set('Authorization', 'Bearer token-invalido-123');
    expect(badTokenRes.status).toBe(401);

    // Paciente tentando criar agendamento -> 403
    const patientCreateAppt = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patient1Token}`)
      .send({
        patientId: patient1Id,
        examType: 'RAIO_X',
        dateTime: '2027-12-05T09:00:00.000-03:00',
      });
    expect(patientCreateAppt.status).toBe(403);

    // Paciente tentando listar todos os pacientes -> 403
    const patientListPatients = await request(app)
      .get('/api/patients')
      .set('Authorization', `Bearer ${patient1Token}`);
    expect(patientListPatients.status).toBe(403);

    // Cria exame para Paciente 1 (com rascunho) e para Paciente 2
    const apptP1 = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        patientId: patient1Id,
        examType: 'RAIO_X',
        dateTime: '2027-12-06T09:00:00.000-03:00',
      });

    await request(app)
      .post(`/api/appointments/${apptP1.body.id}/report`)
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        title: 'Rascunho Secreto',
        content: 'Conteúdo interno',
        doctorName: 'Dr. Interno',
        status: 'DRAFT',
      });

    await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        patientId: patient2Id,
        examType: 'ULTRASSOM',
        dateTime: '2027-12-06T09:30:00.000-03:00',
      });

    // Paciente tentando cancelar exame -> 403
    const patientCancel = await request(app)
      .patch(`/api/appointments/${apptP1.body.id}/cancel`)
      .set('Authorization', `Bearer ${patient1Token}`);
    expect(patientCancel.status).toBe(403);

    // Paciente 1 listando agendamentos: vê apenas o seu próprio e com report === null (pois é DRAFT)
    const p1List = await request(app)
      .get(`/api/appointments?patientId=${patient2Id}`) // tenta forçar filtro de outro paciente
      .set('Authorization', `Bearer ${patient1Token}`);
    expect(p1List.status).toBe(200);
    expect(p1List.body).toHaveLength(1);
    expect(p1List.body[0].patientId).toBe(patient1Id);
    expect(p1List.body[0].report).toBeNull();
  });

  // Cenário Extra 8: Concorrência em criação de laudo, cancelamento e cadastro de paciente sem erros 500
  it('Deve tratar concorrência em criação de laudo, cancelamento e cadastro de paciente sem gerar erro 500', async () => {
    const apptRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        patientId: patient1Id,
        examType: 'RAIO_X',
        dateTime: '2027-12-10T10:00:00.000-03:00',
      });

    // 5 requisições simultâneas criando laudo para o mesmo exame
    const reportReqs = Array.from({ length: 5 }, (_, i) =>
      request(app)
        .post(`/api/appointments/${apptRes.body.id}/report`)
        .set('Authorization', `Bearer ${clinicToken}`)
        .send({
          title: `Laudo Simultâneo ${i}`,
          content: 'Texto do laudo',
          doctorName: 'Dr. Concorrente',
          status: 'DRAFT',
        })
    );
    const reportResults = await Promise.all(reportReqs);
    const reportStatuses = reportResults.map((r) => r.status);
    expect(reportStatuses.filter((s) => s === 201)).toHaveLength(1);
    expect(reportStatuses.filter((s) => s === 400)).toHaveLength(4);
    expect(reportStatuses.filter((s) => s >= 500)).toHaveLength(0);

    // 5 requisições simultâneas cancelando o mesmo exame
    const cancelReqs = Array.from({ length: 5 }, () =>
      request(app)
        .patch(`/api/appointments/${apptRes.body.id}/cancel`)
        .set('Authorization', `Bearer ${clinicToken}`)
    );
    const cancelResults = await Promise.all(cancelReqs);
    const cancelStatuses = cancelResults.map((r) => r.status);
    expect(cancelStatuses.filter((s) => s === 200)).toHaveLength(1);
    expect(cancelStatuses.filter((s) => s === 400)).toHaveLength(4);
    expect(cancelStatuses.filter((s) => s >= 500)).toHaveLength(0);

    // 5 requisições simultâneas cadastrando o mesmo e-mail de paciente
    const uniqueEmail = `concorrente.${Date.now()}@demo.com`;
    const patientReqs = Array.from({ length: 5 }, () =>
      request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${clinicToken}`)
        .send({
          name: 'Paciente Concorrente',
          email: uniqueEmail,
        })
    );
    const patientResults = await Promise.all(patientReqs);
    const patientStatuses = patientResults.map((r) => r.status);
    expect(patientStatuses.filter((s) => s === 201)).toHaveLength(1);
    expect(patientStatuses.filter((s) => s === 409)).toHaveLength(4);
    expect(patientStatuses.filter((s) => s >= 500)).toHaveLength(0);
  });

  // Cenário Extra 9: Rejeição de campos preenchidos apenas com espaços em branco
  it('Deve rejeitar campos compostos apenas por espaços em branco no cadastro de laudo e paciente (400)', async () => {
    const apptRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        patientId: patient1Id,
        examType: 'RAIO_X',
        dateTime: '2027-12-12T10:00:00.000-03:00',
      });

    const blankReportRes = await request(app)
      .post(`/api/appointments/${apptRes.body.id}/report`)
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        title: '   ',
        content: '   ',
        doctorName: '   ',
        status: 'PUBLISHED',
      });
    expect(blankReportRes.status).toBe(400);

    const blankPatientRes = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        name: '   ',
        email: 'valido@demo.com',
      });
    expect(blankPatientRes.status).toBe(400);
  });
});
