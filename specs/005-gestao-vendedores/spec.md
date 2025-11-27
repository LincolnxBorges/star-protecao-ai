# Feature Specification: Gestao de Vendedores

**Feature Branch**: `005-gestao-vendedores`
**Created**: 2025-11-27
**Status**: Draft
**Input**: Tela de gestao de vendedores para administradores gerenciarem equipe de vendas, visualizarem performance individual e coletiva, controlarem status de vendedores no round-robin e configurarem regras de distribuicao de leads.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visualizar Lista de Vendedores com KPIs (Priority: P1)

Como administrador, quero visualizar todos os vendedores cadastrados com seus indicadores de performance para ter uma visao geral da equipe de vendas.

**Why this priority**: Esta e a funcionalidade base que permite ao administrador ter visibilidade da equipe. Sem isso, nenhuma outra acao de gestao e possivel.

**Independent Test**: Pode ser testado acessando a pagina de vendedores e verificando que a lista exibe os vendedores com seus KPIs (cotacoes, aceitas, conversao, tempo medio).

**Acceptance Scenarios**:

1. **Given** administrador autenticado, **When** acessa /vendedores, **Then** ve lista de todos os vendedores com cards de resumo do time (total, ativos, conversao media, tempo medio)
2. **Given** lista de vendedores carregada, **When** visualiza um card de vendedor, **Then** ve nome, email, telefone, status, metricas do mes (cotacoes, aceitas, conversao, tempo medio)
3. **Given** vendedor inativo na lista, **When** visualiza o card, **Then** ve indicacao visual diferenciada (opacidade reduzida) com data de inativacao e motivo

---

### User Story 2 - Cadastrar Novo Vendedor (Priority: P1)

Como administrador, quero cadastrar novos vendedores no sistema para que possam receber e trabalhar cotacoes.

**Why this priority**: Essencial para crescimento da equipe. Sem cadastro, nao ha vendedores para gerenciar.

**Independent Test**: Pode ser testado clicando em "Novo Vendedor", preenchendo formulario e verificando que vendedor aparece na lista.

**Acceptance Scenarios**:

1. **Given** administrador na tela de vendedores, **When** clica em "Novo Vendedor", **Then** abre modal com formulario de cadastro
2. **Given** modal de cadastro aberto, **When** preenche campos obrigatorios (nome, email, telefone, perfil, senha) e salva, **Then** vendedor e criado e aparece na lista
3. **Given** formulario de cadastro, **When** tenta salvar com email ja existente, **Then** exibe mensagem de erro "E-mail ja cadastrado"
4. **Given** formulario de cadastro, **When** marca "Participar do round-robin automatico", **Then** vendedor entra na fila de distribuicao ao ser criado como ativo

---

### User Story 3 - Editar Dados do Vendedor (Priority: P2)

Como administrador, quero editar informacoes de vendedores existentes para manter dados atualizados.

**Why this priority**: Necessario para manutencao da equipe, mas depende da listagem existir primeiro.

**Independent Test**: Pode ser testado abrindo edicao de um vendedor, alterando dados e verificando que alteracoes foram salvas.

**Acceptance Scenarios**:

1. **Given** vendedor na lista, **When** clica em "Editar", **Then** abre modal com dados preenchidos
2. **Given** modal de edicao aberto, **When** altera campos e salva, **Then** dados sao atualizados na lista
3. **Given** modal de edicao, **When** altera email para um ja existente, **Then** exibe mensagem de erro

---

### User Story 4 - Ativar/Desativar Vendedor (Priority: P2)

Como administrador, quero ativar ou desativar vendedores para controlar quem recebe leads.

**Why this priority**: Controle operacional importante para gestao diaria da equipe.

**Independent Test**: Pode ser testado desativando um vendedor e verificando que ele nao recebe mais leads no round-robin.

**Acceptance Scenarios**:

1. **Given** vendedor ativo, **When** clica em "Desativar", **Then** abre modal de confirmacao
2. **Given** modal de desativacao de vendedor com leads pendentes, **When** escolhe redistribuir leads e confirma, **Then** vendedor e desativado e leads sao redistribuidos
3. **Given** vendedor inativo, **When** clica em "Ativar", **Then** vendedor volta ao status ativo e entra no final da fila do round-robin
4. **Given** vendedor sendo desativado, **When** informa motivo (ex: ferias), **Then** motivo e salvo e exibido no card

---

### User Story 5 - Buscar e Filtrar Vendedores (Priority: P2)

Como administrador, quero buscar e filtrar vendedores para encontrar rapidamente quem preciso.

**Why this priority**: Facilita gestao em equipes maiores, mas lista basica ja funciona para equipes pequenas.

**Independent Test**: Pode ser testado digitando nome na busca e verificando que lista e filtrada.

**Acceptance Scenarios**:

1. **Given** lista de vendedores, **When** digita nome/email/telefone na busca, **Then** lista e filtrada em tempo real
2. **Given** lista de vendedores, **When** seleciona filtro "Ativos", **Then** mostra apenas vendedores ativos
3. **Given** lista de vendedores, **When** seleciona ordenacao "Maior conversao", **Then** lista e reordenada por taxa de conversao decrescente

---

### User Story 6 - Visualizar Perfil Completo do Vendedor (Priority: P2)

Como administrador, quero ver o perfil completo de um vendedor com historico de performance para analise detalhada.

**Why this priority**: Importante para avaliacao de desempenho, mas nao bloqueia operacoes basicas.

**Independent Test**: Pode ser testado clicando em "Ver perfil" e verificando que exibe metricas detalhadas e historico.

**Acceptance Scenarios**:

1. **Given** vendedor na lista, **When** clica em "Ver perfil", **Then** abre modal com dados completos
2. **Given** perfil aberto, **When** seleciona periodo diferente, **Then** metricas sao atualizadas para o periodo
3. **Given** perfil aberto, **When** visualiza secao de cotacoes recentes, **Then** ve ultimas cotacoes do vendedor com status

---

### User Story 7 - Configurar Round-Robin (Priority: P3)

Como administrador, quero configurar o metodo de distribuicao de leads para otimizar a equipe.

**Why this priority**: Otimizacao avancada. O sistema funciona com configuracao padrao (sequencial).

**Independent Test**: Pode ser testado alterando metodo de distribuicao e verificando que novos leads seguem a nova regra.

**Acceptance Scenarios**:

1. **Given** card de round-robin na pagina, **When** clica em "Editar", **Then** abre modal de configuracao
2. **Given** modal de configuracao, **When** seleciona metodo "Balanceamento por carga", **Then** sistema passa a priorizar vendedores com menos leads pendentes
3. **Given** modal de configuracao, **When** define limite de 10 leads pendentes por vendedor, **Then** vendedores que atingirem limite sao temporariamente pulados

---

### User Story 8 - Gerenciar Fila do Round-Robin (Priority: P3)

Como administrador, quero ver e reordenar a fila do round-robin para ajustes manuais.

**Why this priority**: Controle fino da distribuicao. Sistema funciona automaticamente sem isso.

**Independent Test**: Pode ser testado reordenando vendedores na fila e verificando que proximo lead vai para o vendedor correto.

**Acceptance Scenarios**:

1. **Given** card de round-robin, **When** visualiza fila, **Then** ve ordem dos vendedores ativos com indicacao de quem e o proximo
2. **Given** fila do round-robin, **When** arrasta vendedor para outra posicao, **Then** ordem e atualizada
3. **Given** fila do round-robin, **When** clica em "Resetar", **Then** fila volta a ordem alfabetica

---

### User Story 9 - Reatribuir Leads de um Vendedor (Priority: P3)

Como administrador, quero reatribuir leads de um vendedor para outros para redistribuicao manual.

**Why this priority**: Funcionalidade de excecao, nao usada no dia a dia.

**Independent Test**: Pode ser testado selecionando leads de um vendedor e atribuindo a outro, verificando que leads aparecem no novo vendedor.

**Acceptance Scenarios**:

1. **Given** vendedor com leads pendentes, **When** clica em "Reatribuir leads" no menu, **Then** abre modal com lista de leads
2. **Given** modal de reatribuicao, **When** seleciona leads e escolhe "Distribuir igualmente", **Then** leads sao distribuidos entre vendedores ativos
3. **Given** modal de reatribuicao, **When** seleciona leads e escolhe vendedor especifico, **Then** leads sao atribuidos ao vendedor escolhido

---

### Edge Cases

- O que acontece quando o unico vendedor ativo e desativado? Sistema exibe alerta e nao permite distribuicao automatica ate que haja pelo menos um ativo.
- Como o sistema trata vendedor excluido com cotacoes historicas? Cotacoes mantem referencia ao vendedor mas ele nao aparece mais na listagem ativa.
- O que acontece quando vendedor atinge limite de leads pendentes? Vendedor e temporariamente pulado na fila e recebe badge "Ocupado".
- Como funciona reativacao de vendedor em ferias? Vendedor volta ao final da fila automaticamente.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sistema DEVE exibir lista paginada de vendedores com 10, 25 ou 50 itens por pagina
- **FR-002**: Sistema DEVE exibir cards de KPIs do time (total vendedores, ativos, conversao media, tempo medio ate primeiro contato, cotacoes do mes, aceitas, potencial em reais, top vendedor)
- **FR-003**: Sistema DEVE permitir busca por nome, email ou telefone do vendedor
- **FR-004**: Sistema DEVE permitir filtro por status (todos, ativos, inativos, ferias)
- **FR-005**: Sistema DEVE permitir ordenacao por nome, cotacoes, aceitas, conversao, tempo de resposta, ultimo lead, data de cadastro
- **FR-006**: Sistema DEVE exibir para cada vendedor: avatar/iniciais, nome, cargo, email, telefone, status, metricas do mes
- **FR-007**: Sistema DEVE permitir cadastro de novo vendedor com: nome, email, telefone, cargo, perfil de acesso, senha, status, configuracoes de notificacao
- **FR-008**: Sistema DEVE validar unicidade de email no cadastro e edicao
- **FR-009**: Sistema DEVE validar formato de email e telefone
- **FR-010**: Sistema DEVE validar senha com minimo 8 caracteres, 1 numero e 1 maiuscula
- **FR-011**: Sistema DEVE permitir edicao de dados do vendedor
- **FR-012**: Sistema DEVE permitir ativar/desativar vendedor com confirmacao
- **FR-013**: Sistema DEVE permitir informar motivo ao desativar vendedor
- **FR-014**: Sistema DEVE oferecer opcoes para leads pendentes ao desativar: manter, redistribuir ou atribuir a vendedor especifico
- **FR-015**: Sistema DEVE exibir perfil completo do vendedor com metricas detalhadas e historico
- **FR-016**: Sistema DEVE permitir filtro de periodo no perfil do vendedor
- **FR-017**: Sistema DEVE exibir grafico de evolucao mensal no perfil
- **FR-018**: Sistema DEVE exibir cotacoes recentes do vendedor no perfil
- **FR-019**: Sistema DEVE exibir card de configuracoes do round-robin com metodo atual, vendedores na fila e proximo a receber
- **FR-020**: Sistema DEVE permitir configurar metodo de distribuicao: sequencial, balanceamento por carga, por performance ou por velocidade
- **FR-021**: Sistema DEVE permitir configurar limite de leads pendentes por vendedor
- **FR-022**: Sistema DEVE exibir fila do round-robin com ordem e status de cada vendedor
- **FR-023**: Sistema DEVE permitir reordenar fila do round-robin manualmente
- **FR-024**: Sistema DEVE permitir resetar fila para ordem alfabetica
- **FR-025**: Sistema DEVE permitir reatribuir leads de um vendedor para outros
- **FR-026**: Sistema DEVE remover automaticamente vendedores inativos/ferias da fila do round-robin
- **FR-027**: Sistema DEVE adicionar vendedor reativado ao final da fila automaticamente
- **FR-028**: Sistema DEVE restringir acesso a tela de gestao apenas para administradores
- **FR-029**: Sistema DEVE permitir redefinicao de senha do vendedor pelo administrador
- **FR-030**: Sistema DEVE permitir exclusao de vendedor com confirmacao

### Key Entities

- **Vendedor (Seller)**: Usuario que trabalha cotacoes. Atributos: nome, email, telefone, cargo, perfil de acesso (vendedor/supervisor/admin), status (ativo/inativo/ferias), configuracoes de notificacao, posicao na fila round-robin, data cadastro, ultimo acesso.
- **Configuracao Round-Robin**: Regras de distribuicao de leads. Atributos: metodo (sequencial/carga/performance/velocidade), limite leads pendentes, configuracoes adicionais.
- **Fila Round-Robin**: Ordem de distribuicao de leads. Relaciona vendedores ativos em ordem de prioridade.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Administrador consegue visualizar lista completa de vendedores em menos de 3 segundos
- **SC-002**: Administrador consegue cadastrar novo vendedor em menos de 2 minutos
- **SC-003**: Administrador consegue encontrar vendedor especifico usando busca em menos de 10 segundos
- **SC-004**: Sistema exibe KPIs do time atualizados em tempo real (delay maximo de 5 segundos apos mudanca)
- **SC-005**: Administrador consegue desativar vendedor e redistribuir leads em menos de 1 minuto
- **SC-006**: Sistema aplica nova configuracao de round-robin imediatamente apos salvamento
- **SC-007**: 95% das operacoes de gestao (CRUD de vendedores) completam sem erros

## Assumptions

- O sistema ja possui autenticacao e controle de acesso por perfil (admin/vendedor/supervisor)
- Ja existe tabela de vendedores (sellers) no banco de dados
- O round-robin basico ja esta implementado e esta especificacao adiciona interface de gestao
- Metricas de performance (cotacoes, aceitas, tempo medio) ja sao calculadas pelo sistema
- Notificacoes por email e WhatsApp ja estao configuradas no sistema
