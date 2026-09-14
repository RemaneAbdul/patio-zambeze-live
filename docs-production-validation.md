# Checklist de validação física — Pátio Zambeze

## Validado automaticamente nesta entrega

As rotas públicas `/`, `/menu` e `/painel` responderam com HTTP 200 no domínio Vercel conhecido. O build de produção, TypeScript e suite Vitest foram aprovados. A interface `/painel` e `/painel/mesas` foi verificada em desktop e viewport móvel simulado. O token Supabase tem regressões para persistência no navegador e envio `Authorization: Bearer` nas chamadas tRPC. O bundle local respondeu `200` em `/api/health`.

## Necessita confirmação num dispositivo físico

No telemóvel físico, abrir o QR Code de uma mesa real e confirmar que o destino é `/menu?mesa=...` ou `/menu?table=...`, sem abrir o painel. No menu, seleccionar um prato, confirmar quantidade, adicionar uma nota opcional e submeter o pedido. No painel, verificar se a mesa e a selecção aparecem, marcar como visto, abrir o recibo, gerar PDF quando aplicável e imprimir numa impressora térmica. Repetir o teste após recarregar a página e, se possível, em Safari/iPhone para confirmar a persistência da sessão e do idioma.

## Pré-condições e segurança

Executar com uma mesa de teste autorizada e remover apenas dados temporários criados para o ensaio. Não partilhar passwords ou tokens no chat, screenshots ou logs. Se o login Admin falhar, registar apenas a mensagem apresentada, o navegador, o sistema operativo e a hora aproximada; nunca registar a password.

## Resultado esperado

O cliente permanece no menu público, os dados do pedido persistem no Supabase, o garçom vê apenas as mesas autorizadas, o recibo contém dados reais e a impressão não produz folhas vazias. Qualquer falha deve ser reportada com a rota, dispositivo, navegador, hora e mensagem não sensível.
