# Feature Specification: Dashboard do Vendedor

**Feature Branch**: `002-dashboard`
**Created**: 2025-11-26
**Status**: Draft
**Input**: User description: "Criar tela de dashboard para vendedores com KPIs, alertas urgentes, cotações recentes e ranking de vendedores"

## Clarifications

### Session 2025-11-26

- Q: Estratégia de atualização de dados do dashboard? → A: Polling a cada 60 segundos
- Q: Visibilidade do ranking para gestores? → A: Mesmo ranking para todos (transparência total)
- Q: Transição de status ao usar ações de contato? → A: Confirmação manual após tentativa de contato
- Q: Comportamento do widget de meta sem meta definida? → A: Mostrar widget com "Meta não definida" e botão para solicitar
- Q: Status "Cancelada" no gráfico de distribuição? → A: Exibir apenas se houver dados (ocultar se zerado)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visualização de KPIs Principais (Priority: P1)

Como vendedor, quero visualizar rapidamente meus indicadores-chave de desempenho (KPIs) para entender minha situação atual de trabalho sem precisar navegar por múltiplas telas.

**Why this priority**: Os KPIs são a informação mais crítica que o vendedor precisa ao abrir o sistema. Responde à pergunta "Como está meu desempenho?" em segundos.

**Independent Test**: Pode ser testado acessando o dashboard e verificando que os 4 cards de KPI (Pendentes, Aceitas, Potencial Mensal, Conversão) são exibidos com dados corretos.

**Acceptance Scenarios**:

1. **Given** um vendedor autenticado, **When** acessa o dashboard, **Then** visualiza 4 cards de KPI: Cotações Pendentes, Cotações Aceitas, Potencial Mensal (R$) e Taxa de Conversão (%)
2. **Given** um vendedor com cotações atribuídas, **When** visualiza o card "Pendentes", **Then** vê o número total de cotações aguardando contato e a variação do dia
3. **Given** um vendedor no dashboard, **When** visualiza o card "Potencial Mensal", **Then** vê a soma das mensalidades das cotações aceitas no mês formatada em Reais (R$)
4. **Given** um vendedor no dashboard, **When** visualiza o card "Conversão", **Then** vê a porcentagem de cotações aceitas em relação ao total e a variação comparada ao mês anterior

---

### User Story 2 - Alertas de Ações Urgentes (Priority: P1)

Como vendedor, quero ser alertado sobre cotações que expiram hoje e leads sem contato há mais de 24h para priorizar minhas ações e evitar perder oportunidades.

**Why this priority**: Alertas urgentes respondem à pergunta crítica "Tenho algo urgente para fazer agora?" e impactam diretamente a conversão de vendas.

**Independent Test**: Pode ser testado verificando que alertas aparecem quando existem cotações expirando hoje ou leads sem contato recente.

**Acceptance Scenarios**:

1. **Given** cotações do vendedor que expiram hoje, **When** acessa o dashboard, **Then** vê um alerta vermelho com o número de cotações e a mensagem "cotações expiram HOJE"
2. **Given** leads atribuídos sem contato há mais de 24h, **When** acessa o dashboard, **Then** vê um alerta amarelo com o número de leads e a mensagem "leads sem contato há 24h+"
3. **Given** um alerta de cotações expirando, **When** clica em "Ver", **Then** é direcionado para a lista filtrada dessas cotações urgentes
4. **Given** nenhuma ação urgente pendente, **When** acessa o dashboard, **Then** a seção de alertas não é exibida ou mostra mensagem positiva

---

### User Story 3 - Lista de Cotações Recentes (Priority: P1)

Como vendedor, quero visualizar minhas cotações mais recentes com informações essenciais e ações rápidas para gerenciar meu trabalho de forma eficiente.

**Why this priority**: A lista de cotações é o ponto central de trabalho do vendedor, permitindo ações imediatas sem navegar para outras telas.

**Independent Test**: Pode ser testado verificando que a lista exibe cotações com todas as informações necessárias e botões de ação funcionais.

**Acceptance Scenarios**:

1. **Given** um vendedor com cotações atribuídas, **When** acessa o dashboard, **Then** vê uma lista das 4 cotações mais recentes ordenadas por data
2. **Given** uma cotação na lista, **When** visualiza os detalhes, **Then** vê: ícone do tipo de veículo, modelo/ano, valor FIPE, nome do cliente, telefone, valor da cotação, tempo decorrido e status
3. **Given** uma cotação na lista, **When** clica no botão de telefone, **Then** inicia uma chamada para o número do cliente
4. **Given** uma cotação na lista, **When** clica no botão de WhatsApp, **Then** abre o WhatsApp com o número do cliente
5. **Given** uma cotação pendente, **When** vendedor retorna de ligação/WhatsApp, **Then** sistema exibe confirmação perguntando se o contato foi realizado com sucesso
6. **Given** vendedor confirma contato realizado, **When** clica em "Sim", **Then** status da cotação muda para "Contatado"
7. **Given** uma cotação na lista, **When** clica no botão de ver detalhes, **Then** é direcionado para a página de detalhes da cotação
8. **Given** o vendedor na lista de cotações, **When** clica em "Ver todas", **Then** é direcionado para a página completa de cotações

---

### User Story 4 - Gráfico de Distribuição por Status (Priority: P2)

Como vendedor, quero visualizar a distribuição das minhas cotações por status para entender o funil de conversão.

**Why this priority**: Fornece visão analítica do pipeline de vendas, ajudando na estratégia de abordagem.

**Independent Test**: Pode ser testado verificando que o gráfico de barras horizontais mostra os 4 status com porcentagens corretas.

**Acceptance Scenarios**:

1. **Given** um vendedor com cotações em diferentes status, **When** visualiza o gráfico de status, **Then** vê barras horizontais para: Pendentes (amarelo), Contatadas (azul), Aceitas (verde), Expiradas (cinza) e Canceladas (vermelho, se houver)
2. **Given** o gráfico de status, **When** visualiza cada barra, **Then** vê a porcentagem correspondente ao lado
3. **Given** um vendedor sem cotações canceladas, **When** visualiza o gráfico de status, **Then** o status "Canceladas" não aparece na lista

---

### User Story 5 - Ranking de Vendedores (Priority: P2)

Como vendedor, quero ver minha posição no ranking mensal comparado aos colegas para entender meu desempenho relativo e me motivar.

**Why this priority**: Gamificação aumenta engajamento e cria competição saudável entre a equipe.

**Independent Test**: Pode ser testado verificando que o ranking mostra os top 5 vendedores com barras de progresso e destaque do usuário atual.

**Acceptance Scenarios**:

1. **Given** um vendedor autenticado, **When** visualiza o ranking, **Then** vê os 5 vendedores com mais cotações aceitas no mês
2. **Given** o ranking exibido, **When** o vendedor está na lista, **Then** sua linha é destacada com cor diferente e indicador "(Você)"
3. **Given** o ranking exibido, **When** visualiza cada vendedor, **Then** vê posição (com medalha para top 3), nome, número de cotações aceitas e barra de progresso
4. **Given** o vendedor no ranking, **When** não está em 1º lugar, **Then** vê uma dica informando quantas cotações faltam para alcançar o líder

---

### User Story 6 - Progresso da Meta Mensal (Priority: P2)

Como vendedor, quero visualizar meu progresso em relação à meta mensal para saber quanto falta para atingi-la.

**Why this priority**: Metas claras e visíveis aumentam foco e produtividade.

**Independent Test**: Pode ser testado verificando que o widget circular mostra progresso correto e métricas detalhadas.

**Acceptance Scenarios**:

1. **Given** um vendedor com meta definida, **When** visualiza o widget de meta, **Then** vê um círculo de progresso com a porcentagem atual
2. **Given** o widget de meta, **When** visualiza os detalhes, **Then** vê: número de aceitas atual, meta total, e quantas faltam para bater a meta
3. **Given** o widget de meta, **When** visualiza o resumo inferior, **Then** vê cards com: Aceitas, Meta e Taxa de Conversão
4. **Given** um vendedor sem meta definida, **When** visualiza o widget de meta, **Then** vê mensagem "Meta não definida" e botão para solicitar configuração

---

### User Story 7 - Saudação Personalizada e Filtro de Período (Priority: P3)

Como vendedor, quero ser recebido com uma saudação personalizada e poder filtrar os dados por período para análise contextualizada.

**Why this priority**: Melhora a experiência do usuário mas não impacta funcionalidade crítica.

**Independent Test**: Pode ser testado verificando saudação dinâmica por horário e funcionamento do filtro de período.

**Acceptance Scenarios**:

1. **Given** um vendedor autenticado antes de 12h, **When** acessa o dashboard, **Then** vê "Bom dia, [Nome]!"
2. **Given** um vendedor autenticado entre 12h e 18h, **When** acessa o dashboard, **Then** vê "Boa tarde, [Nome]!"
3. **Given** um vendedor autenticado após 18h, **When** acessa o dashboard, **Then** vê "Boa noite, [Nome]!"
4. **Given** o filtro de período, **When** seleciona "Hoje", "Esta semana" ou "Este mês", **Then** todos os KPIs e listas são atualizados para refletir o período selecionado

---

### User Story 8 - Navegação Lateral (Sidebar) (Priority: P3)

Como usuário, quero uma navegação lateral consistente para acessar diferentes seções do sistema.

**Why this priority**: Navegação é importante mas é compartilhada com outras funcionalidades do sistema.

**Independent Test**: Pode ser testado verificando que a sidebar exibe os itens corretos e destaca a página atual.

**Acceptance Scenarios**:

1. **Given** o usuário no dashboard, **When** visualiza a sidebar, **Then** vê os itens: Dashboard, Cotações, Clientes, Vendedores, Configurações
2. **Given** a sidebar visível, **When** está na página de dashboard, **Then** o item "Dashboard" está destacado
3. **Given** tela menor que 1024px, **When** visualiza a sidebar, **Then** ela está oculta e acessível via botão de menu

---

### Edge Cases

- O que acontece quando o vendedor não tem nenhuma cotação atribuída? **Exibir estado vazio com mensagem encorajadora**
- O que acontece quando não há meta definida para o vendedor? **Mostrar widget com mensagem "Meta não definida" e botão para solicitar configuração**
- O que acontece quando o vendedor é novo e não está no ranking? **Mostrar posição mesmo fora do top 5 ou mensagem "Complete sua primeira venda"**
- O que acontece quando há erro ao carregar dados? **Exibir mensagem de erro amigável com opção de recarregar**
- O que acontece quando a conexão é perdida durante o uso? **Manter últimos dados carregados e indicar que está offline**

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sistema DEVE exibir 4 cards de KPI: Pendentes, Aceitas, Potencial Mensal e Taxa de Conversão
- **FR-002**: Sistema DEVE calcular "Pendentes" como contagem de cotações com status PENDING atribuídas ao vendedor
- **FR-003**: Sistema DEVE calcular "Aceitas" como contagem de cotações convertidas no período selecionado
- **FR-004**: Sistema DEVE calcular "Potencial Mensal" como soma das mensalidades das cotações aceitas
- **FR-005**: Sistema DEVE calcular "Conversão" como (Aceitas / Total) * 100
- **FR-006**: Sistema DEVE exibir alertas urgentes para cotações que expiram no dia atual
- **FR-007**: Sistema DEVE exibir alertas para leads sem contato há mais de 24 horas
- **FR-008**: Sistema DEVE exibir lista das 4 cotações mais recentes do vendedor
- **FR-009**: Sistema DEVE exibir para cada cotação: tipo de veículo, modelo/ano, valor FIPE, cliente, telefone, valor, tempo e status
- **FR-010**: Sistema DEVE fornecer ações rápidas: ligar, WhatsApp e ver detalhes para cada cotação
- **FR-010a**: Sistema DEVE solicitar confirmação manual ao vendedor após tentativa de contato para atualizar status para "Contatado"
- **FR-011**: Sistema DEVE exibir gráfico de distribuição de cotações por status (Pendentes, Contatadas, Aceitas, Expiradas, Canceladas - esta última apenas se houver dados)
- **FR-012**: Sistema DEVE exibir ranking dos 5 vendedores com mais cotações aceitas no mês (mesmo ranking visível para todos os perfis de usuário)
- **FR-013**: Sistema DEVE destacar a posição do vendedor atual no ranking
- **FR-014**: Sistema DEVE exibir progresso da meta mensal em formato circular
- **FR-014a**: Sistema DEVE exibir widget de meta com mensagem "Meta não definida" e botão para solicitar quando vendedor não possui meta configurada
- **FR-015**: Sistema DEVE exibir saudação personalizada baseada no horário (Bom dia/Boa tarde/Boa noite)
- **FR-016**: Sistema DEVE permitir filtrar dados por período: Hoje, Esta semana, Este mês
- **FR-017**: Sistema DEVE exibir sidebar de navegação com itens: Dashboard, Cotações, Clientes, Vendedores, Configurações
- **FR-018**: Sistema DEVE ocultar sidebar em telas menores que 1024px e exibir botão de menu
- **FR-019**: Sistema DEVE usar cores padronizadas por status: Pendente (amarelo), Contatado (azul), Aceita (verde), Expirada (cinza), Cancelada (vermelho), Urgente (laranja)
- **FR-020**: Sistema DEVE exibir ícones diferentes por tipo de veículo: carro, moto, SUV/utilitário
- **FR-021**: Sistema DEVE atualizar automaticamente os dados do dashboard via polling a cada 60 segundos

### Key Entities

- **Cotação**: Representa uma solicitação de proteção veicular com dados do veículo, cliente e valor calculado. Possui status (pendente, contatado, aceita, expirada, cancelada) e data de expiração.
- **Vendedor**: Usuário do sistema que gerencia cotações. Possui meta mensal e pertence ao ranking.
- **Cliente**: Pessoa que solicitou a cotação. Possui nome e telefone de contato.
- **Meta**: Objetivo mensal de cotações aceitas definido para cada vendedor.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Vendedores conseguem identificar cotações urgentes em menos de 5 segundos após acessar o dashboard
- **SC-002**: Vendedores conseguem iniciar contato com cliente (ligar ou WhatsApp) em menos de 3 cliques a partir do dashboard
- **SC-003**: Dashboard carrega completamente (todos os widgets visíveis) em menos de 3 segundos
- **SC-004**: 90% dos vendedores conseguem entender seu desempenho atual sem ajuda na primeira utilização
- **SC-005**: Redução de 30% no tempo médio para identificar leads que precisam de atenção urgente
- **SC-006**: Dashboard é utilizável em dispositivos móveis (320px-767px), tablets (768px-1023px) e desktop (1024px+)
- **SC-007**: Todos os elementos interativos são acessíveis via teclado
- **SC-008**: Taxa de conversão de cotações aumenta em 15% após implementação do dashboard (baseline a ser medido)

## Assumptions

- O sistema já possui autenticação funcional via Better Auth
- Existe um schema de cotações no banco de dados com os campos necessários (veículo, cliente, valor, status, data)
- O sistema utiliza o tema new-york do shadcn/ui
- Dados são carregados via Server Components quando possível, com Client Components apenas para interatividade
- O período padrão de expiração de cotações é de 7 dias
- Metas mensais são definidas administrativamente e armazenadas no banco de dados
