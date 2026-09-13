# Requisitos consolidados dos anexos 08, 09 e 11

Os três anexos contêm o mesmo prompt mestre de actualização do Pátio Zambeze. O escopo consolidado é restaurar a aplicação existente após a reconfiguração Vercel sem recriar arquitectura, projecto Supabase ou dados. Não devem ser apagados utilizadores, pratos, categorias, pedidos, imagens, tabelas, políticas RLS ou funcionalidades existentes.

## Requisitos funcionais

O logotipo deve carregar na página inicial, no painel e nas restantes páginas onde é utilizado, incluindo produção Vercel e após refresh. É necessário auditar origem, caminho, extensão, Storage, permissões, URLs e diferenças entre local e produção.

Devem ser auditados Dashboard, menu, categorias, traduções PT/EN e outros idiomas existentes, utilizadores, garçons, mesas/QR Codes, pedidos, histórico e associação ao Supabase/PostgreSQL. A validação deve confirmar persistência real, não apenas toasts visuais: criar/editar/remover/activar/desactivar deve aparecer novamente após recarregar quando o fluxo for seguro para testar.

A aplicação deve manter acesso directo ao painel sem voltar a impor uma tela de login como bloqueio de abertura. A infraestrutura de autenticação Supabase deve ser preservada para operações que ainda dependam de identidade, mas redireccionamentos e guardas que bloqueiem indevidamente o painel devem ser auditados.

## Requisitos de integração e produção

O projecto correcto é `RemaneAbdul/patio-zambeze-live`, branch principal, domínio `https://patio-zambeze-live.vercel.app/`. A cadeia esperada é GitHub → Vercel → API/tRPC → Supabase/PostgreSQL/Storage. Devem ser confirmados Root Directory, framework, comandos de instalação/build, Node.js, variáveis, domínio, deployments, logs, runtime, funções serverless e rewrites.

A validação final exige TypeScript, Vitest, build, smoke HTTP, consola do browser, refresh e principais rotas. Não basta o Vercel mostrar Deployment Ready. Erros 401, 403, 404, 500, Failed to fetch, CORS, Supabase, tRPC e TypeError devem ser explicados e corrigidos quando forem causados pelo código/configuração.

## Restrições

Não criar outro projecto, não apagar dados, não remover políticas sem causa comprovada, não esconder falhas com try/catch genérico e não adicionar funcionalidades fictícias. Alterar apenas a causa confirmada e preservar as correcções já publicadas para Storage, catálogo, sessão Supabase, QR Codes, recibos e permissões.

## Observação sobre os anexos

Os anexos 08, 09 e 11 são duplicados; não foram identificados requisitos divergentes entre eles.
