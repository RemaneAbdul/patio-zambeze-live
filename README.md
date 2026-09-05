
## Escopo operacional atual

Esta instalação representa um único restaurante, **Pátio Zambeze**. O painel interno, as mesas, as sessões, os históricos e os QR Codes pertencem a este restaurante e são protegidos por autenticação administrativa. O escopo multi-restaurante, com `restaurant_id` separado por organização, ainda não está implementado. Não há limites artificiais, créditos ou pacotes para a criação de QR Codes dentro desta instalação.


## Migração para Supabase PostgreSQL

O backend usa agora **Drizzle ORM com `pg`/node-postgres** e liga-se ao Supabase através de `SUPABASE_DATABASE_URL`. A aplicação removeu a dependência `mysql2`, mantém os identificadores camelCase existentes e usa SSL explícito no pool para compatibilidade com o Transaction Pooler.

Use no Supabase a URI do **Transaction Pooler**, normalmente com porta `6543`, e substitua todos os marcadores de exemplo pela palavra-passe real. A variável deve ser configurada como segredo no ambiente de desenvolvimento e no ambiente de produção; nunca deve ser gravada neste README, no código ou num ficheiro `.env` versionado.

## Variáveis para Vercel

Para executar o servidor em produção, configure no projecto Vercel as variáveis `SUPABASE_DATABASE_URL`, `JWT_SECRET`, `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `OWNER_OPEN_ID`, `OWNER_NAME`, `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`, `VITE_FRONTEND_FORGE_API_URL` e `VITE_FRONTEND_FORGE_API_KEY`. As variáveis `VITE_*` são expostas ao bundle do navegador apenas quando já fazem parte do contrato público da aplicação; a connection string do Supabase e o JWT permanecem exclusivamente no servidor.

Antes de apontar tráfego real para Vercel, execute `pnpm exec tsc --noEmit`, `pnpm test` e `pnpm build`. O teste `server/supabaseConnection.test.ts` valida a configuração por defeito e executa `SELECT 1` quando `RUN_SUPABASE_INTEGRATION=1`; `server/tableHistory.test.ts` executa as operações reais de sessão apenas com essa mesma variável. Para uma verificação externa explícita, use `RUN_SUPABASE_INTEGRATION=1 pnpm test -- server/supabaseConnection.test.ts server/tableHistory.test.ts`. A suite padrão permanece determinística e não mascara falhas do pooler: se a execução explícita falhar, registe a indisponibilidade de rede/SSL separadamente da qualidade do código. O schema remoto foi verificado sem apagar dados durante esta migração.

A publicação Manus continua disponível como ambiente de recuperação. A integração Vercel foi activada para preparar o projecto externo, mas a aplicação deve ser validada num deployment de preview antes de qualquer promoção para produção.
