# Feature Specification: Configuracoes Gerais

**Feature Branch**: `007-configuracoes-gerais`
**Created**: 2025-11-27
**Status**: Draft
**Input**: User description: "Tela de Configuracoes Gerais - centralizar todas as configuracoes do sistema de cotacao em uma unica interface com abas para: dados da empresa, configuracoes de cotacao, integracao WhatsApp, notificacoes e sistema"

## Clarifications

### Session 2025-11-27

- Q: Como armazenar credenciais sensiveis (API Keys, senhas SMTP)? → A: Criptografar com chave simetrica no banco de dados
- Q: Como organizar configuracoes no banco de dados? → A: Tabela unica de settings com coluna JSON tipada por categoria
- Q: O que fazer quando WhatsApp API esta indisponivel? → A: Enfileirar mensagem para retentar automaticamente (com limite de tentativas)
- Q: Alteracoes em configuracoes devem ser auditadas? → A: Registrar apenas alteracoes em configuracoes sensiveis (credenciais, taxas)
- Q: Funcionalidade de limpar dados de teste? → A: Removida do escopo MVP

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configurar Dados da Empresa (Priority: P1)

Como administrador, preciso cadastrar e manter os dados da empresa (nome, CNPJ, logo, contato e endereco) para que essas informacoes sejam exibidas em documentos, cotacoes e comunicacoes com clientes.

**Why this priority**: Dados da empresa sao fundamentais para identificacao em todas as comunicacoes e documentos gerados pelo sistema. Sem eles, cotacoes e mensagens nao podem ser personalizadas adequadamente.

**Independent Test**: Pode ser testado de forma independente acessando a aba Empresa, preenchendo os dados e verificando que sao persistidos e exibidos corretamente em outros locais do sistema.

**Acceptance Scenarios**:

1. **Given** administrador acessa a pagina de configuracoes, **When** clica na aba "Empresa", **Then** sistema exibe formulario com campos para dados da empresa
2. **Given** formulario de dados da empresa exibido, **When** administrador preenche todos campos obrigatorios e clica em salvar, **Then** sistema persiste os dados e exibe mensagem de sucesso
3. **Given** formulario de dados da empresa exibido, **When** administrador faz upload de logo no formato correto (JPG/PNG ate 2MB), **Then** sistema exibe preview e salva a imagem
4. **Given** campo CEP preenchido, **When** administrador clica em buscar, **Then** sistema preenche automaticamente logradouro, bairro, cidade e estado via consulta de CEP

---

### User Story 2 - Configurar Regras de Cotacao (Priority: P1)

Como administrador, preciso definir parametros de cotacao (validade, taxas, descontos, cotas de participacao) para que o sistema calcule automaticamente os valores das cotacoes de acordo com as regras de negocio.

**Why this priority**: Sem as regras de cotacao configuradas, o sistema nao consegue gerar cotacoes com valores corretos. E a base para o funcionamento do sistema de cotacoes.

**Independent Test**: Pode ser testado configurando valores de taxa de adesao e desconto, e verificando que uma nova cotacao utiliza esses parametros no calculo.

**Acceptance Scenarios**:

1. **Given** administrador acessa aba "Cotacao", **When** define dias de validade da cotacao, **Then** novas cotacoes expiram automaticamente apos esse periodo
2. **Given** taxa de adesao e desconto configurados, **When** nova cotacao e criada, **Then** valor de adesao e calculado como: FIPE x taxa x (1 - desconto)
3. **Given** cotas de participacao por categoria definidas, **When** cotacao de determinada categoria e gerada, **Then** sistema aplica cota correspondente
4. **Given** alerta de expiracao habilitado, **When** cotacao esta a N dias de expirar, **Then** sistema notifica automaticamente

---

### User Story 3 - Integrar com WhatsApp API (Priority: P2)

Como administrador, preciso configurar a integracao com WhatsApp para que o sistema possa enviar mensagens automaticas aos clientes sobre cotacoes.

**Why this priority**: A integracao com WhatsApp automatiza comunicacao com clientes, mas o sistema pode funcionar sem ela (envio manual). Por isso e prioridade 2.

**Independent Test**: Pode ser testado configurando credenciais de API, testando conexao e verificando status de conectado/desconectado.

**Acceptance Scenarios**:

1. **Given** administrador acessa aba "WhatsApp", **When** preenche URL, API Key e nome da instancia, **Then** sistema salva credenciais de forma segura
2. **Given** credenciais configuradas, **When** clica em "Testar conexao", **Then** sistema verifica conectividade e exibe status (conectado/erro)
3. **Given** integracao conectada, **When** sistema dispara mensagem automatica, **Then** cliente recebe notificacao via WhatsApp

---

### User Story 4 - Gerenciar Templates de Mensagens WhatsApp (Priority: P2)

Como administrador, preciso criar e editar templates de mensagens com variaveis dinamicas para personalizar comunicacoes automaticas com clientes.

**Why this priority**: Templates sao necessarios para automacao de mensagens, mas dependem da integracao WhatsApp estar funcionando.

**Independent Test**: Pode ser testado criando template com variaveis, editando conteudo e visualizando preview com dados de exemplo.

**Acceptance Scenarios**:

1. **Given** administrador na aba WhatsApp, **When** clica em editar template existente, **Then** sistema exibe editor com variaveis disponiveis
2. **Given** template editado, **When** usa variaveis como {{cliente_nome}} e {{mensalidade}}, **Then** sistema substitui por valores reais no envio
3. **Given** administrador quer novo template, **When** clica em "Adicionar novo template", **Then** sistema permite criar template do zero

---

### User Story 5 - Configurar Notificacoes do Sistema (Priority: P3)

Como administrador, preciso configurar quais eventos disparam notificacoes e por quais canais (email, WhatsApp, sistema) para manter a equipe informada sobre atividades importantes.

**Why this priority**: Notificacoes melhoram produtividade da equipe, mas o sistema pode operar sem elas. Usuario pode consultar informacoes manualmente.

**Independent Test**: Pode ser testado habilitando notificacao para evento especifico e verificando que e enviada quando evento ocorre.

**Acceptance Scenarios**:

1. **Given** administrador na aba "Notificacoes", **When** habilita notificacao por email para "Nova cotacao criada", **Then** admins recebem email ao criar cotacao
2. **Given** configuracao SMTP preenchida, **When** clica em "Testar configuracao", **Then** sistema envia email de teste e confirma entrega
3. **Given** notificacoes no sistema habilitadas, **When** evento ocorre, **Then** sistema exibe badge com contador de pendencias

---

### User Story 6 - Configurar Preferencias do Sistema (Priority: P3)

Como administrador, preciso configurar preferencias regionais (fuso horario, formato de data, idioma) e gerenciar integracoes de API externas.

**Why this priority**: Preferencias regionais melhoram usabilidade, mas o sistema funciona com valores padrao (America/Sao_Paulo, DD/MM/YYYY, BRL, Portugues Brasil).

**Independent Test**: Pode ser testado alterando formato de data e verificando que datas no sistema sao exibidas no novo formato.

**Acceptance Scenarios**:

1. **Given** administrador na aba "Sistema", **When** altera fuso horario, **Then** todas datas/horas no sistema refletem novo fuso
2. **Given** administrador na area de APIs, **When** clica em "Testar" para WDAPI2, **Then** sistema verifica conectividade e exibe status

---

### User Story 7 - Gerenciar Backup e Dados (Priority: P3)

Como administrador, preciso poder fazer backup dos dados, exportar informacoes e configurar backup automatico para garantir seguranca dos dados.

**Why this priority**: Backups sao importantes para continuidade do negocio, mas nao bloqueiam uso diario do sistema.

**Independent Test**: Pode ser testado clicando em "Fazer backup agora" e verificando que arquivo de backup e gerado com sucesso.

**Acceptance Scenarios**:

1. **Given** administrador na aba "Sistema", **When** clica em "Fazer backup agora", **Then** sistema gera arquivo de backup e confirma conclusao
2. **Given** backup automatico habilitado, **When** horario programado chega, **Then** sistema executa backup automaticamente
3. **Given** administrador quer exportar dados, **When** clica em "Exportar dados", **Then** sistema gera arquivo para download

---

### Edge Cases

- O que acontece quando upload de logo excede 2MB? Sistema rejeita e exibe mensagem de erro clara
- O que acontece quando CEP nao e encontrado? Sistema exibe mensagem e permite preenchimento manual
- O que acontece quando teste de conexao WhatsApp falha? Sistema exibe mensagem de erro detalhada e sugere verificar credenciais
- O que acontece quando SMTP esta mal configurado? Sistema falha graciosamente e notifica sobre erro de configuracao
- O que acontece quando usuario tenta salvar com campos obrigatorios vazios? Sistema exibe validacao inline em cada campo
- O que acontece quando sessao expira durante edicao de configuracoes? Sistema preserva dados em rascunho local e permite retomar
- O que acontece quando mensagem WhatsApp falha apos 5 tentativas? Sistema marca como falha, notifica administrador e permite reenvio manual

## Requirements *(mandatory)*

### Functional Requirements

**Estrutura Geral:**
- **FR-001**: Sistema DEVE exibir pagina de configuracoes com navegacao por 5 abas: Empresa, Cotacao, WhatsApp, Notificacoes, Sistema
- **FR-002**: Sistema DEVE persistir configuracoes ao clicar em "Salvar alteracoes" em cada aba
- **FR-003**: Sistema DEVE exibir mensagem de confirmacao apos salvar com sucesso
- **FR-004**: Sistema DEVE exibir mensagens de erro claras quando validacao falhar
- **FR-005**: Sistema DEVE restringir acesso a configuracoes apenas para usuarios com perfil administrador
- **FR-006**: Sistema DEVE registrar em log de auditoria todas as alteracoes em configuracoes sensiveis (credenciais, taxas, descontos) com usuario, data/hora e valor anterior

**Aba Empresa:**
- **FR-010**: Sistema DEVE permitir upload de logo nos formatos JPG/PNG com tamanho maximo de 2MB
- **FR-011**: Sistema DEVE exibir preview do logo apos upload
- **FR-012**: Sistema DEVE permitir remover logo existente
- **FR-013**: Sistema DEVE validar CNPJ com formato e digitos verificadores
- **FR-014**: Sistema DEVE validar formato de email no campo de contato
- **FR-015**: Sistema DEVE buscar endereco automaticamente ao informar CEP valido (integracao ViaCEP)
- **FR-016**: Sistema DEVE aplicar mascara em campos de CNPJ, telefone e CEP

**Aba Cotacao:**
- **FR-020**: Sistema DEVE permitir configurar dias de validade da cotacao (1-30 dias)
- **FR-021**: Sistema DEVE permitir configurar taxa de adesao como percentual sobre FIPE
- **FR-022**: Sistema DEVE permitir configurar desconto sobre taxa de adesao
- **FR-023**: Sistema DEVE exibir calculo final da taxa de adesao em tempo real
- **FR-024**: Sistema DEVE permitir configurar cota de participacao por categoria (Normal, Especial, Utilitario, Moto)
- **FR-025**: Sistema DEVE permitir habilitar/desabilitar alerta de cotacao expirando
- **FR-026**: Sistema DEVE permitir configurar dias de antecedencia para alerta de expiracao
- **FR-027**: Sistema DEVE integrar com telas existentes de Precos (tabela de mensalidades por faixa FIPE)
- **FR-028**: Sistema DEVE integrar com tela existente de Blacklist (marcas/modelos bloqueados, valor FIPE maximo)

**Aba WhatsApp:**
- **FR-030**: Sistema DEVE permitir selecionar provedor de API (Evolution API, Z-API, Baileys, Outro)
- **FR-031**: Sistema DEVE permitir configurar URL da API, API Key e nome da instancia
- **FR-032**: Sistema DEVE armazenar API Key criptografada com chave simetrica no banco de dados (nao exibir em texto claro apos salvar)
- **FR-033**: Sistema DEVE permitir testar conexao com API e exibir status
- **FR-034**: Sistema DEVE exibir data/hora da ultima sincronizacao
- **FR-035**: Sistema DEVE permitir criar, editar e excluir templates de mensagens
- **FR-036**: Sistema DEVE exibir lista de variaveis disponiveis para templates
- **FR-037**: Sistema DEVE validar que templates contenham apenas variaveis validas
- **FR-038**: Sistema DEVE fornecer templates padrao para: Cotacao Criada, Cotacao Expirando, Cotacao Aceita
- **FR-039**: Sistema DEVE enfileirar mensagens WhatsApp quando API indisponivel e retentar automaticamente com backoff exponencial (limite de 5 tentativas)

**Aba Notificacoes:**
- **FR-040**: Sistema DEVE permitir configurar servidor SMTP (servidor, porta, usuario, senha criptografada com chave simetrica, TLS)
- **FR-041**: Sistema DEVE permitir testar configuracao SMTP enviando email de teste
- **FR-042**: Sistema DEVE permitir habilitar/desabilitar notificacoes por email para cada tipo de evento
- **FR-043**: Sistema DEVE permitir habilitar/desabilitar notificacoes WhatsApp para vendedores
- **FR-044**: Sistema DEVE permitir configurar notificacoes em tempo real no sistema
- **FR-045**: Sistema DEVE permitir configurar tempo para marcar notificacao como lida automaticamente

**Aba Sistema:**
- **FR-050**: Sistema DEVE permitir configurar fuso horario
- **FR-051**: Sistema DEVE permitir configurar formato de data (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
- **FR-052**: Sistema DEVE permitir configurar formato de moeda
- **FR-053**: Sistema DEVE permitir configurar idioma do sistema
- **FR-054**: Sistema DEVE exibir status de conexao com APIs externas (WDAPI2, FIPE, ViaCEP)
- **FR-055**: Sistema DEVE permitir testar conexao com cada API externa
- **FR-056**: Sistema DEVE permitir configurar URL e credenciais da WDAPI2
- **FR-057**: Sistema DEVE exibir informacoes de backup (ultimo backup, tamanho do banco)
- **FR-058**: Sistema DEVE permitir fazer backup manual
- **FR-059**: Sistema DEVE permitir habilitar/desabilitar backup automatico diario
- **FR-060**: Sistema DEVE permitir configurar retencao de backups (dias)
- **FR-061**: Sistema DEVE permitir exportar e importar dados
- **FR-062**: Sistema DEVE permitir configurar nivel de log (Debug, Info, Warning, Error)
- **FR-063**: Sistema DEVE permitir visualizar e exportar logs
- **FR-064**: Sistema DEVE permitir resetar configuracoes para valores padrao (com confirmacao)

### Key Entities

- **Settings**: Tabela unica com coluna JSON tipada por categoria (company, quotation, whatsapp, notification, system). Cada categoria armazena seus dados especificos em formato JSON estruturado. Credenciais sensiveis sao criptografadas antes de persistir.
  - Categoria `company`: nome, nome fantasia, CNPJ, inscricao estadual, telefones, email, website, logo (path), endereco completo
  - Categoria `quotation`: dias de validade, taxa de adesao, desconto, cotas de participacao por categoria, configuracoes de alerta de expiracao
  - Categoria `whatsapp`: provedor, URL da API, API Key (criptografada), nome da instancia, status de conexao
  - Categoria `notification`: configuracao SMTP (senha criptografada), eventos habilitados por canal, preferencias de exibicao
  - Categoria `system`: fuso horario, formato de data, formato de moeda, idioma, configuracao de APIs externas, configuracao de backup e logs
- **MessageTemplate**: Template de mensagem - nome, tipo de evento, conteudo com variaveis, ativo/inativo (tabela separada devido a natureza de colecao)
- **SettingsAuditLog**: Registro de alteracoes em configuracoes sensiveis - usuario, data/hora, categoria, campo alterado, valor anterior (sem valor atual por seguranca)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Administrador consegue configurar dados completos da empresa em menos de 5 minutos
- **SC-002**: Alteracoes em regras de cotacao sao aplicadas imediatamente em novas cotacoes
- **SC-003**: Integracao WhatsApp pode ser configurada e testada em menos de 3 minutos
- **SC-004**: Sistema envia mensagem automatica via WhatsApp em ate 30 segundos apos evento
- **SC-005**: 95% dos administradores conseguem configurar notificacoes por email com sucesso na primeira tentativa
- **SC-006**: Backup manual e gerado em menos de 2 minutos para bancos de ate 500MB
- **SC-007**: Busca automatica de CEP retorna endereco em menos de 2 segundos
- **SC-008**: Teste de conexao com APIs externas retorna resultado em menos de 5 segundos

## Assumptions

- Telas de Precos e Blacklist ja existem no sistema e serao reutilizadas/integradas via navegacao
- Sistema usa Better Auth e ja possui conceito de perfis de usuario (admin/vendedor/supervisor)
- ViaCEP e usado para busca de enderecos (API publica gratuita)
- Formato padrao de data e DD/MM/YYYY, moeda BRL, idioma Portugues Brasil, fuso America/Sao_Paulo
- Logo da empresa e armazenado localmente no servidor (nao em CDN externo)
- APIs de WhatsApp suportadas seguem padrao REST com autenticacao via API Key
- Backup e feito via dump do banco de dados PostgreSQL
