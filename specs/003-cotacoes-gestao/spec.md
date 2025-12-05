# Feature Specification: Telas de Gestao de Cotacoes

**Feature Branch**: `003-cotacoes-gestao`
**Created**: 2025-11-26
**Status**: Draft
**Input**: Atualizar telas de gestao de cotacoes no painel administrativo conforme especificacoes de lista e detalhes de cotacao.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visualizar Lista de Cotacoes (Priority: P1)

Como vendedor ou gestor, preciso visualizar todas as cotacoes do sistema em uma lista organizada para acompanhar o status de cada negociacao e priorizar meu trabalho.

**Why this priority**: A lista de cotacoes e o ponto de entrada principal para a gestao comercial. Sem ela, vendedores nao conseguem identificar quais clientes precisam de contato ou acompanhar o funil de vendas.

**Independent Test**: Pode ser testado navegando para a pagina de cotacoes e verificando que cotacoes existentes sao exibidas com seus dados principais (cliente, veiculo, valor, status).

**Acceptance Scenarios**:

1. **Given** existem cotacoes no sistema, **When** o usuario acessa a pagina de cotacoes, **Then** deve ver uma lista com: veiculo (marca/modelo/placa), cliente (nome/telefone), valor da mensalidade, status e tempo desde criacao.
2. **Given** a lista de cotacoes esta exibida, **When** o usuario clica em uma cotacao, **Then** deve ser redirecionado para a pagina de detalhes daquela cotacao.
3. **Given** nao existem cotacoes no sistema, **When** o usuario acessa a pagina de cotacoes, **Then** deve ver uma mensagem de estado vazio com opcao de criar nova cotacao.

---

### User Story 2 - Filtrar Cotacoes por Status (Priority: P1)

Como vendedor, preciso filtrar cotacoes por status (Pendente, Contatado, Aceita, Expirada) para focar nas cotacoes que precisam de acao imediata.

**Why this priority**: Filtrar por status e essencial para produtividade. Vendedores precisam ver rapidamente quais cotacoes estao pendentes de contato.

**Independent Test**: Pode ser testado aplicando filtro de status "Pendente" e verificando que apenas cotacoes com este status sao exibidas.

**Acceptance Scenarios**:

1. **Given** a lista de cotacoes esta exibida, **When** o usuario clica na tab "Pendentes", **Then** deve ver apenas cotacoes com status "Pendente" e o contador deve refletir a quantidade.
2. **Given** a lista de cotacoes esta exibida, **When** o usuario clica na tab "Todas", **Then** deve ver todas as cotacoes independente do status.
3. **Given** a lista esta filtrada por status, **When** o usuario clica em outro status, **Then** o filtro deve mudar e a lista atualizar imediatamente.

---

### User Story 3 - Buscar Cotacoes (Priority: P1)

Como vendedor, preciso buscar cotacoes por nome do cliente, placa do veiculo, telefone ou CPF para encontrar rapidamente uma cotacao especifica.

**Why this priority**: Quando um cliente liga, o vendedor precisa localizar a cotacao em segundos para dar atendimento agil.

**Independent Test**: Pode ser testado digitando uma placa de veiculo no campo de busca e verificando que a cotacao correspondente aparece.

**Acceptance Scenarios**:

1. **Given** a lista de cotacoes esta exibida, **When** o usuario digita uma placa no campo de busca, **Then** deve ver apenas cotacoes cujo veiculo possui aquela placa (busca com debounce de 300ms).
2. **Given** a lista de cotacoes esta exibida, **When** o usuario digita um nome de cliente, **Then** deve ver cotacoes cujo cliente possui aquele nome.
3. **Given** a busca nao encontra resultados, **When** o usuario digita um termo inexistente, **Then** deve ver mensagem "Nenhuma cotacao encontrada" com opcao de limpar busca.

---

### User Story 4 - Visualizar Detalhes da Cotacao (Priority: P1)

Como vendedor, preciso visualizar todos os detalhes de uma cotacao especifica para ter informacoes completas antes de contatar o cliente.

**Why this priority**: Informacoes completas sao essenciais para um atendimento de qualidade e para responder duvidas do cliente.

**Independent Test**: Pode ser testado acessando uma cotacao e verificando que todos os dados (cliente, veiculo, valores, status) sao exibidos corretamente.

**Acceptance Scenarios**:

1. **Given** uma cotacao existe no sistema, **When** o usuario acessa a pagina de detalhes, **Then** deve ver: dados do cliente (nome, CPF, telefone, email, endereco), dados do veiculo (marca, modelo, placa, ano, cor, valor FIPE, categoria), valores (mensalidade, adesao, adesao com desconto, cota de participacao) e validade.
2. **Given** a pagina de detalhes esta exibida, **When** o usuario clica em "Voltar para cotacoes", **Then** deve retornar a lista de cotacoes mantendo os filtros aplicados.
3. **Given** a cotacao possui vendedor atribuido, **When** o usuario visualiza os detalhes, **Then** deve ver informacoes do vendedor responsavel (nome, email, telefone, data de atribuicao).

---

### User Story 5 - Contatar Cliente Diretamente (Priority: P2)

Como vendedor, preciso de atalhos para contatar o cliente via telefone, WhatsApp ou email diretamente da interface para agilizar o processo de vendas.

**Why this priority**: Reduz friccao no processo de vendas. Sem atalhos, o vendedor precisa copiar manualmente os dados de contato.

**Independent Test**: Pode ser testado clicando no botao WhatsApp e verificando que abre o aplicativo/web com o numero do cliente.

**Acceptance Scenarios**:

1. **Given** a pagina de detalhes esta exibida, **When** o usuario clica no botao "WhatsApp", **Then** deve abrir o WhatsApp Web/App com o numero do cliente pre-preenchido.
2. **Given** a pagina de detalhes esta exibida, **When** o usuario clica no botao "Ligar", **Then** deve abrir o discador do dispositivo com o numero do cliente.
3. **Given** a lista de cotacoes esta exibida, **When** o usuario clica no icone de WhatsApp de uma cotacao, **Then** deve abrir o WhatsApp com o numero daquele cliente.

---

### User Story 6 - Alterar Status da Cotacao (Priority: P2)

Como vendedor, preciso alterar o status de uma cotacao (Pendente -> Contatado -> Aceita/Cancelada) para registrar o progresso da negociacao.

**Why this priority**: Manter status atualizado e essencial para gestao do funil de vendas e relatorios gerenciais.

**Independent Test**: Pode ser testado alterando o status de uma cotacao de "Pendente" para "Contatado" e verificando que a mudanca persiste.

**Acceptance Scenarios**:

1. **Given** a pagina de detalhes esta exibida, **When** o usuario seleciona um novo status e clica em "Salvar alteracoes", **Then** o status deve ser atualizado e um registro adicionado ao historico.
2. **Given** o usuario tenta alterar status para "Aceita", **When** clica em salvar, **Then** deve ser obrigatorio informar uma observacao explicativa.
3. **Given** a cotacao esta expirada (mais de 7 dias), **When** o usuario tenta alterar o status, **Then** deve ver mensagem informando que cotacoes expiradas nao podem ter status alterado.

---

### User Story 7 - Adicionar Notas/Observacoes (Priority: P2)

Como vendedor, preciso registrar notas sobre interacoes com o cliente (ligacao, mensagem, observacoes) para manter historico e facilitar continuidade por outro vendedor.

**Why this priority**: O historico de interacoes evita retrabalho e permite que qualquer vendedor de continuidade ao atendimento.

**Independent Test**: Pode ser testado adicionando uma nota e verificando que ela aparece no historico de atividades com data, hora e autor.

**Acceptance Scenarios**:

1. **Given** a pagina de detalhes esta exibida, **When** o usuario clica em "Adicionar nota" e preenche o formulario, **Then** a nota deve ser salva e exibida na timeline de historico.
2. **Given** o formulario de nota esta aberto, **When** o usuario seleciona o tipo (Ligacao/WhatsApp/Email/Observacao) e adiciona descricao, **Then** a nota deve ser categorizada corretamente no historico.
3. **Given** o historico possui multiplas notas, **When** o usuario visualiza o historico, **Then** deve ver as notas ordenadas da mais recente para a mais antiga.

---

### User Story 8 - Filtrar Cotacoes por Periodo e Categoria (Priority: P3)

Como gestor, preciso filtrar cotacoes por periodo de criacao e categoria de veiculo para analise e relatorios.

**Why this priority**: Filtros avancados sao importantes para analise gerencial mas nao bloqueiam o trabalho operacional basico.

**Independent Test**: Pode ser testado aplicando filtro de "Ultimos 7 dias" e categoria "Moto" e verificando que apenas cotacoes correspondentes sao exibidas.

**Acceptance Scenarios**:

1. **Given** a lista de cotacoes esta exibida, **When** o usuario seleciona periodo "Ultimos 7 dias", **Then** deve ver apenas cotacoes criadas nos ultimos 7 dias.
2. **Given** a lista de cotacoes esta exibida, **When** o usuario seleciona categoria "Moto", **Then** deve ver apenas cotacoes de motocicletas.
3. **Given** multiplos filtros estao aplicados, **When** o usuario clica em "Limpar filtros", **Then** todos os filtros devem ser removidos e a lista mostrar todas as cotacoes.

---

### User Story 9 - Copiar Dados do Cliente (Priority: P3)

Como vendedor, preciso copiar facilmente telefone, email ou endereco do cliente para colar em outros sistemas ou comunicacoes.

**Why this priority**: Funcionalidade de conveniencia que melhora a experiencia mas nao e critica para o fluxo principal.

**Independent Test**: Pode ser testado clicando no botao "Copiar" ao lado do telefone e verificando que o valor foi copiado para a area de transferencia.

**Acceptance Scenarios**:

1. **Given** a pagina de detalhes esta exibida, **When** o usuario clica em "Copiar" ao lado do telefone, **Then** o numero deve ser copiado e uma notificacao de confirmacao exibida.
2. **Given** a pagina de detalhes esta exibida, **When** o usuario clica em "Copiar endereco", **Then** o endereco completo deve ser copiado para a area de transferencia.

---

### User Story 10 - Ver Localizacao no Mapa (Priority: P3)

Como vendedor, preciso visualizar o endereco do cliente no Google Maps para entender a regiao de atuacao.

**Why this priority**: Funcionalidade complementar que agrega valor mas nao e essencial para a gestao de cotacoes.

**Independent Test**: Pode ser testado clicando em "Ver no mapa" e verificando que o Google Maps abre com o endereco correto.

**Acceptance Scenarios**:

1. **Given** a pagina de detalhes esta exibida, **When** o usuario clica em "Ver no Google Maps", **Then** deve abrir o Google Maps em nova aba com o endereco do cliente.

---

### Edge Cases

- O que acontece quando uma cotacao expira enquanto o usuario esta visualizando os detalhes? Sistema deve atualizar o status visualmente e desabilitar acoes de mudanca de status.
- Como o sistema lida com cotacoes sem vendedor atribuido? Deve exibir "Nao atribuido" no campo de vendedor responsavel.
- O que acontece se a busca retorna mais de 1000 resultados? Sistema deve paginar resultados e limitar a exibicao inicial.
- Como o sistema lida com campos de contato invalidos (telefone incorreto)? Deve exibir o dado mesmo assim, permitindo que o vendedor identifique e corrija.
- O que acontece ao tentar acessar uma cotacao que foi excluida? Sistema deve exibir mensagem "Cotacao nao encontrada" e redirecionar para a lista.

## Requirements *(mandatory)*

### Functional Requirements

#### Lista de Cotacoes

- **FR-001**: Sistema DEVE exibir lista de cotacoes com colunas: veiculo (marca/modelo/placa/categoria), cliente (nome/telefone/cidade), valor da mensalidade, status e tempo desde criacao.
- **FR-002**: Sistema DEVE permitir filtrar cotacoes por status atraves de tabs: Todas, Pendentes, Contatadas, Aceitas, Expiradas.
- **FR-003**: Sistema DEVE exibir contador de cotacoes em cada tab de status.
- **FR-004**: Sistema DEVE permitir busca em tempo real (debounce 300ms) por: nome do cliente, placa do veiculo, telefone, CPF, email, marca e modelo.
- **FR-005**: Sistema DEVE permitir filtrar cotacoes por categoria de veiculo (Normal, Especial, Utilitario, Moto).
- **FR-006**: Sistema DEVE permitir filtrar cotacoes por periodo (Hoje, Ultimos 7 dias, Ultimos 30 dias, Personalizado).
- **FR-007**: Sistema DEVE permitir filtrar cotacoes por vendedor atribuido (apenas para administradores).
- **FR-008**: Sistema DEVE permitir filtrar cotacoes por faixa de valor FIPE (minimo e maximo).
- **FR-009**: Sistema DEVE permitir ordenar lista por: data de criacao, valor da mensalidade, valor FIPE, nome do cliente e status.
- **FR-010**: Sistema DEVE paginar resultados com opcoes de 10, 25 ou 50 itens por pagina.
- **FR-011**: Sistema DEVE exibir estado vazio com mensagem e acao quando nao houver cotacoes.
- **FR-012**: Sistema DEVE destacar visualmente cotacoes que expiram hoje (borda vermelha) e cotacoes criadas nas ultimas 2h (badge "Novo").
- **FR-013**: Sistema DEVE permitir selecionar multiplas cotacoes para acoes em lote.
- **FR-014**: Sistema DEVE permitir acoes em lote: marcar como contatadas, reenviar WhatsApp, excluir.
- **FR-014a**: Sistema DEVE restringir visibilidade de cotacoes por perfil: vendedores veem apenas cotacoes atribuidas a eles; administradores veem todas as cotacoes.

#### Detalhes da Cotacao

- **FR-015**: Sistema DEVE exibir dados completos do cliente: nome, CPF, telefone, email, endereco completo (rua, numero, complemento, bairro, cidade, estado, CEP).
- **FR-016**: Sistema DEVE exibir dados completos do veiculo: marca, modelo, placa, ano, cor, combustivel, codigo FIPE, valor FIPE, categoria e tipo de uso.
- **FR-017**: Sistema DEVE exibir valores da cotacao: mensalidade, adesao (valor cheio e com desconto de 20%), cota de participacao.
- **FR-018**: Sistema DEVE exibir validade da cotacao (7 dias) com barra de progresso visual e dias restantes.
- **FR-019**: Sistema DEVE exibir informacoes do vendedor responsavel: nome, email, telefone e data de atribuicao.
- **FR-020**: Sistema DEVE permitir alteracao de status com opcoes: Pendente, Contatado, Aceita, Cancelada.
- **FR-021**: Sistema DEVE exigir observacao obrigatoria ao alterar status para "Aceita" ou "Cancelada".
- **FR-022**: Sistema DEVE exibir historico de atividades em formato de timeline ordenado cronologicamente (mais recente primeiro).
- **FR-023**: Sistema DEVE permitir adicionar notas com tipo (Ligacao, WhatsApp, Email, Observacao) e descricao.
- **FR-024**: Sistema DEVE registrar automaticamente no historico: criacao da cotacao, envio de WhatsApp, atribuicao de vendedor e mudancas de status.
- **FR-025**: Sistema DEVE fornecer botoes de acao rapida: Ligar, WhatsApp, Email, Reenviar cotacao.
- **FR-026**: Sistema DEVE fornecer botoes de copiar para: telefone, email e endereco completo.
- **FR-027**: Sistema DEVE fornecer link para visualizar endereco no Google Maps.
- **FR-028**: Sistema DEVE impedir alteracao de status em cotacoes expiradas.
- **FR-029**: Sistema DEVE permitir que apenas administradores reatribuam cotacoes para outro vendedor.
- **FR-030**: Sistema DEVE permitir exclusao de cotacoes apenas por administradores (soft delete).

#### Responsividade

- **FR-031**: Sistema DEVE ser responsivo e funcional em dispositivos moveis.
- **FR-032**: Em mobile, lista DEVE exibir cotacoes em formato de cards empilhados.
- **FR-033**: Em mobile, detalhes DEVE exibir informacoes em secoes colapsiveis.

### Key Entities

- **Quotation (Cotacao)**: Representa uma proposta de protecao veicular. Contem referencia ao cliente, veiculo, valores calculados (mensalidade, adesao, cota), status (Pendente, Contatado, Aceita, Expirada, Cancelada), vendedor atribuido, datas de criacao e expiracao.
- **Customer (Cliente)**: Pessoa fisica interessada em protecao veicular. Contem dados pessoais (nome, CPF, telefone, email) e endereco completo.
- **Vehicle (Veiculo)**: Veiculo objeto da cotacao. Contem placa, marca, modelo, ano, cor, combustivel, codigo FIPE, valor FIPE, categoria (Normal, Especial, Utilitario, Moto) e tipo de uso (Particular, Comercial).
- **QuotationActivity (Atividade da Cotacao)**: Registro de interacao, mudanca de status ou observacao sobre uma cotacao. Armazenado em tabela dedicada `quotation_activities`. Contem tipo de atividade (criacao, status_change, whatsapp_sent, note, call, email), descricao, autor e data.
- **Seller (Vendedor)**: Usuario do sistema responsavel por contatar clientes. Contem nome, email, telefone e indicador de ativo/inativo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Vendedor consegue localizar uma cotacao especifica por placa ou telefone em menos de 5 segundos.
- **SC-002**: Vendedor consegue identificar cotacoes pendentes de contato em menos de 3 segundos apos acessar a pagina.
- **SC-003**: Vendedor consegue contatar cliente via WhatsApp em no maximo 2 cliques a partir da lista de cotacoes.
- **SC-004**: Vendedor consegue registrar resultado de contato (mudanca de status + nota) em menos de 30 segundos.
- **SC-005**: Sistema exibe lista de 50 cotacoes em menos de 2 segundos.
- **SC-006**: Sistema aplica filtros e busca sem necessidade de recarregar a pagina completamente.
- **SC-007**: 95% das interacoes do vendedor com cotacoes podem ser realizadas sem scroll excessivo em desktop.
- **SC-008**: Interface mobile permite todas as operacoes essenciais (visualizar, contatar, alterar status) de forma funcional.

## Clarifications

### Session 2025-11-26

- Q: Como armazenar o historico de atividades da cotacao? → A: Nova tabela `quotation_activities` com colunas tipadas (id, quotation_id, type, description, author_id, created_at)
- Q: Qual a visibilidade de cotacoes por perfil de usuario? → A: Vendedores veem apenas cotacoes atribuidas a eles; administradores/gestores veem todas

## Assumptions

- O sistema ja possui tabelas de cotacoes, clientes, veiculos e vendedores no banco de dados conforme especificacao tecnica existente.
- O sistema de autenticacao e autorizacao (Better Auth) ja esta configurado para distinguir vendedores de administradores.
- A integracao com WhatsApp sera feita via links diretos (https://wa.me/) e nao requer integracao com API do WhatsApp.
- A funcionalidade de reenvio de cotacao por WhatsApp chamara a mesma logica ja existente no fluxo de criacao de cotacao.
- O historico de atividades sera armazenado em uma nova tabela dedicada `quotation_activities` com colunas tipadas para permitir queries eficientes e relatorios.
- Cotacoes sao atribuidas automaticamente via round-robin no momento da criacao, nao havendo atribuicao manual na tela de lista.
