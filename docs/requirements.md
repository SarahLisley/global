# Documento de Requisitos e Especificação - Portal do Cliente Bravo

**Versão:** 1.0 (Draft)
**Data:** 30/01/2026

---

## 1. Visão Geral
O **Portal do Cliente Bravo** é uma aplicação web B2B que permite aos clientes da Bravo Tecnologia consultarem suas informações comerciais, financeiras e logísticas em tempo real, integradas diretamente ao ERP WinThor/Oracle. O objetivo é reduzir a carga sobre o time de atendimento, oferecendo autoatendimento 24/7.

---

## 2. Requisitos Funcionais (RF)

### Módulo de Autenticação
- **RF001 - Login:** O sistema deve permitir que o usuário faça login utilizando e-mail e senha.
- **RF002 - Recuperação de Senha:** O sistema deve permitir que o usuário solicite a redefinição de senha via e-mail ("Esqueci minha senha").
- **RF003 - Logout:** O sistema deve permitir que o usuário encerre sua sessão com segurança.
- **RF044 - Sessão Persistente:** O sistema deve manter o usuário logado via cookies seguros (JWT).

### Módulo Dashboard (Home)
- **RF004 - KPIs Principais:** Apresentar cartões com resumo de: Valor Pedido (Mês), Qtde Pedidos, Títulos em Aberto e Entregas Hoje.
- **RF005 - Gráfico SAC:** Exibir gráfico de tickets do SAC por status ou horário.
- **RF006 - Alertas de Documentos:** Exibir lista de documentos (contratos/certidões) próximos do vencimento.

### Módulo Meus Pedidos
- **RF007 - Listagem de Pedidos:** Listar os últimos pedidos do cliente.
- **RF008 - Filtros de Pedidos:** Permitir filtrar pedidos por: Período (Data Inicial/Final), Número do Pedido e Nota Fiscal.
- **RF009 - Detalhes do Pedido:** Exibir os itens (produtos) de um pedido ao expandir a linha ou clicar em detalhes.
- **RF010 - Status do Pedido:** Exibir o status atual (Faturado, Bloqueado, Liberado, Pendente).

### Módulo Financeiro
- **RF011 - Listagem de Títulos:** Listar títulos financeiros (duplicatas).
- **RF012 - Filtros Financeiros:** Permitir filtrar por: Vencimento, Status (Todos, Pagos, Não Pagos), Número do Pedido e NF.
- **RF013 - Status de Pagamento:** Indicar visualmente se o título está Pago, Pendente ou Vencido.
- **RF014 - Juros:** Exibir valor de juros calculado para títulos vencidos (se aplicável).
- **RF015 - Segunda Via de Boleto:** Disponibilizar link para download/visualização do boleto bancário (se disponível).

### Módulo SAC
- **RF016 - Meus Tickets:** Listar histórico de atendimentos/tickets do cliente.
- **RF017 - Detalhe do Ticket:** Exibir a "timeline" de interações de um ticket específico.
- **RF018 - Novo Ticket:** Permitir a abertura de um novo chamado de suporte vinculado a um Pedido ou NF.

### Módulo Logística (Entregas)
- **RF019 - Rastreamento:** Consultar status de entregas em andamento.

---

## 3. Requisitos Não Funcionais (RNF)

- **RNF001 - Performance:** As consultas ao banco de dados (Oracle) devem ser otimizadas para retornar dados em menos de 2 segundos.
- **RNF002 - Segurança:** Todas as senhas devem ser armazenadas com hash forte (bcrypt/argon2).
- **RNF003 - Responsividade:** O portal deve ser totalmente funcional em dispositivos móveis (smartphones e tablets) e desktops.
- **RNF004 - Disponibilidade:** O sistema deve operar 24/7.
- **RNF005 - UX/UI:** A interface deve seguir padrão visual limpo, com feedback claro de erros e carregamento (spinners, toasts).

---

## 4. Regras de Negócio (RN)

- **RN001 - Bloqueio de Acesso:** Clientes inativos no ERP não podem acessar o portal.
- **RN002 - Visualização de Dados:** Um usuário só pode ver dados (pedidos, títulos) vinculados ao seu `CODCLI` (Código de Cliente).
- **RN003 - Títulos Vencidos:** Um título é considerado "Vencido" se a Data de Vencimento for menor que a data atual E a Data de Pagamento for nula.
- **RN004 - Filtro Padrão:** Por padrão, as telas trazem dados dos últimos 30 dias para não sobrecarregar o banco.
- **RN005 - Pedidos Bloqueados:** Pedidos com status 'BLOQUEADO' no ERP devem ser exibidos, mas com indicativo visual de alerta.

---

## 5. Casos de Uso (UC)

### UC01 - Consultar Títulos Vencidos
1. **Ator:** Cliente Logado.
2. **Pré-condição:** Estar na tela "Financeiro".
3. **Fluxo Principal:**
    a. Usuário seleciona filtro de status "Não Pagos" (ou visualiza lista geral).
    b. Sistema exibe lista.
    c. Usuário identifica linhas com destaque vermelho e badge "Vencido".
    d. Usuário clica em "Ver Boleto" para regularizar.

### UC02 - Rastrear Pedido não Entregue
1. **Ator:** Cliente Logado.
2. **Pré-condição:** Estar na tela "Meus Pedidos".
3. **Fluxo Principal:**
    a. Usuário digita o número do pedido na busca.
    b. Sistema retorna o pedido específico.
    c. Usuário verifica a coluna "Posição" ou "Status".
    d. Se necessário, usuário clica em "Ver Itens" para conferir os produtos.

---

## 6. Histórias de Usuário (User Stories)

### Épico: Gestão Financeira
- **US01:** "Como analista financeiro do cliente, quero filtrar apenas os boletos 'Não Pagos', para que eu possa priorizar os pagamentos da semana."
- **US02:** "Como gerente de compras, quero ver claramente quais títulos estão vencidos (em vermelho), para evitar bloqueio de novas compras."
- **US03:** "Como usuário, quero poder clicar num link e abrir o PDF do boleto diretamente, sem precisar pedir por e-mail."

### Épico: Acompanhamento de Pedidos
- **US04:** "Como comprador, quero pesquisar um pedido pelo número da Nota Fiscal, pois é o documento que tenho em mãos quando a mercadoria chega."
- **US05:** "Como comprador, quero ver quais itens estão pendentes em um pedido parcial, para saber o que falta entregar."

### Épico: Acesso e Segurança
- **US06:** "Como usuário, quero recuperar minha senha via e-mail caso eu a esqueça, para não perder acesso ao portal."
