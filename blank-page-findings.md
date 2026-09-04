# Diagnóstico da página em branco

Em 2026-09-04, a abertura de `https://patio-zambeze-live.vercel.app/` devolveu o título `Pátio Zambeze · Menu Digital`, mas o viewport ficou totalmente vazio e não foram detectados elementos interactivos.

## Causa confirmada

A importação manual do entrypoint publicado foi rejeitada com `Error: supabaseUrl is required`, originado no cliente Supabase do bundle de produção. O código publicado importava `PasswordReset.tsx` estaticamente e criava `createClient(import.meta.env.VITE_SUPABASE_URL, ...)` durante a avaliação do módulo; como a variável pública não estava injectada nesse deployment, o módulo falhava antes de o React montar o root.

## Correcção aplicada

O cliente de PasswordReset agora só é criado quando URL e chave pública existem. Quando a configuração está ausente, a rota mostra um estado seguro e accionável, sem derrubar o menu público. Foi extraída uma função de normalização/teste e adicionada regressão para configuração ausente e válida.

## Validação

A versão local monta visualmente o menu público e o login de garçom em desktop. A suite completa passou com 59 ficheiros e 203 testes; o build de produção também foi concluído. A página publicada ainda precisa de receber este commit e das variáveis públicas Supabase serem confirmadas no projecto Vercel que serve o domínio.
