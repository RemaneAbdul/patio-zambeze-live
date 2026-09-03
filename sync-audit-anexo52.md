# Auditoria de sincronização — Anexo 52

## Escopo

A auditoria cobriu o fluxo Application → Vercel/API → Supabase Auth/Database/Storage, com foco nos CRUDs de garçons e administradores, autenticação, sessão, autorização, RLS, contratos tRPC, persistência e sincronização de estado.

## Correcções aplicadas

O servidor deixou de usar a `SUPABASE_SERVICE_ROLE_KEY` como fallback da chave pública do cliente Auth. O cliente server-side agora falha de forma explícita quando não existe uma chave pública configurada, evitando o uso indevido de uma credencial privilegiada.

A activação e desactivação de administradores passou a sincronizar Supabase Auth e `users.waiterActive`. Se a actualização local falhar, a alteração Auth é compensada para evitar divergência entre os dois sistemas. A autorização continua server-side e administradores inactivos permanecem bloqueados pelo contexto e pelas procedures.

A criação e gestão de garçons continuam a utilizar Auth primeiro, perfil local depois e compensação em caso de falha parcial. Os pedidos públicos usam IDs de produtos oficiais e o servidor recalcula nome, preparação e preço; códigos, credenciais e chaves privilegiadas não são devolvidos ao cliente.

## Validação

Foram executados testes direccionados de administração, segurança, Supabase Auth, roles e gestão de garçons: 34 testes aprovados. TypeScript e build Vite/esbuild foram executados com sucesso. A auditoria de dependências terminou com `No known vulnerabilities found`. As rotas HTTP locais `/` e `/painel/login` responderam `200`.

A suite completa contém testes de integração que podem aguardar serviços externos; a execução global ficou bloqueada por esse comportamento de rede e foi interrompida, sem indicar falha funcional nos testes determinísticos ou no build.

## Configuração de produção

O domínio Vercel foi aberto e o login inválido respondeu sem exposição de credenciais. A verificação dos nomes das variáveis de produção no painel Vercel não pôde ser concluída automaticamente porque a sessão do painel solicitou autenticação. Confirmar manualmente que `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` existem nos ambientes Production e Preview; a Service Role Key deve estar apenas no servidor.

## Dados e segurança

Nenhuma migração destrutiva, eliminação de dados, desactivação de RLS ou force push foi utilizado nesta auditoria. O Supabase permanece a fonte de verdade para Auth e base de dados.
