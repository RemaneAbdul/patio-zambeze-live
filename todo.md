# Persistência do Histórico da Mesa

- [x] Criar identidade persistente para a sessão/mesa sem depender apenas do estado local.
- [x] Criar tabelas para históricos, seleções e itens com preço registrado no momento da confirmação.
- [x] Gerar e aplicar a migração do banco de dados.
- [x] Criar consultas e procedimentos para criar, listar e confirmar seleções históricas.
- [x] Integrar o frontend para carregar e persistir o Histórico da Mesa.
- [x] Manter o histórico somente leitura após confirmação e sem pedido, pagamento ou notificação.
- [x] Escrever testes Vitest para persistência e permissões.
- [x] Validar o fluxo completo e salvar checkpoint.

## Lacunas identificadas na revisão

- [x] Adicionar estados de carregamento e erro para leitura e gravação do Histórico da Mesa.
- [x] Testar persistência bem-sucedida, isolamento por sessionToken e histórico somente leitura.
- [x] Validar no browser o round-trip: confirmar seleção, recarregar, reabrir histórico e imprimir recibo em mobile e desktop.

## Recibo térmico conforme exemplo

- [x] Exibir Pátio Zambeze e “HISTÓRICO MESA” no cabeçalho impresso.
- [x] Exibir data/hora atuais, separadores, seleções e itens com quantidade e preço alinhados.
- [x] Destacar subtotal, TOTAL ESTIMADO e mensagem curta para confirmação com o garçom.
- [x] Manter impressão compacta, dinâmica, sem fotos, menu, filtros ou navegação.
- [x] Validar 58 mm e 80 mm e salvar checkpoint.

## Revisão final do recibo térmico

- [x] Trocar o rótulo impresso para “TOTAL ESTIMADO”.
- [x] Validar explicitamente o conteúdo e largura de 58 mm.
- [x] Validar explicitamente o conteúdo e largura de 80 mm.
- [x] Salvar novo checkpoint após a validação.
