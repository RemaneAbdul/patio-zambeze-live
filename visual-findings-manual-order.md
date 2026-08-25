# Verificação visual — pedido manual e password admin

Data: 25/08/2026

Foram capturados `/painel/garcom` e `/painel/garcons` em viewport móvel de 375x812. O painel operacional mantém o cabeçalho, resumo diário, identidade do utilizador e composição vertical sem overflow horizontal. A página de gestão de garçons mantém os botões “Adicionar Garçom” e “Criar Administrador” visíveis, e a lista de administradores permanece dentro do cartão responsivo. O formulário de pedido manual fica no fluxo da página e usa a grelha responsiva definida em `index.css`; a edição de admin mantém o campo de password opcional sem alterar a estrutura das restantes acções.
