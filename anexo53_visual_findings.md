# Achados visuais — Anexo 53

Data da verificação: 2026-09-03.

- Preview mobile 390x844 de `/painel/garcons`: cabeçalho, botões “Adicionar Garçom” e “Criar Administrador”, estado de carregamento e cartões têm contraste e não estão transparentes.
- Preview mobile 390x844 de `/painel/pratos`: “Adicionar prato”, “Nova categoria”, “Editar”, “Desactivar” e “Remover” aparecem com texto e bordas visíveis; o botão Remover usa estilo destrutivo legível.
- O preview sem cookie de sessão mostra o shell do painel e registos a carregar, portanto a persistência CRUD deve ser validada com uma sessão Admin real; não foram criados dados de teste.
