# Feature Specification: Gestao de Clientes

**Feature Branch**: `006-gestao-clientes`
**Created**: 2025-11-27
**Status**: Draft
**Input**: User description: "Tela de Lista de Clientes para gerenciamento da base de clientes com visualizacao de historico de cotacoes, registro de interacoes e relacionamento com clientes"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visualizar Lista de Clientes (Priority: P1)

Como vendedor, desejo visualizar todos os meus clientes cadastrados em uma lista organizada para que eu possa rapidamente encontrar e acessar informacoes de qualquer cliente.

**Why this priority**: E a funcionalidade principal da tela - sem ela, nenhuma outra funcionalidade faz sentido. Permite ao vendedor ter visibilidade de toda sua base de clientes.

**Independent Test**: Pode ser testado acessando a pagina de clientes e verificando que a lista de clientes e exibida com nome, CPF, contato, numero de cotacoes e status.

**Acceptance Scenarios**:

1. **Given** usuario logado como vendedor, **When** acessa a pagina de clientes, **Then** visualiza lista de clientes com colunas: cliente (nome, CPF, cidade), contato (telefone, email), cotacoes (quantidade e aceitas), status e acoes
2. **Given** lista de clientes carregada, **When** vendedor visualiza a tabela, **Then** cada linha mostra informacoes resumidas do cliente com indicador visual de status (verde=cliente, amarelo=negociacao, cinza=inativo, vermelho=perdido)
3. **Given** lista com mais de 10 clientes, **When** vendedor navega, **Then** sistema exibe paginacao com 10 clientes por pagina

---

### User Story 2 - Ver Cards de KPIs da Base de Clientes (Priority: P1)

Como vendedor, desejo ver um resumo estatistico da minha base de clientes para ter uma visao geral do desempenho e identificar oportunidades.

**Why this priority**: Junto com a lista, os KPIs fornecem contexto essencial para tomada de decisao e priorizacao de acoes.

**Independent Test**: Pode ser testado verificando que os 4 cards de KPIs sao exibidos com valores corretos baseados nos dados dos clientes.

**Acceptance Scenarios**:

1. **Given** usuario na pagina de clientes, **When** pagina carrega, **Then** exibe 4 cards: Total de clientes, Convertidos (% e quantidade), Em Negociacao (quantidade), Inativos (quantidade)
2. **Given** cliente com cotacao aceita, **When** KPIs calculados, **Then** cliente contabilizado em "Convertidos"
3. **Given** cliente com cotacao pendente/contatada, **When** KPIs calculados, **Then** cliente contabilizado em "Em Negociacao"
4. **Given** cliente sem cotacao nos ultimos 30 dias, **When** KPIs calculados, **Then** cliente contabilizado em "Inativos"

---

### User Story 3 - Buscar e Filtrar Clientes (Priority: P1)

Como vendedor, desejo buscar clientes por diversos criterios e aplicar filtros para encontrar rapidamente clientes especificos.

**Why this priority**: Com bases grandes de clientes, busca e filtros sao essenciais para produtividade do vendedor.

**Independent Test**: Pode ser testado digitando termo de busca e verificando que lista e filtrada corretamente; tambem aplicando filtros de status/cidade/periodo/vendedor.

**Acceptance Scenarios**:

1. **Given** lista de clientes, **When** vendedor digita termo na busca, **Then** lista filtra em tempo real por nome, CPF, telefone, email, placa ou cidade
2. **Given** lista de clientes, **When** vendedor seleciona filtro de status, **Then** lista mostra apenas clientes com status selecionado (Todos, Convertidos, Em negociacao, Inativos, Perdidos)
3. **Given** lista de clientes, **When** vendedor seleciona filtro de cidade, **Then** lista mostra apenas clientes da cidade selecionada
4. **Given** lista de clientes, **When** vendedor seleciona filtro de periodo, **Then** lista mostra clientes cadastrados no periodo (Hoje, 7 dias, 30 dias, 90 dias, Este ano, Personalizado)
5. **Given** filtros aplicados, **When** vendedor clica em "Limpar tudo", **Then** todos os filtros sao removidos e lista completa e exibida
6. **Given** filtros aplicados, **When** lista exibida, **Then** chips dos filtros ativos sao mostrados abaixo da barra de filtros com opcao de remover individualmente

---

### User Story 4 - Ver Perfil Completo do Cliente (Priority: P2)

Como vendedor, desejo ver o perfil completo de um cliente em um modal para acessar todas as informacoes sem sair da lista.

**Why this priority**: Permite acesso rapido a informacoes detalhadas necessarias para atendimento e follow-up.

**Independent Test**: Pode ser testado clicando em "Ver perfil" de um cliente e verificando que modal abre com todas as secoes de informacao.

**Acceptance Scenarios**:

1. **Given** lista de clientes, **When** vendedor clica em "Ver perfil", **Then** abre modal com dados completos: info pessoal, contato, endereco, cotacoes, veiculos, historico de interacoes e vendedor responsavel
2. **Given** modal de perfil aberto, **When** vendedor visualiza secao de contato, **Then** pode copiar telefone/email, iniciar ligacao, WhatsApp ou email diretamente
3. **Given** modal de perfil aberto, **When** vendedor visualiza secao de endereco, **Then** pode copiar endereco ou abrir no mapa
4. **Given** modal de perfil aberto, **When** vendedor visualiza cotacoes, **Then** ve lista resumida com status de cada cotacao e link para ver todas
5. **Given** modal de perfil aberto, **When** vendedor visualiza veiculos cotados, **Then** ve cards dos veiculos com status de protecao
6. **Given** modal de perfil aberto, **When** vendedor visualiza historico, **Then** ve timeline de todas as interacoes em ordem cronologica decrescente

---

### User Story 5 - Ver Historico de Cotacoes do Cliente (Priority: P2)

Como vendedor, desejo ver todas as cotacoes de um cliente especifico para entender seu historico e identificar oportunidades.

**Why this priority**: Historico de cotacoes e fundamental para personalizacao do atendimento e identificacao de oportunidades de reativacao.

**Independent Test**: Pode ser testado clicando em "Ver cotacoes" de um cliente e verificando que modal exibe todas as cotacoes com detalhes.

**Acceptance Scenarios**:

1. **Given** lista de clientes, **When** vendedor clica em "Ver cotacoes", **Then** abre modal com lista de todas cotacoes do cliente
2. **Given** modal de cotacoes aberto, **When** visualiza resumo, **Then** ve total de cotacoes, quantidade de aceitas e valor mensal ativo
3. **Given** cotacao aceita no historico, **When** visualiza card da cotacao, **Then** ve badge verde "Aceita" com detalhes do veiculo, valores e datas
4. **Given** cotacao pendente no historico, **When** visualiza card da cotacao, **Then** ve badge amarelo "Pendente" com alerta se expirando em breve e acoes de contato
5. **Given** cotacao expirada no historico, **When** visualiza card da cotacao, **Then** ve badge vermelho "Expirada" com opcao de "Recotar veiculo"
6. **Given** modal de cotacoes aberto, **When** vendedor clica em "Nova cotacao para cliente", **Then** inicia fluxo de nova cotacao pre-preenchendo dados do cliente

---

### User Story 6 - Registrar Interacao com Cliente (Priority: P2)

Como vendedor, desejo registrar interacoes realizadas com clientes para manter historico de relacionamento e acompanhar negociacoes.

**Why this priority**: Registro de interacoes e essencial para continuidade do atendimento e gestao de relacionamento.

**Independent Test**: Pode ser testado clicando em "Adicionar nota" e preenchendo formulario de interacao, verificando que aparece no historico.

**Acceptance Scenarios**:

1. **Given** perfil do cliente ou lista, **When** vendedor clica em "Adicionar nota", **Then** abre modal para registrar interacao
2. **Given** modal de interacao, **When** vendedor preenche formulario, **Then** deve selecionar tipo (ligacao enviada/recebida, WhatsApp enviado/recebido, email enviado/recebido, reuniao/visita, observacao geral)
3. **Given** modal de interacao, **When** vendedor preenche formulario, **Then** deve selecionar resultado (positivo, neutro, negativo, sem contato)
4. **Given** modal de interacao, **When** vendedor preenche formulario, **Then** deve informar descricao obrigatoria
5. **Given** modal de interacao, **When** vendedor marca opcao de agendar, **Then** pode definir data e hora do proximo contato
6. **Given** interacao salva, **When** visualiza historico do cliente, **Then** nova interacao aparece no topo da timeline

---

### User Story 7 - Executar Acoes Rapidas no Cliente (Priority: P2)

Como vendedor, desejo executar acoes rapidas como ligar, enviar WhatsApp ou email diretamente da lista de clientes.

**Why this priority**: Acoes rapidas aumentam significativamente a produtividade do vendedor no dia a dia.

**Independent Test**: Pode ser testado clicando nos botoes de acao rapida e verificando que aplicativos externos sao abertos corretamente.

**Acceptance Scenarios**:

1. **Given** linha de cliente na tabela, **When** vendedor clica em "Ligar", **Then** sistema abre discador do dispositivo com numero do cliente
2. **Given** linha de cliente na tabela, **When** vendedor clica em "WhatsApp", **Then** sistema abre WhatsApp Web/App com conversa do cliente
3. **Given** linha de cliente na tabela, **When** vendedor clica em "Email", **Then** sistema abre cliente de email com destinatario preenchido
4. **Given** linha de cliente na tabela, **When** vendedor clica em "Copiar" (telefone ou email), **Then** sistema copia para area de transferencia e exibe feedback

---

### User Story 8 - Filtrar por Vendedor (Admin) (Priority: P3)

Como administrador, desejo filtrar clientes por vendedor para acompanhar a base de cada membro da equipe.

**Why this priority**: Funcionalidade de gestao que permite visao gerencial da base de clientes por vendedor.

**Independent Test**: Pode ser testado como admin selecionando filtro de vendedor e verificando que lista mostra apenas clientes do vendedor selecionado.

**Acceptance Scenarios**:

1. **Given** usuario admin na pagina de clientes, **When** visualiza filtros, **Then** ve filtro adicional de "Vendedor"
2. **Given** usuario admin com filtro de vendedor, **When** seleciona vendedor especifico, **Then** lista mostra apenas clientes atribuidos a esse vendedor
3. **Given** usuario vendedor (nao admin), **When** visualiza filtros, **Then** NAO ve filtro de vendedor (ve apenas seus proprios clientes)

---

### User Story 9 - Exportar Lista de Clientes (Priority: P3)

Como vendedor, desejo exportar minha lista de clientes em CSV para analise externa ou backup.

**Why this priority**: Funcionalidade de utilidade que permite analises externas e integracao com outras ferramentas.

**Independent Test**: Pode ser testado clicando em "Exportar CSV" e verificando que arquivo e baixado com dados corretos.

**Acceptance Scenarios**:

1. **Given** lista de clientes, **When** vendedor clica em "Exportar CSV", **Then** sistema gera e baixa arquivo CSV com dados da lista atual (respeitando filtros aplicados)
2. **Given** exportacao iniciada, **When** arquivo gerado, **Then** contem colunas: nome, CPF, telefone, email, cidade, status, quantidade de cotacoes, valor mensal, ultimo contato

---

### User Story 10 - Ordenar Lista de Clientes (Priority: P3)

Como vendedor, desejo ordenar a lista de clientes por diferentes criterios para facilitar a analise e priorizacao.

**Why this priority**: Ordenacao complementa busca e filtros para melhor navegacao na lista.

**Independent Test**: Pode ser testado clicando nos cabecalhos das colunas e verificando que lista e reordenada corretamente.

**Acceptance Scenarios**:

1. **Given** lista de clientes, **When** vendedor clica em cabecalho de coluna, **Then** lista e ordenada pelo criterio (Nome A-Z, Nome Z-A, Mais recente, Mais antigo)
2. **Given** lista ordenada, **When** vendedor clica novamente no mesmo cabecalho, **Then** ordem e invertida (asc/desc)
3. **Given** lista de clientes, **When** vendedor ordena por "Mais cotacoes", **Then** clientes com mais cotacoes aparecem primeiro
4. **Given** lista de clientes, **When** vendedor ordena por "Ultimo contato", **Then** clientes com interacoes mais recentes aparecem primeiro
5. **Given** lista de clientes, **When** vendedor ordena por "Valor mensal", **Then** clientes com maior valor de cotacoes aceitas aparecem primeiro

---

### Edge Cases

- O que acontece quando a busca nao encontra nenhum cliente? Exibe estado vazio com mensagem "Nenhum cliente encontrado" e botao para limpar filtros
- O que acontece quando vendedor nao tem nenhum cliente cadastrado? Exibe estado vazio com mensagem explicativa
- O que acontece quando cliente tem cotacoes mas nenhuma aceita? Status "Em negociacao" se cotacao pendente, "Perdido" se todas expiradas/canceladas
- O que acontece quando admin tenta excluir cliente com cotacoes aceitas ativas? Sistema deve alertar sobre cotacoes ativas antes de confirmar exclusao
- O que acontece com clientes quando vendedor e desativado? Clientes devem ser reatribuidos a outro vendedor ou admin
- O que acontece quando dois vendedores tentam registrar interacao simultaneamente? Sistema deve aceitar ambas interacoes sem conflito

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sistema DEVE exibir lista paginada de clientes com 10 itens por pagina
- **FR-002**: Sistema DEVE mostrar para cada cliente: nome, CPF, cidade, telefone, email, quantidade de cotacoes, cotacoes aceitas e status
- **FR-003**: Sistema DEVE calcular e exibir KPIs: Total de clientes, Convertidos (%), Em Negociacao, Inativos (30+ dias sem cotacao)
- **FR-004**: Sistema DEVE permitir busca por nome, CPF, telefone, email, placa de veiculo ou cidade
- **FR-005**: Sistema DEVE permitir filtros por: Status, Cidade, Periodo de cadastro, Vendedor (apenas admin)
- **FR-006**: Sistema DEVE exibir indicador visual de status do cliente: verde (cliente), amarelo (negociacao), cinza (inativo), vermelho (perdido)
- **FR-007**: Sistema DEVE permitir visualizacao de perfil completo do cliente em modal
- **FR-008**: Sistema DEVE exibir historico de cotacoes do cliente com status e detalhes de cada cotacao
- **FR-009**: Sistema DEVE permitir registro de interacoes com cliente (tipo, resultado, descricao, agendamento)
- **FR-010**: Sistema DEVE manter timeline imutavel de historico de interacoes
- **FR-011**: Sistema DEVE permitir acoes rapidas: ligar, WhatsApp, email, copiar dados
- **FR-012**: Sistema DEVE restringir vendedor a visualizar apenas seus proprios clientes
- **FR-013**: Sistema DEVE permitir admin visualizar clientes de todos os vendedores
- **FR-014**: Sistema DEVE permitir ordenacao por: Nome, Data de cadastro, Quantidade de cotacoes, Ultimo contato, Valor mensal
- **FR-015**: Sistema DEVE permitir exportacao da lista em formato CSV
- **FR-016**: Sistema DEVE implementar soft delete para exclusao de clientes (apenas admin)
- **FR-017**: Sistema DEVE exibir estado vazio apropriado quando nao houver clientes ou resultados de busca
- **FR-018**: Sistema DEVE ser responsivo, adaptando layout para dispositivos moveis (cards ao inves de tabela)

### Key Entities *(include if feature involves data)*

- **Cliente**: Pessoa fisica com dados pessoais (nome, CPF), contato (telefone, email), endereco e relacionamento com vendedor. Possui status calculado baseado em suas cotacoes.
- **Interacao**: Registro de contato com cliente contendo tipo (ligacao, WhatsApp, email, reuniao), resultado (positivo, neutro, negativo, sem contato), descricao e opcional agendamento de proximo contato. Imutavel apos criacao.
- **Cotacao**: Entidade existente que relaciona cliente a veiculo cotado com valores e status. Utilizada para calcular status do cliente e KPIs.
- **Vendedor**: Usuario do sistema responsavel por clientes. Cada cliente tem um vendedor atribuido.

## Assumptions

- Clientes ja foram cadastrados previamente atraves do fluxo de cotacao veicular existente (Feature 001)
- Sistema de cotacoes ja existe e esta funcional (Features 001 e 003)
- Sistema de vendedores ja existe e esta funcional (Feature 005)
- Vendedores sao usuarios com role "vendedor" e admins sao usuarios com role "admin"
- Telefone do cliente segue formato brasileiro com DDD
- Integracao com WhatsApp e via URL padrao (wa.me ou api.whatsapp.com)
- Integracao com discador e via protocolo tel:
- Integracao com email e via protocolo mailto:
- Periodo de inatividade para classificar cliente como "Inativo" e de 30 dias sem cotacao
- Exportacao CSV inclui apenas clientes visiveis (respeitando filtros aplicados)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Vendedores conseguem encontrar um cliente especifico em menos de 30 segundos usando busca ou filtros
- **SC-002**: Vendedores conseguem visualizar perfil completo de um cliente em ate 2 cliques a partir da lista
- **SC-003**: Vendedores conseguem registrar uma interacao com cliente em menos de 1 minuto
- **SC-004**: Sistema exibe lista de ate 100 clientes em menos de 3 segundos
- **SC-005**: Vendedores conseguem iniciar contato (ligacao, WhatsApp ou email) em 1 clique a partir da lista
- **SC-006**: KPIs da base de clientes sao atualizados em tempo real ao carregar a pagina
- **SC-007**: 95% dos vendedores conseguem completar busca e filtragem sem ajuda na primeira tentativa
- **SC-008**: Interface responsiva funciona adequadamente em dispositivos com largura minima de 320px
