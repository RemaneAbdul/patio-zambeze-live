# Verificação visual — routing por role

A rota `/painel/login` foi verificada em desktop e mantém cartão, campos e botão legíveis, sem transparência ou overflow.

A rota `/painel/admin` foi verificada com a sessão administrativa persistida do navegador e abriu o painel do restaurante. O guard de rota permanece associado ao role admin; o teste automatizado cobre o bloqueio para garçons.
