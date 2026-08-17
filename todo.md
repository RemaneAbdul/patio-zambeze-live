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

## Otimização e ciclo de seleção

- [x] Reduzir duplicação em table_selection_items, mantendo apenas os campos necessários ao comprovativo e índices essenciais.
- [x] Avaliar normalização de nome/preço e preservar snapshot mínimo no momento da confirmação.
- [x] Garantir que Minha Seleção contenha apenas itens pendentes e desapareça quando vazia.
- [x] Fazer novos itens reaparecerem em Minha Seleção sem alterar o Histórico.
- [x] Confirmar novas seleções somente após Mostrar ao Garçom + Confirmar.
- [x] Testar isolamento entre seleção pendente e histórico, consumo e persistência.
- [x] Salvar checkpoint após a validação.

## Lacunas finais da otimização

- [x] Remover o rótulo Histórico da Mesa do modal Minha Seleção.
- [x] Validar a redução de colunas e o subtotal por item reconstruído.
- [x] Validar o estado simultâneo de Histórico existente e nova Minha Seleção.
- [x] Criar checkpoint após a validação final.

## Correção da impressão do recibo

- [x] Ocultar completamente o painel do Histórico, menu e navegação durante a impressão.
- [x] Mostrar somente o bloco receipt-print em uma página térmica.
- [x] Validar a impressão sem páginas extras e salvar checkpoint.

## Sincronização e recibo em branco

- [x] Confirmar a versão sincronizada e identificar por que receipt-print fica vazio na impressão.
- [x] Corrigir a renderização do recibo sem voltar a imprimir o menu ou o painel.
- [x] Validar preview, impressão e testes e criar checkpoint sincronizado.

## Hora independente por submissão

- [x] Exibir hora, minuto e segundo próprios em cada seleção confirmada.
- [x] Usar o timestamp de cada seleção no painel e no recibo impresso.
- [x] Validar múltiplas submissões e salvar checkpoint.

## Rótulo de confirmação ao garçom

- [x] Confirmar o texto atual do botão no fluxo de confirmação.
- [x] Aplicar “👨‍🍳 Confirmar ao Garçom” em português e o equivalente em inglês.
- [x] Validar a renderização e salvar checkpoint.

- [x] Confirmar no painel Minha Seleção o rótulo Confirmar ao Garçom em PT e EN.

## Duplicação de table_sessions

- [x] Identificar se duplicados vêm de múltiplos tokens, chamadas repetidas ou ausência de unicidade no banco.
- [x] Tornar a criação de table_sessions idempotente por token e reutilizar a sessão no frontend.
- [x] Adicionar índice/constraint adequado sem apagar históricos válidos.
- [x] Verificar e limpar apenas sessões abertas antigas sem seleções; o banco reportou 0 registos elegíveis e não encontrou sessionTokens duplicados.
- [x] Validar chamadas repetidas e isolamento por token no teste de integração; o frontend reutiliza o token guardado no dispositivo.
- [x] Salvar checkpoint da correção.

## Correção de duas table_sessions

- [x] Identificar por que o cliente está usando dois sessionTokens diferentes.
- [x] Unificar o token no frontend e impedir inicializações concorrentes de sessão.
- [x] Garantir idempotência no backend para chamadas repetidas.
- [x] Verificar os dois registos atuais e remover apenas duplicados sem seleções associadas.
- [x] Testar recarregamento, chamadas concorrentes e preservação do Histórico.
- [x] Salvar checkpoint da correção.

## Validação final de sessão

- [x] Coordenar a criação do sessionToken com lock entre abas quando suportado.
- [x] Adicionar teste de chamadas concorrentes com o mesmo token.
- [x] Validar recarregamento no mesmo dispositivo e preservação do Histórico.
- [x] Confirmar no banco que permanece apenas uma sessão ativa para o uso atual.
- [x] Salvar checkpoint final.

## Painel interno do garçom

- [x] Criar rota interna protegida para o painel do garçom.
- [x] Exigir autenticação e restringir consulta a utilizadores autorizados.
- [x] Permitir pesquisar uma mesa por sessionToken/código partilhado.
- [x] Mostrar seleções, produtos, quantidades, subtotais e total estimado.
- [x] Permitir imprimir apenas o recibo da mesa consultada.
- [x] Tratar estados de login, código inválido, carregamento e ausência de histórico.
- [x] Criar testes de autorização e consulta.
- [x] Validar painel em desktop/mobile e salvar checkpoint.

## Ajustes de validação do painel interno

- [x] Mostrar mensagem explícita quando o código temporário da mesa tiver formato inválido.
- [x] Testar consulta bem-sucedida do histórico por uma conta admin.
- [x] Salvar checkpoint final após os ajustes de validação.

## Expansão do painel interno conforme prompt anexado

- [x] Adicionar identificação persistente da mesa e associação do QR Code à mesa.
- [x] Criar visão geral de mesas com estados Novo, Visto e Sem pedido.
- [x] Indicar a seleção mais recente e a hora original da submissão.
- [x] Permitir abrir uma mesa e consultar todo o histórico acumulado.
- [x] Adicionar ação protegida para marcar seleções como vistas sem alterar dados.
- [x] Permitir encerrar a sessão da mesa sem apagar o histórico.
- [x] Garantir nova sessão após encerramento e isolamento do histórico anterior.
- [x] Reutilizar exatamente o modelo de recibo térmico oficial do menu.
- [x] Adicionar testes de estados, marcação, encerramento e isolamento.
- [x] Validar o painel em desktop, tablet e smartphone e salvar checkpoint.

## Correções finais da expansão do painel

- [x] Tratar SESSION_CLOSED também ao confirmar uma seleção no menu.
- [x] Criar novo token para a mesma mesa após encerramento e garantir isolamento do histórico.
- [x] Extrair o recibo térmico oficial para reutilização entre menu e painel.
- [x] Adicionar teste de encerramento, nova sessão e isolamento no cliente.
- [x] Validar explicitamente o painel em viewport tablet.
- [x] Salvar checkpoint após esta expansão.

## Última validação do cliente

- [x] Cobrir a atualização do token retornado por addSelection após encerramento e garantir que o histórico anterior não reaparece no cliente.
- [x] Salvar checkpoint final das correções da expansão.

## Atualização do painel conforme prompt anexado

- [x] Remover do painel todos os links e botões para o menu público.
- [x] Ajustar a navegação interna para Painel, Mesas, QR Codes, Impressões, Definições e Sair.
- [x] Criar gestão ilimitada de QR Codes associados a mesa/nome.
- [x] Permitir gerar, visualizar, baixar e imprimir QR Codes individualmente.
- [x] Garantir que cada QR Code abre apenas o menu do cliente com `?mesa=`.
- [x] Persistir a configuração dos QR Codes na base de dados.
- [x] Validar segurança por restaurante/conta autorizada e manter recibo único.
- [x] Criar testes de QR Codes e atualizar validação responsiva.
- [x] Salvar checkpoint da atualização.

## Fecho da atualização do painel

- [x] Criar secções reais de Impressões e Definições ou apresentar estado explícito de implementação futura.
- [x] Formalizar no painel e na documentação que a instalação atual é de restaurante único.
- [x] Salvar checkpoint final da atualização de QR Codes.

## Documentação final

- [x] Adicionar ao README o escopo atual de restaurante único e a ausência de multi-tenant.
- [x] Salvar checkpoint depois da documentação final.

## Correções reportadas no painel mobile

- [x] Corrigir sobreposição/transparência da navegação lateral e cabeçalho no smartphone.
- [x] Fazer o botão Imprimir Recibo apresentar o recibo oficial antes/durante a impressão.
- [x] Validar impressão térmica, mobile e desktop sem regressões.
- [x] Salvar checkpoint da correção.

## Validação final dos bugs reportados

- [x] Validar explicitamente o painel corrigido em desktop e smartphone, incluindo navegação aberta.
- [x] Verificar o fluxo da pré-visualização e impressão do recibo oficial no painel.
- [x] Salvar checkpoint final do bugfix.
