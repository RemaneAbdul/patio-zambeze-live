# Achados visuais — Anexo 50

- Desktop `/painel/mesas` carregou com o painel, resumo diário e navegação sem overflow visível.
- Mobile 390×844 carregou com cabeçalho responsivo, título quebrado de forma legível, resumo em coluna e sem corte horizontal visível.
- A validação do botão Remover foi feita por teste estrutural e pela lógica renderizada: só é criado para `selection.status === "PENDING" && item.status === "PENDING"`.
- O aviso de item em preparação está preparado no estado da mutação; o ecrã visual capturado não continha um pedido activo para o disparar.
