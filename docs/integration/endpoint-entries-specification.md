ESPECIFICACAO TECNICA - ADICIONAR PARAMETRO isDraft AO ENDPOINT DE LANCAMENTOS

RESUMO EXECUTIVO

O QUE QUEREMOS:
Adicionar parametro opcional isDraft (boolean) ao endpoint POST /api/external/drafts

COMO FUNCIONA:
- isDraft = false (ou omitido) -> Cria entry oficial confirmado (status: "confirmed")
- isDraft = true -> Cria draft pendente de revisao (status: "draft") - comportamento atual

VALOR PADRAO: false (lancamentos oficiais por padrao)

IMPACTO: Nenhum breaking change. Apps antigos continuam funcionando.

MOTIVO: Permitir que usuarios criem lancamentos oficiais diretos, sem etapa de revisao manual, agilizando o fluxo de trabalho.

1. CONTEXTO

O endpoint POST /api/external/drafts atualmente cria lancamentos que sempre vao para revisao (drafts). Os usuarios desejam a opcao de criar lancamentos oficiais diretamente, sem etapa de revisao manual, para agilizar o fluxo de trabalho.

2. OBJETIVO

Adicionar parametro isDraft ao endpoint existente POST /api/external/drafts para permitir que o consumidor (app mobile) controle se o lancamento e criado como:
- Entry oficial (confirmado e definitivo) - quando isDraft = false
- Draft (rascunho pendente de revisao) - quando isDraft = true

3. MUDANCAS NECESSARIAS

3.1 Endpoint Afetado

POST /api/external/drafts

Nota: MANTER o nome atual do endpoint. NAO renomear. Apenas adicionar novo parametro opcional.

4. CONTRATO DA API

4.1 Request Parameters (Parametros Existentes + Novo)

Parametro | Tipo | Obrigatorio | Valor Padrao | Descricao
----------|------|-------------|--------------|----------
audio | File | Condicional | - | Arquivo de audio (MP3/M4A/WAV)
text | String | Condicional | - | Texto descritivo do lancamento
cardId | UUID | Nao | null | UUID do cartao de credito
selectedDestinations | Array UUID | Nao | Destination do usuario | IDs das pessoas/centros de custo
latitude | String | Nao | null | Latitude geografica (ex: "-23.5505199")
longitude | String | Nao | null | Longitude geografica (ex: "-46.6333094")
category | String | Nao | null | Categoria (ex: "Alimentacao")
expectedFrequency | String | Nao | null | "monthly", "weekly", "yearly", "sporadic"
expenseType | String | Nao | null | "fixed", "variable", "recurring", "sporadic", "subscription"
isDraft | Boolean | Nao | false | NOVO: Define modo de criacao

Condicional: Ao menos um deve ser fornecido: audio OU text

Nota: selectedDestinations - Se nao enviado, sistema busca ou cria destination com nome do usuario autenticado

4.2 Comportamento do Parametro isDraft

Quando isDraft = false (PADRAO)
- Criar lancamento confirmado e oficial
- Entrada vai direto para tabela de entries finais
- Status: confirmed, posted ou equivalente
- Visivel imediatamente em relatorios e resumos
- Nao requer aprovacao/revisao posterior

Quando isDraft = true
- Criar lancamento pendente de revisao
- Entrada fica em estado de rascunho
- Status: draft, pending ou equivalente
- Nao aparece em relatorios oficiais
- Requer confirmacao/edicao posterior pelo usuario

4.3 Response Structure

Resposta Atual (HTTP 201) - Draft criado:

{
  "success": true,
  "message": "Lancamento registrado com sucesso!",
  "summary": "Descricao: ... | Valor: R$ ... | Cartao: ...",
  "draft": {
    "id": UUID,
    "description": String,
    "amount": Decimal,
    "selectedDestinations": Array[UUID],
    "cardId": UUID,
    "month": String,
    "source": "mobile",
    ...
  }
}

Resposta Desejada quando isDraft = false (HTTP 201) - Entry oficial criado:

{
  "success": true,
  "message": "Lancamento confirmado com sucesso!",
  "summary": "Descricao: ... | Valor: R$ ... | Cartao: ...",
  "entry": {
    "id": UUID,
    "description": String,
    "amount": Decimal,
    "selectedDestinations": Array[UUID],
    "cardId": UUID,
    "month": String,
    "source": "mobile",
    "status": "confirmed",
    "confirmedAt": ISO8601,
    ...
  }
}

Nota: A estrutura da resposta pode manter o campo "draft" mesmo para entries oficiais, desde que o status esteja diferenciado.

5. REGRAS DE NEGOCIO

5.1 Processamento Comum (Independente do isDraft)

1. Extrair token JWT do header Authorization: Bearer {token}
2. Identificar userId e tenantId automaticamente do token
3. Processar audio/texto atraves da IA para extrair:
   - Descricao do lancamento
   - Valor (amount)
   - Data/hora (se mencionada)
   - Possivel identificacao de cartao (se mencionado)
4. Validar que o cardId pertence ao tenant do usuario
5. Aplicar splits nas destinations conforme logica de negocio

5.2 Validacoes Especificas por Modo

Para isDraft = false (Entry Oficial)
- OBRIGATORIO: IA deve conseguir extrair amount valido
- OBRIGATORIO: IA deve conseguir extrair description nao-vazia
- OBRIGATORIO: cardId deve ser valido e ativo
- OBRIGATORIO: date deve ser valida
- REJEITAR request se parsing da IA falhar em campos criticos

Para isDraft = true (Rascunho)
- PERMITIR: Amount zerado ou nao identificado
- PERMITIR: Description parcial ou incompleta
- PERMITIR: Campos faltantes (usuario pode editar depois)
- SALVAR: Texto/audio original para reprocessamento futuro

6. CASOS DE USO

Caso 1: Lancamento Direto (Usuario Confia na IA) - NOVO COMPORTAMENTO

Cenario: Usuario quer rapidez, confia no parsing da IA, deseja lancamento oficial direto.

Request:
POST /api/external/drafts
Authorization: Bearer {token}
Content-Type: multipart/form-data

audio: [arquivo.m4a]
cardId: "abc-123-def"
latitude: "-23.5505199"
longitude: "-46.6333094"
isDraft: false

Resultado Esperado:
- Entry oficial criado imediatamente com status "confirmed"
- Aparece em GET /api/entries
- Incluido em GET /api/entries/summary-by-destination
- NAO aparece em GET /api/entry-drafts (ou aparece com status "confirmed")

Caso 2: Rascunho para Revisao (Usuario Quer Conferir) - COMPORTAMENTO ATUAL

Cenario: Usuario quer revisar antes de confirmar (comportamento atual mantido).

Request:
POST /api/external/drafts
Authorization: Bearer {token}
Content-Type: multipart/form-data

text: "Jantar com clientes no italiano 150 reais"
cardId: "abc-123-def"
isDraft: true

Resultado Esperado:
- Draft criado para revisao com status "draft" ou "pending"
- Aparece em GET /api/entry-drafts
- NAO aparece em GET /api/entries
- NAO incluido em relatorios/resumos
- Usuario pode editar/confirmar depois

Caso 3: Omissao do Parametro (Comportamento Padrao) - IMPORTANTE

Cenario: App antigo nao envia isDraft (retrocompatibilidade).

Request:
POST /api/external/drafts
Authorization: Bearer {token}
Content-Type: multipart/form-data

text: "Uber 35 reais cartao Nubank"

Resultado Esperado:
- Tratar como isDraft = false (PADRAO)
- Entry oficial criado imediatamente
- Comportamento: lancamento confirmado direto

IMPORTANTE: O valor padrao de isDraft deve ser FALSE para que o comportamento padrao seja criar lancamentos oficiais, tornando o fluxo mais rapido por padrao.

6.1 Como o App Mobile Vai Usar (Contexto)

O app mobile tera uma preferencia nas configuracoes:

Configuracao: "Modo Rascunho"
- DESABILITADA (padrao): Lancamentos vao diretos como oficiais (isDraft: false)
- HABILITADA: Lancamentos vao como rascunho para revisao (isDraft: true)

Fluxo:
1. Usuario grava audio ou digita texto
2. App le preferencia do usuario do storage local
3. App envia isDraft baseado na preferencia:
   - Preferencia OFF -> isDraft: false
   - Preferencia ON -> isDraft: true
4. Backend processa conforme o valor de isDraft

Beneficios:
- Usuario decide seu proprio fluxo de trabalho
- Quem confia na IA pode ser mais rapido
- Quem quer revisar pode continuar usando drafts
- Configuracao persiste entre sessoes

7. INTEGRACAO COM ENDPOINTS EXISTENTES

7.1 Endpoints Que DEVEM Filtrar por Status

GET /api/entries
- Retornar APENAS: entries com status = confirmed (ou equivalente)
- Ignorar: entries com status = draft
- Query params mantidos: month, cardId

GET /api/entry-drafts
- Retornar APENAS: entries com status = draft (ou equivalente)
- Ignorar: entries com status = confirmed

GET /api/entries/summary-by-destination
- Considerar APENAS: entries com status = confirmed
- Ignorar completamente: drafts pendentes
- Query params mantidos: month

8. TRATAMENTO DE ERROS

8.1 Validacao Falhou (isDraft = false)

HTTP 422 Unprocessable Entity

{
  "success": false,
  "error": "Nao foi possivel processar o lancamento",
  "message": "A IA nao conseguiu identificar o valor. Tente novamente ou use modo rascunho.",
  "code": "AI_PARSING_FAILED",
  "suggestions": [
    "Tente ser mais especifico sobre o valor",
    "Ative o modo rascunho para revisar manualmente"
  ]
}

8.2 Cartao Invalido

HTTP 400 Bad Request

{
  "success": false,
  "error": "Cartao invalido",
  "message": "O cartao informado nao pertence ao seu grupo.",
  "code": "INVALID_CARD"
}

8.3 Parametro isDraft Invalido

HTTP 400 Bad Request

{
  "success": false,
  "error": "Parametro invalido",
  "message": "O parametro 'isDraft' deve ser true ou false.",
  "code": "INVALID_PARAMETER"
}

9. CRITERIOS DE ACEITACAO

Must Have

1. Parametro isDraft implementado com valores true ou false
2. Valor padrao false quando parametro omitido
3. Entries oficiais (isDraft: false) tem status = confirmed
4. Drafts (isDraft: true) tem status = draft
5. GET /api/entries retorna apenas confirmed
6. GET /api/entry-drafts retorna apenas drafts
7. GET /api/entries/summary-by-destination considera apenas confirmed
8. Validacao rigida para entries oficiais (IA parsing obrigatorio)
9. Validacao flexivel para drafts (permite campos incompletos)

Should Have

10. Retrocompatibilidade: rota antiga /api/external/drafts redireciona para nova
11. Logs indicando qual modo foi usado (isDraft: true/false)
12. Mensagens de erro claras quando IA parsing falha em modo oficial

Nice to Have

13. Endpoint futuro POST /api/entry-drafts/:id/confirm para confirmar drafts
14. Webhook/notificacao quando draft e criado (para revisao)

10. CONSIDERACOES TECNICAS

10.1 Multi-tenancy
- tenantId extraido automaticamente do JWT
- Todas as queries devem filtrar por tenant do usuario autenticado
- Cartoes, destinations e entries isolados por tenant

10.2 Performance
- Entries oficiais e drafts podem estar na mesma tabela (filtro por status)
- Indexes recomendados: (tenantId, status, timestamp)

10.3 Auditoria
- Registrar qual modo foi usado: created_as_draft: true/false
- Timestamp de confirmacao: confirmed_at (null para drafts)

10.4 Migracao
- Entries antigos criados antes desta feature devem ter status = confirmed
- Script de migracao para garantir consistencia

11. TESTES MINIMOS REQUERIDOS

Cenario | isDraft | Resultado Esperado
--------|---------|-------------------
Enviar audio + isDraft=false | false | Entry oficial criado, status=confirmed
Enviar texto + isDraft=true | true | Draft criado, status=draft
Enviar texto sem isDraft | omitido | Entry oficial criado (padrao=false)
GET /api/entries | - | Retorna apenas confirmed
GET /api/entry-drafts | - | Retorna apenas drafts
Summary ignora drafts | - | Total considera apenas confirmed
IA parsing falha + isDraft=false | false | HTTP 422 error
IA parsing falha + isDraft=true | true | HTTP 201, draft salvo

11.1 Exemplos Praticos com cURL

Teste 1: Criar entry oficial (isDraft: false)

curl -X POST https://smart.app.webmaxdigital.com/api/external/drafts \
  -H "Authorization: Bearer {TOKEN}" \
  -F "text=Almoco 45 reais cartao Nubank" \
  -F "latitude=-23.5505199" \
  -F "longitude=-46.6333094" \
  -F "isDraft=false"

Esperado: HTTP 201, entry confirmado, aparece em GET /api/entries


Teste 2: Criar draft para revisao (isDraft: true)

curl -X POST https://smart.app.webmaxdigital.com/api/external/drafts \
  -H "Authorization: Bearer {TOKEN}" \
  -F "text=Jantar 120 reais" \
  -F "isDraft=true"

Esperado: HTTP 201, draft criado, aparece em GET /api/entry-drafts


Teste 3: Omitir isDraft (deve criar entry oficial)

curl -X POST https://smart.app.webmaxdigital.com/api/external/drafts \
  -H "Authorization: Bearer {TOKEN}" \
  -F "text=Uber 25 reais"

Esperado: HTTP 201, entry confirmado (padrao: isDraft=false)

12. DEFINICAO DE DONE

- Parametro isDraft implementado e funcionando
- Testes unitarios para ambos os modos
- Testes de integracao cobrindo 8 cenarios minimos
- Filtros corretos em GET /api/entries e GET /api/entry-drafts
- Summary filtrando apenas confirmed
- Documentacao da API atualizada (Swagger/OpenAPI)
- Postman/Insomnia collection atualizada
- Backend deployado em ambiente de staging
- Validacao com time mobile (smoke test)

13. CONTATO E DUVIDAS

Consumer (Mobile Team):
- Esperamos response seguindo estrutura especificada na secao 4.3
- Precisamos que erros sejam detalhados (secao 8)
- Planejamos lancar feature em 2 semanas

Provider (Backend Team):
- Qualquer duvida sobre regras de negocio, favor sinalizar
- Se estrutura de dados atual nao comporta esta mudanca, discutir alternativas
- Informar estimativa de implementacao e data de disponibilizacao em staging

14. O QUE NAO MUDAR (IMPORTANTE)

Para evitar breaking changes, MANTER:
- Nome do endpoint: POST /api/external/drafts (NAO renomear)
- Estrutura atual de request: todos os campos existentes continuam iguais
- Estrutura atual de response: { success, message, summary, draft }
- Multi-tenancy: tenantId continua sendo extraido do JWT automaticamente
- Ordenacao de destinations: por uso recente (mais usadas primeiro)
- Comportamento de selectedDestinations: se omitido, usa destination do usuario

APENAS ADICIONAR:
- Novo parametro opcional isDraft (boolean, padrao: false)
- Novo campo status na resposta ("confirmed" ou "draft")
- Logica de filtragem nos endpoints GET existentes

15. PROXIMOS PASSOS

Backend:
1. Revisar esta especificacao
2. Confirmar viabilidade tecnica
3. Estimar tempo de implementacao
4. Informar data de disponibilizacao em staging
5. Implementar e testar
6. Atualizar documentacao da API (Swagger)
7. Notificar equipe mobile quando pronto

Mobile:
1. Aguardar confirmacao do backend
2. Implementar preferencia "Modo Rascunho" no app
3. Ajustar envio do parametro isDraft
4. Testar integacao em staging
5. Deploy para producao

Documento preparado por: Equipe Mobile
Data: 12/11/2025
Versao: 2.0 (atualizado com informacoes do backend atual)

