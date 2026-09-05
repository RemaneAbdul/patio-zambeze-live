# Auditoria do prompt mestre — evidências

## Catálogo

A procedure pública `menu.active` usa `listMenuProducts(false, true)`, filtra `menu_products.status = ACTIVE`, `menu_categories.status = ACTIVE`, e limita ambos ao restaurante `default`, com INNER JOIN por `categoryId`. A procedure `menu.publicCategories` usa o mesmo restaurante e categorias activas.

O smoke test local respondeu HTTP 200; a resposta pública contém 19 produtos e a resposta de categorias contém 7 categorias. A captura visual após aguardar a resposta mostrou os 19 pratos reais no menu, portanto não há evidência de que a query ou o filtro ocultem todos os pratos.

## Imagens e logotipo

O cabeçalho usava uma imagem directa sem `onError`, e os cards dos pratos usavam `<img>` directo quando havia URL. O Storage Proxy registou `TypeError: fetch failed / SocketError: other side closed`; um URL de imagem de produto respondeu 502, enquanto o logotipo e outro prato responderam 307. A falha pode deixar cards sem imagem. Foi criado `ResilientImage` para exibir fallback acessível e profissional em URL ausente ou erro de carregamento, integrado no logotipo, cards e detalhe do prato.

## Autenticação

`WaiterLogin` usa cliente Supabase lazy, configuração pública via variáveis Vite ou `/api/auth-config`, timeout de 15 segundos, login por email/senha, código numérico de 6 dígitos, `sessionStorage` para token e queries tRPC de `loginStatus` e `profile`. `main.tsx` anexa o Bearer Supabase às chamadas tRPC. O servidor valida o token com Supabase Auth Admin e associa `supabase:<id>` ao perfil local; garçons exigem perfil `GARCOM` activo e `authUserId` correspondente. Não foi detectado bypass de autenticação.

## Infraestrutura

A consulta SQL directa falhou com `SSL connection error: unexpected eof while reading`; não houve mutação nem perda de dados. O conector MCP Supabase também falhou numa tentativa de listagem por erro TLS `bad record MAC`. O diagnóstico deve continuar sem assumir que a base está vazia; o endpoint tRPC local conseguiu devolver dados reais.

## Validação após correcções

TypeScript e build de produção passaram. A suite padrão passou com 62 ficheiros, 204 testes e 5 testes externos explicitamente ignorados; os testes de integração Supabase permanecem disponíveis com `RUN_SUPABASE_INTEGRATION=1`, mas falharam de forma intermitente com `Connection terminated unexpectedly` no pooler durante operações Drizzle. Um `SELECT 1` directo com a mesma URL funcionou nas variantes original e password encoded.

A captura visual desktop e mobile confirmou que o menu monta, o logotipo aparece, os 19 pratos são apresentados, o login usa código numérico de seis dígitos e a interface continua utilizável em viewport 390px. Os cards sem imagem deixam de ficar silenciosamente quebrados: o componente resiliente mostra fallback acessível quando o Storage falha.

## Auditoria funcional controlada

Foram verificadas em modo somente leitura as rotas `/`, `/menu`, `/painel/login`, `/painel/qr-codes`, `/painel/mesas`, `/painel/impressoes` e `/api/health`; todas responderam HTTP 200. As procedures públicas `menu.active` e `menu.publicCategories` responderam HTTP 200 na repetição final; `menu.active` entregou 19 produtos reais. A primeira chamada manual de `menu.active` devolveu 500 transitório, mas a resposta subsequente foi 200 com dados, sem alteração de código ou dados.

A cobertura automatizada aprovada inclui sessões/mesas/QR e permissões, PDF e impressão térmica, guards Admin/Garçom, criação/edição de garçons e catálogo. Não foram submetidos pedidos, gerados QR Codes, alteradas mesas, impressos recibos reais ou executadas mutações Supabase durante esta auditoria controlada.
