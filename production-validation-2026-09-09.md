# Validação de produção — 2026-09-09

- Projecto Vercel: `patio-zambeze-live`
- Repositório: `RemaneAbdul/patio-zambeze-live`
- Commit confirmado no GitHub: `dfbebe6b5f7695058452fcc3b27eafa6990c7f75`
- Deployment listado como Ready: `patio-zambeze-live-req2aeo8m-yuranremane51-1345s-projects.vercel.app`
- `/api/auth-config` no domínio principal devolve URL base normalizada: `https://xtqhebrgrepjjxwniirz.supabase.co` (chave omitida).
- `/api/trpc/menu.active` devolve 19 produtos e URLs reais `/manus-storage/...`.
- No domínio principal, `/manus-storage/...` e `/api/storage?path=...` ainda devolveram 404 antes da última validação do deployment.
- O domínio específico do deployment Vercel redirecciona para SSO quando consultado sem sessão autenticada; não foi usado para inferir o estado do objecto Storage.
- Não foram expostos valores de chaves, palavras-passe ou tokens.

## Revalidação após `8a3019e`

O deployment `patio-zambeze-live-cd6faf6sd-yuranremane51-1345s-projects.vercel.app` apareceu no Vercel para o commit `8a3019e`. Após a publicação, o domínio principal passou a renderizar as referências de imagem como URLs absolutas no domínio gerido, por exemplo `https://menudigital-8xuhohcp.manus.space/manus-storage/menu-products/6c12b0c6-e6c2-4769-b56b-d973ae116d50_d67d8fd8.jpg`. A página pública apresenta 19 itens, incluindo Garffff, Chamuça, Rissóis, Frango à Zambeziana, REMA e outros; a validação visual do browser confirmou que a origem antiga relativa do Vercel foi substituída. O domínio gerido respondeu `200 image/jpeg` ao objecto de exemplo.
