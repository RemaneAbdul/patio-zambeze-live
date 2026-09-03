# Achados externos — Login de produção

Data da verificação: 03-09-2026.

## Vercel

URL verificada: https://patio-zambeze-live.vercel.app/painel/login

O domínio de produção carregou o formulário de login e o fluxo de código de garçom. Um teste controlado com o código fictício `000000` apresentou `Código de acesso incorreto.` e devolveu o botão ao estado `Entrar`, sem loading infinito.

Um teste controlado com email `audit-invalid@example.invalid` e palavra-passe fictícia apresentou `Email ou palavra-passe inválidos, ou conta desactivada.` e devolveu o botão ao estado normal. Não foram usadas credenciais reais.

Contexto Vercel consultado através do projecto `prj_RSRxpz5SPlu1MMPMxcVz2V5nJ1dJ`, equipa `team_3VhltQoJMTKg0PdxzmXdxsLe`; o projecto `patio-zambeze-live` está ligado ao GitHub `RemaneAbdul/patio-zambeze-live`.

Erros runtime agrupados consultados para `/api/trpc` nas últimas 24 horas: nenhum erro encontrado.

## Supabase

Projecto Supabase verificado: `https://supabase.com/dashboard/project/xtqhebrgrepjjxwniirz`.

A página de Attack Protection mostra o CAPTCHA desactivado e o controlo `Prevent use of leaked passwords` sem interruptor accionável no plano Free actual; a opção aparece indisponível/sem configuração aplicável. Isto não foi tratado como activado.

## Conclusão

A correcção local deve proteger todas as etapas assíncronas do login por email, usar timeout finito, limpar sessão/token em falhas, mapear mensagens de forma segura e não deixar auditoria/invalidation bloquear o redirect. Também é necessário proteger o hook `useAuth` contra falha de `localStorage` em Safari/WebView.
