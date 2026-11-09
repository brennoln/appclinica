# 🏥 MedVida - Sistema Integrado de Agendamento Clínico e Gestão de Laudos

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![NodeJS](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![Prisma](https://img.shields.io/badge/Prisma_ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

Uma solução full-stack moderna voltada para a área de saúde, projetada para gerenciar o fluxo de agendamento de exames de diagnóstico por imagem e disponibilização segura de laudos médicos entre a equipe da clínica e os pacientes.

O sistema foi construído seguindo princípios de **Clean Architecture**, **Domain-Driven Design (DDD)**, controle atômico de **concorrência**, diretrizes de **acessibilidade (WCAG 2.1 AA)** e uma suíte rigorosa de **testes automatizados**.

---

## 🧭 Sumário

1. [Como Iniciar o Projeto com 1 Comando (Novo)](#-como-iniciar-o-projeto-com-1-comando-recomendado)
2. [Visão Geral & Arquitetura](#-visão-geral--arquitetura)
3. [Funcionalidades Principais](#-funcionalidades-principais)
4. [Perfis de Acesso & Segurança](#-perfis-de-acesso--segurança)
5. [Regras de Negócio & Temporalidade](#-regras-de-negócio--temporalidade)
6. [Guia Prático de Como Usar o Sistema](#-guia-prático-de-como-usar-o-sistema)
7. [Ambiente Docker](#-ambiente-docker)
8. [Suíte de Testes Automatizados](#-suíte-de-testes-automatizados)
9. [Decisões Técnicas, Limitações e Próximos Passos](#-decisões-técnicas-limitações-e-próximos-passos)
10. [Variáveis de Ambiente](#-variáveis-de-ambiente)

---

## ⚡ Como Iniciar o Projeto com 1 Comando (Recomendado)

Você pode rodar tanto o **Backend** quanto o **Frontend** simultaneamente a partir da raiz do projeto (`appclinica/`), sem precisar abrir múltiplos terminais manualmente:

### 1. Clonar o repositório e instalar tudo:
```bash
git clone https://github.com/brennoln/appclinica.git
cd appclinica
npm install
npm run install:all
```

### 2. Preparar o banco de dados com dados de teste:
```bash
npm run seed
```

### 3. Iniciar Backend e Frontend juntos:
```bash
npm run dev
```

Pronto! O comando iniciará os dois serviços simultaneamente:
- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3333/api](http://localhost:3333/api)

---

### 💡 Alternativa: Executando em Terminais Separados

Se preferir rodar cada serviço de forma independente:

#### Terminal 1 (Backend):
```bash
cd backend
npm install
cp .env.example .env
npx prisma db push
npm run db:seed
npm run dev
```

#### Terminal 2 (Frontend):
> ⚠️ **Importante:** Abra uma **nova aba ou janela do terminal**, certifique-se de estar na pasta raiz `appclinica` e entre em `frontend`:
```bash
cd frontend
npm install
npm run dev
```

---

## 🏗️ Visão Geral & Arquitetura

O projeto adota uma arquitetura em camadas desacoplada e modular, garantindo facilidade de manutenção e alta testabilidade:

```
appclinica/
├── package.json             # Scripts de orquestração simultânea (npm run dev)
├── backend/
│   ├── src/
│   │   ├── config/          # Instâncias e configurações de banco (Prisma Client)
│   │   ├── controllers/     # Camada HTTP fina (validação de schemas via Zod)
│   │   ├── errors/          # Classes customizadas de exceção (AppError)
│   │   ├── middlewares/     # Autenticação JWT, controle de RBAC e errorHandler
│   │   ├── repositories/    # Abstração de persistência e transações atômicas
│   │   ├── routes/          # Definição e proteção de rotas REST
│   │   ├── services/        # Regras de negócio puras e validações de domínio
│   │   └── server.ts        # Bootstrap da aplicação Express
│   ├── tests/               # Testes unitários de serviços e integração E2E
│   └── prisma/              # Schema relacional, migrations e seed de dados
│
└── frontend/
    ├── src/
    │   ├── components/      # Componentes de interface acessíveis (Modais, Dashboards)
    │   ├── context/         # Autenticação e persistência de sessão JWT
    │   ├── hooks/           # Custom Hooks para data fetching (useAppointments, usePatients)
    │   ├── services/        # Cliente Axios configurado com interceptors
    │   └── types.ts         # Contratos e tipos compartilhados em TypeScript
```

---

## ✨ Funcionalidades Principais

- **Agenda Centralizada em Sala Única:** Gestão de horários em blocos padronizados de 30 minutos para exames como **Raio-X**, **Ultrassom** e **Ressonância Magnética**.
- **Prevenção de Colisões & Concorrência:** Algoritmo transacional que impede conflitos de agenda para o mesmo horário.
- **Ciclo de Vida de Laudos Médicos:** Criação e edição em modo **Rascunho** e **Publicação Oficial** com assinatura do médico responsável e registro de data/hora.
- **Portal Seguro do Paciente:** Visualização confidencial dos exames próprios e download/impressão de laudos oficiais.
- **Acessibilidade Inclusiva (WCAG 2.1 AA):** Navegação por teclado, foco retido em diálogos, alto contraste e leitores de tela suportados.

---

## 🔐 Perfis de Acesso & Segurança

O sistema implementa **RBAC (Role-Based Access Control)** com tokens JWT emitidos no login e validados estritamente no backend em todas as requisições:

| Perfil | Permissões |
| :--- | :--- |
| **Equipe da Clínica (`CLINIC`)** | Pode agendar exames para qualquer paciente, consultar/filtrar agendamentos por data ou paciente, cancelar exames pendentes, redigir/editar rascunhos de laudos e publicar laudos oficiais. |
| **Paciente (`PATIENT`)** | Consulta exclusivamente os seus próprios exames marcados. Consegue visualizar e imprimir apenas laudos oficiais que já foram publicados pela clínica. |

### Contas de Demonstração Rápidas

Para facilitar a experimentação local, o sistema já vem com contas pré-configuradas e atalhos de **1 clique na tela de login**:

| Perfil | E-mail | Senha | Cenário Pré-carregado |
| :--- | :--- | :--- | :--- |
| **Clínica** | `clinica@demo.com` | `123456` | Acesso administrativo completo com agenda do dia |
| **Paciente 1** | `carlos@demo.com` | `123456` | Paciente com 1 laudo publicado e 1 exame em análise clínica |
| **Paciente 2** | `juliana@demo.com` | `123456` | Paciente com agendamento ativo aguardando realização |

---

## ⏱️ Regras de Negócio & Temporalidade

1. **Fuso Horário Oficial:** O sistema adota explicitamente `America/Sao_Paulo` (UTC-3). O backend processa e armazena os horários em UTC padronizado (ISO 8601), convertendo para a hora local na visualização.
2. **Intervalos Fixos:** Para manter a previsibilidade das salas de exames, os agendamentos são permitidos exclusivamente em intervalos fixos de 30 minutos (ex: `09:00`, `09:30`, `10:00`).
3. **Bloqueio no Passado:** Não é permitido marcar exames para datas ou horários anteriores ao momento da requisição.
4. **Sala Única & Concorrência Real:** Se duas pessoas tentarem reservar o mesmo horário ao mesmo tempo, apenas a primeira solicitação é aceita (`201 Created`), enquanto a segunda recebe conflito (`409 Conflict`).
5. **Reaproveitamento de Horários:** Caso um agendamento seja cancelado, aquele horário volta a ficar disponível para novos pacientes.
6. **Integridade de Laudos:**
   - Cada exame aceita exatamente um laudo médico.
   - Exames cancelados não podem receber laudos.
   - Exames com laudo já publicado **não podem ser cancelados**.
   - Laudos publicados tornam-se imutáveis para garantir a validade jurídica e médica do documento.
   - Rascunhos de laudo nunca são visíveis para pacientes.

---

## 📖 Guia Prático de Como Usar o Sistema

### 1. Como Administrador / Equipe da Clínica:
1. Faça login utilizando o botão rápido **Clínica** ou com `clinica@demo.com` / `123456`.
2. **Criar Agendamento:** Clique no botão azul **Novo Agendamento**, selecione o paciente, o tipo de exame, a data e um horário disponível.
3. **Filtrar Exames:** Utilize os seletores de **Paciente** ou **Data** no topo para encontrar agendamentos específicos.
4. **Cadastrar Laudo:** Na tabela, clique em **Cadastrar Laudo**. Preencha o título, o nome do médico responsável e o parecer clínico.
   - Escolha **Salvar Rascunho** caso ainda precise revisar o texto (o paciente não verá).
   - Escolha **Publicar Laudo Oficial** quando o documento estiver concluído (ficará imediatamente acessível para o paciente).
5. **Cancelar Exame:** Clique no botão **Cancelar** em exames que ainda não tenham laudo publicado. Uma confirmação acessível surgirá na tela.

### 2. Como Paciente:
1. Faça login como **Carlos** (`carlos@demo.com`) ou **Juliana** (`juliana@demo.com`).
2. **Consultar Exames:** Visualize seu histórico de agendamentos confirmados e cancelados.
3. **Acessar Laudo Oficial:** Para exames com laudo liberado, clique em **Visualizar Laudo Oficial**.
4. **Imprimir Laudo:** No modal de leitura, utilize a opção **Imprimir / Salvar PDF** para gerar uma via física ou documento digital do exame.

---

## 🐳 Ambiente Docker

Você pode executar toda a stack com um único comando utilizando o **Docker Compose**:

```bash
docker-compose up --build
```

A aplicação estará disponível em:
- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3333/api](http://localhost:3333/api)

---

## 🧪 Suíte de Testes Automatizados

O sistema conta com uma cobertura completa de **testes automatizados (22 testes)** utilizando **Vitest** e **Supertest**, divididos em testes unitários puros com dublês de teste (mocks) e testes de integração de ponta a ponta:

```bash
npm test
```

### Cenários Validados nos Testes:
- ✅ **Concorrência Atômica:** Duas tentativas simultâneas de agendamento no mesmo horário resultam em apenas uma aprovada (`201`) e a outra rejeitada por conflito (`409`).
- ✅ **Isolamento de Segurança (IDOR):** Paciente tentando consultar laudo pertencente a outro paciente tem acesso negado (`403 Forbidden`).
- ✅ **Confidencialidade de Rascunhos:** Paciente tentando acessar um laudo em rascunho de seu próprio exame tem o acesso bloqueado (`403 Forbidden`).
- ✅ **Publicação e Disponibilidade:** Laudo publicado pela clínica passa a estar imediatamente disponível para o paciente correto.
- ✅ **Validação Temporal de Passado:** Rejeição de agendamentos em horários passados (`400 Bad Request`).
- ✅ **Reaproveitamento de Horários:** Horário de um agendamento cancelado é liberado com sucesso para um novo paciente.
- ✅ **Padronização de Intervalos:** Bloqueio de agendamentos fora da grade de 30 minutos.
- ✅ **Imutabilidade e Regras de Negócio:** Bloqueio de cancelamento de exames com laudo emitido e bloqueio de edição em laudos já publicados.

---

## 🧠 Decisões Técnicas, Limitações e Próximos Passos

### Decisões de Arquitetura:
- **Prisma ORM com SQLite:** Escolhido propositalmente para permitir que qualquer desenvolvedor ou avaliador execute o projeto localmente com `npm run dev` sem precisar instalar ou configurar PostgreSQL, MySQL ou Docker externos. A tipagem estrita do schema permite migrar para PostgreSQL trocando apenas a flag do provider no arquivo `.env`.
- **Desacoplamento em Camadas (Service-Repository):** Separação clara entre a camada de transporte (Express/Controllers) e as regras clínicas (Services), permitindo testar toda a lógica de negócio em milissegundos sem tocar no banco de dados.
- **Acessibilidade em Primeiro Lugar:** Desenvolvimento com foco em semântica HTML, rótulos explícitos e controle de foco em caixas de diálogo modais.

### Limitações Conhecidas & Roadmap Futuro:
- **Múltiplas Salas e Especialidades:** Atualmente o sistema considera uma única sala física de exames. Uma evolução natural do modelo de dados é incluir a entidade `Room` e `DoctorSchedule`.
- **Notificações em Tempo Real:** Disparo de notificações via WhatsApp ou E-mail quando um laudo for publicado.
- **Assinatura Digital ICP-Brasil:** Integração com certificados digitais A1/A3 para assinatura criptográfica de laudos médicos em formato PDF.

---

## ⚙️ Variáveis de Ambiente

As configurações do backend são gerenciadas através do arquivo `.env` na pasta `backend/`:

```env
# Porta do servidor HTTP
PORT=3333

# URL de conexão com o banco de dados (SQLite local)
DATABASE_URL="file:./dev.db"

# Segredo para assinatura de tokens JWT
JWT_SECRET="chave-secreta-para-ambiente-de-desenvolvimento"

# Fuso horário padrão da aplicação
TIMEZONE="America/Sao_Paulo"
```

---

## 👨‍💻 Autor

Desenvolvido por **Brenno Lopes Nóbrega** como projeto de portfólio em desenvolvimento full-stack com TypeScript, React e Node.js.

- **GitHub:** [@brennoln](https://github.com/brennoln)
- **Repositório:** [https://github.com/brennoln/appclinica](https://github.com/brennoln/appclinica)
