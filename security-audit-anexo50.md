# Auditoria de Segurança — Anexo 50

**Projecto:** Pátio Zambeze / Menu Digital Restaurante  
**Data:** 02-09-2026  
**Escopo:** backend Express/tRPC, frontend React, Supabase, sessão, autorização, pedidos públicos, uploads, dependências e histórico Git.

## Resultado executivo

A auditoria encontrou e corrigiu duas vulnerabilidades aplicáveis no código: confiança em campos de pedido enviados pelo cliente e uma fronteira de autorização que aceitava roles legadas ou comuns como garçom. Também foram adicionados headers de segurança, limites de corpo, verificação de `Origin` nas mutações tRPC, regressões de não exposição e actualizações de dependências vulneráveis.

## Correcções aplicadas

| Área | Resultado |
|---|---|
| Mass assignment de pedidos | `addSelection` aceita apenas `productId` oficial e quantidade limitada; nomes, preparação, preços, subtotal e total deixam de ser confiados ao cliente. |
| Autorização | Apenas `admin` ou `garcom` activo com código válido de 6 dígitos atravessam a guarda operacional. Roles `user` e `waiter` legadas são rejeitadas. |
| Exposição de credenciais | Código de acesso do garçom não aparece em perfis operacionais, dashboard, recibos, históricos, respostas de quick login ou metadata de auditoria. |
| Headers e transporte | `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, HSTS sob HTTPS e CSP em produção. |
| Corpo das requisições | JSON limitado a 10 MB para suportar imagens autorizadas; URL-encoded limitado a 1 MB. |
| CSRF | Mutações tRPC com `Origin` presente são aceites apenas quando correspondem à origem do host actual. |
| Dependências | Axios, Drizzle ORM, Nanoid e dependências transitivas vulneráveis foram actualizados/forçados para versões corrigidas no lockfile. |
| Supabase SECURITY DEFINER | EXECUTE revogado para `PUBLIC`, `anon` e `authenticated` nas duas funções privilegiadas; trigger com `search_path` fixado em `public`. |

## Verificações Supabase

O advisor de segurança confirmou RLS activo nas tabelas críticas. As tabelas server-only sem políticas permanecem intencionalmente protegidas contra acesso directo pelas roles públicas, porque a aplicação usa procedures/backend autorizado. As políticas existentes de garçons e utilizadores foram inspeccionadas; não foi executada nenhuma operação destrutiva nem foram lidos dados de clientes.

O Supabase Auth ainda reporta **Leaked Password Protection Disabled**. Esta opção deve ser activada no Dashboard do Supabase em **Authentication → Password Security**, pois não é exposta pelo fluxo de migração SQL utilizado nesta auditoria.

## Validação

Foram aprovados os testes de segurança direccionados, TypeScript e build de produção. A auditoria de dependências terminou com **0 advisories HIGH, MODERATE e LOW** após a resolução do lockfile. Permanecem apenas avisos não bloqueantes de dependências deprecated/peer dependency, sem advisory de segurança activo no relatório final.

## Limitações e acompanhamento

O rate limit do quick login já existente foi preservado e validado. A protecção de pedidos públicos contra abuso volumétrico continua dependente do rate limit do hosting/WAF e da observabilidade de produção; não foi adicionada uma limitação global agressiva que pudesse bloquear clientes legítimos atrás do mesmo NAT.
