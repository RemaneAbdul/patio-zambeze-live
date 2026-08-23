# Verificação Vercel — rota `/login`

Em 23/08/2026, após o deployment `dpl_6TT9PPd2jV1CZc5Dec4sDc3XH7Ns` ficar `READY`, a rota `https://patio-zambeze-live.vercel.app/login` deixou de devolver 404, mas o browser mostrou uma página em branco com o título `Pátio Zambeze · Menu Digital` e sem elementos interactivos detectados. O deployment foi construído a partir do commit `c10765852be45b5b112da94b1ff7e7de0125bbec`.

Próxima investigação: verificar consola/rede e compatibilidade das variáveis Vercel; a causa pode ser erro JavaScript durante o bootstrap ou variáveis Supabase ausentes no deployment Vercel.


Após a autenticação do proprietário Vercel, a página de variáveis de ambiente do projecto `patio-zambeze-live` abriu correctamente. Foram visíveis `SUPABASE_DATABASE_URL` e variáveis Manus, mas não apareceram `VITE_SUPABASE_URL` nem `VITE_SUPABASE_PUBLISHABLE_KEY`. O frontend Vercel não consegue inicializar o cliente Supabase sem essas duas variáveis públicas, explicando o ecrã em branco.


O checkpoint Manus actualmente publicado ainda é anterior à criação do alias `/login`: `https://menudigital-8xuhohcp.manus.space/login` devolve 404, enquanto `/painel/login` continua a abrir a tela Supabase. A versão com `/login` foi enviada para o GitHub e está no deployment Vercel `dpl_6TT9PPd2jV1CZc5Dec4sDc3XH7Ns`.


O primeiro preenchimento após extrair a configuração pública ocorreu por engano na página Manus `/painel/login`, que estava activa no browser, e apenas colocou o URL no campo local de palavra-passe; nada foi submetido nem alterado no Supabase. A chave pública obtida do bundle funcional foi `sb_publishable_DHvunad4ZCr1n9Z9eq1oxQ_og2lsdO2`, e o URL é `https://xtqhebrgrepjjxwniirz.supabase.co`. O formulário Vercel deverá ser reaberto antes de adicionar as variáveis.


A conta proprietária Vercel está autenticada e o formulário `Add Environment Variable` abriu no projecto `patio-zambeze-live`, com Production and Preview seleccionados. O formulário está pronto para adicionar `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.


As variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` foram adicionadas com sucesso no projecto Vercel `patio-zambeze-live`, com os ambientes Production e Preview seleccionados. O Vercel confirmou a operação com a notificação de sucesso.


O Vercel confirmou `Deployment created` depois do redeploy com as duas variáveis Supabase. A página de variáveis mostra ambas como adicionadas e o deployment foi iniciado; falta aguardar o estado `READY` e testar as rotas públicas.


Depois do redeploy `dpl_9K2LRWeAWEHohZRetzMdWJYsdhNC` ficar `READY`, a navegação textual para `https://patio-zambeze-live.vercel.app/login` encontrou os campos `Email`, `Palavra-passe`, `Entrar no painel` e `Esqueci-me da palavra-passe`, confirmando que o React montou a tela. Uma chamada posterior de visualização caiu em `about:blank`, sem relação com a resposta textual válida; será feita nova navegação para validar menu e painel.


A validação no domínio Vercel confirmou que `https://patio-zambeze-live.vercel.app/menu?table=1` abre o menu público com produtos e imagens. Contudo, ao abrir `https://patio-zambeze-live.vercel.app/painel/login`, o browser foi redireccionado para `https://menudigital-8xuhohcp.manus.space/painel/login`. Isto indica que o routing Vercel ainda contém uma regra externa ou fallback antigo para `/painel/*`; a rota interna precisa de permanecer no domínio Vercel.


Após o deployment `dpl_EvwvCCXQwiALQN123vZsFReA6pYJ` ficar `READY`, as rotas `https://patio-zambeze-live.vercel.app/login` e `https://patio-zambeze-live.vercel.app/painel/login` carregam no próprio domínio Vercel com os campos de email, palavra-passe e recuperação. O redirect legado para Manus deixou de ocorrer. O menu público `/menu?table=1` também foi validado anteriormente com produtos e imagens.


No deployment Vercel `dpl_9ChowSrEtzb4gXfJMZZ2uVae6ze5`, `/painel/login` carregou no domínio oficial com os campos de autenticação e `/menu?table=1` carregou com 15 produtos, imagens, PT/EN e funcionalidades do menu. O routing não redireccionou para Manus.

2026-08-23: No deployment READY associado ao commit 76de291, `/menu?table=1` carregou 5 categorias e 15 pratos persistidos com imagens; `/painel/login` carregou no domínio oficial Vercel sem redirect para Manus.
