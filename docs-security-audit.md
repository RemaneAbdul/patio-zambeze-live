# Auditoria de segredos e rotação

A auditoria da árvore Git não encontrou ficheiros `.env`, certificados ou chaves privadas rastreadas. Os três caminhos que coincidem com o padrão de pesquisa são exclusivamente testes: `server/supabaseAdmin.credentials.test.ts`, `server/supabaseAuth.credentials.test.ts` e `server/supabaseAuth.secrets.test.ts`; não são ficheiros de configuração de produção.

As aplicações continuam a ler credenciais por variáveis de ambiente injectadas no runtime. Não foram adicionados valores de password, service-role ou tokens ao código, testes, logs ou documentação nesta iteração.

Como passwords e URLs de conexão foram partilhadas anteriormente fora do repositório, a rotação preventiva no Supabase/Vercel continua recomendada pelo proprietário. Esta rotação não foi executada automaticamente para evitar invalidar o acesso de produção sem confirmação e sem novos valores seguros.
