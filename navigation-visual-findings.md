# Validação visual — navegação interna do Menu Cliente

- 27/08/2026: viewport móvel 390x844 em `/` e `/menu?table=08` carregou sem página em branco nem scroll horizontal visível.
- 27/08/2026: viewport desktop 1280x720 em `/` e `/menu?mesa=8` manteve cabeçalho, pesquisa, categorias e filtros alinhados.
- A alteração de navegação usa hash interno e não altera o caminho nem os parâmetros de mesa existentes.
- A validação visual confirma a ausência de regressão no layout principal; a sequência voltar/avançar é coberta pelos testes unitários do helper.
