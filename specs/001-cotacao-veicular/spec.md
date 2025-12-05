# Feature Specification: Sistema de Cotacao Veicular

**Feature Branch**: `001-cotacao-veicular`
**Created**: 2025-11-26
**Status**: Draft
**Input**: Sistema de cotacao online para protecao veicular com consulta de placa, calculo de mensalidade por categoria e integracao com WhatsApp

## Clarifications

### Session 2025-11-26

- Q: Como deve ser implementada a diferenciacao de perfis de usuario? → A: Dois perfis fixos: SELLER (ve proprias cotacoes) e ADMIN (acesso completo)
- Q: Formulario de cotacao requer autenticacao? → A: Publico, qualquer pessoa pode acessar e fazer cotacao sem login
- Q: Como tratar CPF duplicado em novas cotacoes? → A: Reutilizar cadastro existente pelo CPF e vincular nova cotacao
- Q: Estrategia de retry para APIs externas? → A: Retry simples, 1 tentativa adicional apos 2 segundos, depois erro
- Q: Salvar dados quando cotacao e recusada? → A: Sim, salvar como lead com status REJECTED para follow-up comercial

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cotacao de Veiculo por Placa (Priority: P1)

O cliente acessa a pagina de cotacao, informa a placa do veiculo, seleciona a categoria (veiculo leve ou utilitario) e o tipo de uso (particular ou comercial). O sistema consulta as APIs externas para obter os dados do veiculo e valor FIPE, verifica se o veiculo nao esta na blacklist e se o valor esta dentro dos limites, calcula a mensalidade com base na tabela de precos e exibe o resultado da cotacao.

**Why this priority**: Esta e a funcionalidade central do sistema. Sem ela, nao ha produto. O cliente precisa conseguir cotar seu veiculo de forma autonoma e instantanea.

**Independent Test**: Pode ser testado inserindo uma placa valida, selecionando categoria/uso e verificando se o sistema retorna corretamente os dados do veiculo e valores calculados.

**Acceptance Scenarios**:

1. **Given** um cliente na pagina de cotacao, **When** ele informa uma placa valida (ex: ABC-1234), seleciona "Veiculo Leve" e "Particular", **Then** o sistema exibe os dados do veiculo (marca, modelo, ano, cor, valor FIPE) e os valores calculados (mensalidade, adesao, adesao com desconto).

2. **Given** um cliente na pagina de cotacao, **When** ele informa uma placa valida de motocicleta, **Then** o sistema detecta automaticamente a categoria MOTO e exibe a cotacao correspondente.

3. **Given** um cliente na pagina de cotacao, **When** ele informa uma placa de veiculo na blacklist (ex: BMW, Audi), **Then** o sistema exibe mensagem informando que nao trabalha com aquele veiculo e que um vendedor entrara em contato.

4. **Given** um cliente na pagina de cotacao, **When** ele informa uma placa de veiculo com valor FIPE acima do limite da categoria, **Then** o sistema exibe mensagem informando que o valor esta acima do limite e que um vendedor entrara em contato.

5. **Given** um cliente na pagina de cotacao, **When** ele informa uma placa invalida ou nao encontrada, **Then** o sistema exibe mensagem de erro "Placa nao encontrada".

---

### User Story 2 - Coleta de Dados do Cliente e Finalizacao (Priority: P1)

Apos a validacao do veiculo, o cliente preenche seus dados pessoais (nome, CPF, email, WhatsApp) e endereco (CEP com busca automatica). Ao finalizar, a cotacao e salva no banco de dados, um vendedor e atribuido via round-robin e o cliente recebe a cotacao por WhatsApp.

**Why this priority**: Sem a coleta de dados e persistencia, a cotacao nao pode ser acompanhada pelos vendedores e o cliente nao recebe a confirmacao.

**Independent Test**: Pode ser testado preenchendo os dados do cliente apos uma consulta de veiculo bem-sucedida e verificando se a cotacao e salva e a notificacao e enviada.

**Acceptance Scenarios**:

1. **Given** um cliente que completou a etapa de consulta de veiculo com sucesso, **When** ele preenche todos os campos obrigatorios (nome, CPF valido, email valido, WhatsApp valido, endereco completo) e clica em "Gerar Cotacao", **Then** o sistema salva a cotacao, atribui um vendedor e exibe a tela de resultado.

2. **Given** um cliente na etapa de dados pessoais, **When** ele informa um CPF invalido, **Then** o sistema exibe mensagem de erro de validacao.

3. **Given** um cliente na etapa de dados pessoais, **When** ele informa um CEP valido e clica em buscar, **Then** o sistema preenche automaticamente rua, bairro, cidade e estado.

4. **Given** uma cotacao finalizada com sucesso, **When** o sistema processa a finalizacao, **Then** uma mensagem de WhatsApp e enviada ao cliente com os detalhes da cotacao.

---

### User Story 3 - Notificacao e Atribuicao de Vendedor (Priority: P2)

Quando uma cotacao e finalizada, o sistema atribui automaticamente um vendedor ativo seguindo o algoritmo round-robin e notifica o vendedor via WhatsApp/dashboard sobre o novo lead.

**Why this priority**: A atribuicao e notificacao de vendedores e essencial para o acompanhamento comercial, mas pode funcionar manualmente em um primeiro momento.

**Independent Test**: Pode ser testado finalizando multiplas cotacoes e verificando se os vendedores sao atribuidos de forma alternada e notificados.

**Acceptance Scenarios**:

1. **Given** uma cotacao finalizada e 3 vendedores ativos no sistema, **When** a primeira cotacao e criada, **Then** ela e atribuida ao primeiro vendedor da fila.

2. **Given** uma cotacao finalizada e 3 vendedores ativos no sistema, **When** a segunda cotacao e criada, **Then** ela e atribuida ao segundo vendedor da fila (round-robin).

3. **Given** uma cotacao atribuida a um vendedor, **When** a atribuicao e concluida, **Then** o vendedor recebe uma notificacao com os dados do cliente e da cotacao.

---

### User Story 4 - Painel Administrativo de Cotacoes (Priority: P2)

Vendedores e administradores acessam um painel para visualizar cotacoes atribuidas, filtrar por status, ver detalhes e atualizar o status (contatado, aceito, cancelado).

**Why this priority**: O painel e importante para gestao, mas cotacoes podem ser acompanhadas via notificacoes WhatsApp inicialmente.

**Independent Test**: Pode ser testado fazendo login como vendedor e verificando se as cotacoes atribuidas sao exibidas corretamente.

**Acceptance Scenarios**:

1. **Given** um vendedor autenticado no painel, **When** ele acessa a lista de cotacoes, **Then** ele ve apenas as cotacoes atribuidas a ele.

2. **Given** um vendedor visualizando uma cotacao, **When** ele clica em "Marcar como Contatado", **Then** o status da cotacao muda para CONTACTED e a data de contato e registrada.

3. **Given** uma cotacao pendente ha mais de 7 dias, **When** o sistema executa a verificacao de expiracao, **Then** o status e alterado automaticamente para EXPIRED.

---

### User Story 5 - Gestao de Tabela de Precos (Priority: P3)

Administradores podem visualizar e editar a tabela de precos por categoria (NORMAL, ESPECIAL, UTILITARIO, MOTO) com faixas de valor FIPE e mensalidades correspondentes.

**Why this priority**: A tabela de precos pode ser gerenciada diretamente no banco de dados inicialmente. Interface administrativa e uma melhoria de usabilidade.

**Independent Test**: Pode ser testado acessando o painel de configuracoes e editando uma faixa de preco, verificando se a alteracao e refletida nas novas cotacoes.

**Acceptance Scenarios**:

1. **Given** um administrador no painel de precos, **When** ele visualiza a tabela da categoria NORMAL, **Then** ele ve todas as faixas de valor FIPE com suas respectivas mensalidades.

2. **Given** um administrador editando uma faixa de preco, **When** ele altera a mensalidade e salva, **Then** a nova mensalidade e aplicada em cotacoes futuras.

---

### User Story 6 - Gestao de Blacklist (Priority: P3)

Administradores podem visualizar, adicionar e remover marcas/modelos da blacklist de veiculos nao aceitos.

**Why this priority**: A blacklist pode ser gerenciada diretamente no banco de dados inicialmente. Interface administrativa e uma melhoria de usabilidade.

**Independent Test**: Pode ser testado adicionando uma marca/modelo a blacklist e verificando se cotacoes para aquele veiculo sao recusadas.

**Acceptance Scenarios**:

1. **Given** um administrador no painel de blacklist, **When** ele adiciona a marca "Tesla" com motivo "Nao trabalhamos com veiculos eletricos", **Then** cotacoes futuras para veiculos Tesla sao recusadas.

2. **Given** um administrador visualizando a blacklist, **When** ele remove um modelo especifico, **Then** cotacoes para aquele modelo passam a ser aceitas.

---

### Edge Cases

- O que acontece quando a API PowerCRM esta indisponivel? Sistema faz 1 retry apos 2 segundos; se falhar novamente, exibe mensagem de erro amigavel e registra o erro para analise.
- O que acontece quando nenhum vendedor esta ativo no sistema? Sistema deve salvar a cotacao sem atribuicao e alertar administrador.
- Como o sistema lida com placas no formato antigo (ABC-1234) e Mercosul (ABC1D23)? Ambos os formatos devem ser aceitos e normalizados.
- O que acontece se o cliente tentar cotar o mesmo veiculo novamente? Sistema permite nova cotacao, reutiliza cadastro existente pelo CPF e cria nova cotacao vinculada.
- Como o sistema lida com valores FIPE multiplos retornados pela API? Usa o codigo FIPE do PowerCRM como primario, fallback para maior score.

## Requirements *(mandatory)*

### Functional Requirements

**Formulario de Cotacao:**
- **FR-000**: Sistema DEVE disponibilizar formulario de cotacao publicamente, sem exigir autenticacao ou cadastro previo.
- **FR-001**: Sistema DEVE permitir que cliente informe a placa do veiculo nos formatos antigo (ABC-1234) e Mercosul (ABC1D23).
- **FR-002**: Sistema DEVE permitir que cliente selecione a categoria do veiculo: Veiculo Leve ou Utilitario.
- **FR-003**: Sistema DEVE permitir que cliente selecione o tipo de uso: Particular ou Comercial.
- **FR-004**: Sistema DEVE detectar automaticamente a categoria MOTO quando a API retornar tipo "MOTOCICLETA".
- **FR-005**: Sistema DEVE exibir os dados do veiculo encontrado (marca, modelo, ano, combustivel, cor, valor FIPE) para confirmacao do cliente.

**Consulta de Veiculos:**
- **FR-006**: Sistema DEVE consultar API PowerCRM para obter codigo FIPE e tipo do veiculo.
- **FR-007**: Sistema DEVE consultar API WDAPI2 para obter dados completos e valor FIPE atual.
- **FR-007a**: Sistema DEVE implementar retry simples para APIs externas: 1 tentativa adicional apos 2 segundos em caso de falha, depois exibir erro.
- **FR-008**: Sistema DEVE selecionar o valor FIPE usando codigo FIPE do PowerCRM como primario, fallback para item com maior score.
- **FR-009**: Sistema DEVE validar se marca/modelo do veiculo esta na blacklist e recusar cotacao se estiver.
- **FR-010**: Sistema DEVE validar se valor FIPE esta dentro dos limites por categoria e recusar cotacao se exceder.
- **FR-010a**: Sistema DEVE salvar cotacoes recusadas (blacklist ou limite) com status REJECTED e motivo, para follow-up comercial.

**Calculo de Valores:**
- **FR-011**: Sistema DEVE calcular a mensalidade consultando a tabela de precos por categoria e faixa de valor FIPE.
- **FR-012**: Sistema DEVE calcular a adesao como: Mensalidade x 2.
- **FR-013**: Sistema DEVE calcular a adesao com desconto como: Adesao x 0.80 (20% de desconto).
- **FR-014**: Sistema DEVE definir validade da cotacao como 7 dias a partir da criacao.

**Dados do Cliente:**
- **FR-015**: Sistema DEVE coletar nome completo do cliente.
- **FR-016**: Sistema DEVE coletar e validar CPF do cliente (formato e digitos verificadores).
- **FR-017**: Sistema DEVE coletar e validar email do cliente.
- **FR-018**: Sistema DEVE coletar e validar WhatsApp do cliente (formato brasileiro).
- **FR-019**: Sistema DEVE coletar endereco completo: CEP, rua, numero, complemento, bairro, cidade, estado.
- **FR-020**: Sistema DEVE buscar endereco automaticamente ao informar CEP valido (via API ViaCEP).

**Persistencia:**
- **FR-021**: Sistema DEVE identificar cliente existente pelo CPF e reutilizar cadastro; caso nao exista, criar novo registro.
- **FR-022**: Sistema DEVE salvar dados do veiculo na tabela vehicles.
- **FR-023**: Sistema DEVE salvar cotacao na tabela quotations com todos os valores calculados, vinculando ao cliente (novo ou existente).
- **FR-024**: Sistema DEVE atribuir vendedor a cotacao via algoritmo round-robin.

**Notificacoes:**
- **FR-025**: Sistema DEVE enviar mensagem WhatsApp ao cliente com detalhes da cotacao apos finalizacao.
- **FR-026**: Sistema DEVE notificar vendedor atribuido sobre nova cotacao.

**Painel Administrativo:**
- **FR-027**: Sistema DEVE permitir que usuarios com perfil SELLER visualizem apenas cotacoes atribuidas a eles.
- **FR-028**: Sistema DEVE permitir que usuarios com perfil SELLER atualizem status da cotacao (PENDING, CONTACTED, ACCEPTED, CANCELLED, REJECTED).
- **FR-029**: Sistema DEVE expirar automaticamente cotacoes pendentes apos 7 dias.
- **FR-030**: Sistema DEVE permitir que usuarios com perfil ADMIN visualizem todas as cotacoes e editem tabela de precos.
- **FR-031**: Sistema DEVE permitir que usuarios com perfil ADMIN gerenciem blacklist de veiculos.
- **FR-036**: Sistema DEVE restringir acesso baseado em dois perfis fixos: SELLER (cotacoes proprias) e ADMIN (acesso completo).

**Limites por Categoria:**
- **FR-032**: Categoria NORMAL: limite maximo de R$ 180.000.
- **FR-033**: Categoria ESPECIAL: limite maximo de R$ 190.000.
- **FR-034**: Categoria UTILITARIO: limite maximo de R$ 450.000.
- **FR-035**: Categoria MOTO: limite maximo de R$ 90.000.

### Key Entities

- **Customer (Cliente)**: Pessoa que solicita a cotacao. Atributos: nome, CPF, email, telefone (WhatsApp), endereco completo (CEP, rua, numero, complemento, bairro, cidade, estado).

- **Vehicle (Veiculo)**: Veiculo sendo cotado. Atributos: placa, marca, modelo, ano, valor FIPE, codigo FIPE, combustivel, cor, categoria (NORMAL/ESPECIAL/UTILITARIO/MOTO), tipo de uso (PARTICULAR/COMERCIAL).

- **Quotation (Cotacao)**: Cotacao gerada para um cliente/veiculo. Atributos: valores (mensalidade, adesao, adesao com desconto, cota de participacao), status (PENDING/CONTACTED/ACCEPTED/EXPIRED/CANCELLED/REJECTED), motivo de rejeicao (se aplicavel), data de criacao, data de expiracao, vendedor atribuido.

- **Seller (Vendedor)**: Usuario do sistema que atende leads. Atributos: nome, email, telefone, status ativo/inativo, contador de atribuicoes, ultima atribuicao, perfil (SELLER ou ADMIN).

- **PricingRule (Regra de Preco)**: Define mensalidade por faixa de valor FIPE e categoria. Atributos: categoria, faixa minima, faixa maxima, mensalidade, cota de participacao.

- **Blacklist**: Marcas/modelos de veiculos nao aceitos. Atributos: marca, modelo (opcional - NULL significa toda a marca), motivo.

## Assumptions

- A API PowerCRM estara disponivel e responde com codigo FIPE e tipo de veiculo.
- A API WDAPI2 estara disponivel e retorna dados completos do veiculo incluindo valor FIPE.
- A Evolution API (WhatsApp) esta configurada e operacional para envio de mensagens.
- Os vendedores ja estao cadastrados no sistema antes das primeiras cotacoes.
- A tabela de precos e blacklist serao populadas inicialmente via seed SQL.
- O sistema de autenticacao (Better Auth) ja existente sera utilizado para acesso ao painel.
- A cota de participacao sera definida posteriormente pelos stakeholders.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Cliente consegue completar uma cotacao (desde entrada da placa ate visualizacao do resultado) em menos de 3 minutos.
- **SC-002**: 95% das consultas de placa retornam resultado em menos de 5 segundos.
- **SC-003**: 100% das cotacoes finalizadas geram notificacao WhatsApp ao cliente em menos de 30 segundos.
- **SC-004**: Sistema distribui leads igualmente entre vendedores ativos (variacao maxima de 10% no numero de atribuicoes).
- **SC-005**: Todas as cotacoes pendentes sao automaticamente expiradas apos 7 dias.
- **SC-006**: Sistema suporta 100 cotacoes simultaneas sem degradacao de performance.
- **SC-007**: 100% das cotacoes para veiculos na blacklist sao recusadas com mensagem apropriada.
- **SC-008**: 100% das cotacoes com valor FIPE acima do limite sao recusadas com mensagem apropriada.
- **SC-009**: Taxa de erro nas consultas de API menor que 5% (excluindo placas invalidas).
- **SC-010**: Vendedores conseguem visualizar e atualizar status de cotacoes em menos de 3 cliques.
