# Verificação visual — logout e remoção de garçons

A página `/painel/login` permanece legível e responsiva após a alteração do logout. O painel `/painel/garcons` carrega com a sessão admin e apresenta as duas contas reais existentes, incluindo os estados INACTIVO e ACTIVO, as acções de edição, histórico, activação/desactivação e o novo botão de apagar abaixo das acções do cartão.

A remoção foi implementada no backend como operação admin-only: o acesso Supabase Auth é removido, o perfil `garcons` é eliminado e o registo `users` é convertido em utilizador normal para preservar referências históricas.
