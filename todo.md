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

## Correção final do recibo no painel

- [x] Garantir que a pré-visualização mostra as seleções e itens consultados.
- [x] Corrigir o botão Imprimir agora para acionar a impressão térmica.
- [x] Eliminar páginas em branco e imprimir somente um recibo preenchido.
- [x] Validar com dados reais, mobile/desktop e testes automatizados.
- [x] Salvar checkpoint da correção.

## Atualização final: mesa, garçom, rotas e impressão

- [x] Separar o menu do cliente em `/menu` e manter `/painel` interno protegido.
- [x] Fazer QR Codes apontarem para `/menu?table=ID_INTERNO` sem expor o painel.
- [x] Garantir identificador único persistente para cada mesa/QR Code.
- [x] Criar identificação de garçons com ID, nome, estado ativo/inativo e sessão autenticada.
- [x] Associar o garçom autenticado à sessão quando a mesa for atendida.
- [x] Preservar a associação do garçom e criar nova associação ao abrir nova sessão.
- [x] Corrigir a impressão sem alterar o design do recibo único compartilhado.
- [x] Aguardar dados/renderização, validar conteúdo e bloquear impressão vazia.
- [x] Mostrar estados Preparando, A imprimir, erro e Tentar novamente.
- [x] Consolidar CSS para imprimir somente o recibo em 58/80 mm.
- [x] Criar testes de mesa, garçom, sessão, autorização e impressão.
- [x] Validar menu/painel em mobile e desktop e salvar checkpoint.

## Lacunas finais da atualização mesa/garçom

- [x] Adicionar ação visível de Tentar novamente no erro de impressão do menu do cliente.
- [x] Aplicar corretamente a classe de largura 80 mm ao alvo real do recibo e validar 58/80 mm.
- [x] Adicionar testes explícitos para rota `/menu?table=`, identidade/associação do garçom e impressão validada.
- [x] Validar esta atualização em desktop e mobile e salvar checkpoint final.

## Verificação final de impressão térmica

- [x] Validar explicitamente o recibo do painel em 58 mm e 80 mm após a correção da classe real do wrapper.
- [x] Salvar checkpoint após as correções finais de rota, retry, largura e testes.

## Bug: recibo vazio no preview do painel

- [x] Corrigir o preview do recibo para renderizar os dados já visíveis no detalhe da mesa.
- [x] Garantir que o alvo de impressão seja o mesmo recibo preenchido do preview.
- [x] Validar 58 mm e 80 mm, impressão e ausência de páginas em branco.
- [x] Salvar checkpoint da correção.

## Validação específica do preview vazio

- [x] Validar o ThermalReceipt preenchido no modal em 58 mm e 80 mm após a remoção do `display:none` legado.
- [x] Validar que o alvo de impressão contém conteúdo e não produz recibo vazio.
- [x] Salvar checkpoint depois desta validação final.

## Correção prioritária: preview vazio e folhas brancas

- [x] Garantir que o modal mostra o ThermalReceipt preenchido com os dados da seleção consultada.
- [x] Isolar o preview de regras CSS legadas e de seletores de impressão.
- [x] Bloquear Imprimir agora quando o recibo não tiver conteúdo real.
- [x] Imprimir somente uma cópia preenchida, sem folhas em branco.
- [x] Validar 58 mm/80 mm e adicionar testes de regressão.
- [x] Salvar checkpoint prioritário da correção.

## Fecho prioritário do recibo

- [x] Validar o modal preenchido do painel em 58 mm e 80 mm após o override final.
- [x] Validar a impressão final do painel com um único recibo preenchido e sem páginas brancas.
- [x] Salvar checkpoint novo desta correção prioritária.

## Bug prioritário: janela de impressão em branco

- [x] Garantir que o documento enviado ao navegador contém o recibo preenchido.
- [x] Isolar o documento de impressão do DOM e do CSS do painel.
- [x] Preservar 58 mm e 80 mm no documento térmico.
- [x] Bloquear impressão sem dados e mostrar erro acionável.
- [x] Testar o fluxo com conteúdo, sem páginas brancas, e salvar checkpoint.

## Validação temporária autorizada: Mesa 01

- [x] Criar uma seleção temporária na Mesa 01 exclusivamente para testar o recibo.
- [x] Abrir o histórico no painel e confirmar o conteúdo do preview.
- [x] Acionar a impressão e confirmar um único recibo preenchido, sem páginas brancas.
- [x] Remover a sessão e os itens de teste da Mesa 01 após a validação.
- [x] Salvar checkpoint depois da limpeza e documentar o resultado.

## Fecho da validação temporária da Mesa 01

- [x] Adicionar/confirmar uma regressão técnica observável para garantir que o portal de impressão contém um único recibo preenchido e não o menu.
- [x] Salvar checkpoint final após a limpeza da Mesa 01 e documentar o resultado no histórico do projeto.
- [x] Documentar ao utilizador que a Mesa 01 voltou a Sem pedido após a validação.


## Preparação individual por item do menu

- [x] Adicionar campos de preparação em português e inglês ao modelo de produtos/menu.
- [x] Permitir editar e guardar a preparação própria de cada prato no painel interno.
- [x] Exibir a preparação no detalhe do item no menu do cliente, respeitando PT/EN.
- [x] Manter o snapshot histórico do pedido sem alterações retroativas.
- [x] Criar testes Vitest para persistência, tradução e renderização da preparação.
- [x] Validar desktop/mobile e salvar checkpoint da atualização.

## Pendências reais da gestão persistente de preparação

- [x] Criar tabela persistente de produtos/menu com preparação PT e EN, preço, categoria, imagem e estado.
- [x] Criar procedures protegidas para listar, criar, editar, ativar/desativar e excluir logicamente itens.
- [x] Adicionar secção Menu/Gestão do Menu ao painel interno com formulário de preparação.
- [x] Fazer o menu público consumir os produtos persistentes, com fallback seguro durante a migração.
- [x] Preservar preparação no snapshot de table_selection_items sem alterar históricos antigos.
- [x] Criar testes específicos de schema/API, edição, tradução e renderização.
- [x] Validar desktop e mobile e salvar checkpoint final.

### Nota de escopo desta atualização

A solicitação atual foi implementada no menu público: todos os 15 itens possuem preparação PT/EN e o detalhe do prato mostra o tempo/método de preparação. A gestão persistente/editável de produtos no painel, descrita no anexo, permanece como uma evolução separada para não alterar o catálogo e a base de dados sem confirmação adicional do restaurante.

## Correção da impressão no iPhone

- [x] Reproduzir e diagnosticar por que a pré-visualização móvel recebe a página branca do painel.
- [x] Isolar o portal único do recibo também no Safari/iOS e impedir a impressão do shell do painel.
- [x] Adicionar regressão para impressão móvel e confirmar conteúdo real do recibo.
- [x] Validar 58 mm/80 mm em desktop e smartphone e salvar checkpoint.

## Alterações do ficheiro anexado no painel

- [x] Ler e mapear integralmente as alterações solicitadas para o painel.
- [x] Implementar as alterações no painel interno sem remover a proteção por autenticação.
- [x] Validar desktop/mobile, testes e compatibilidade com histórico/recibos.
- [x] Salvar checkpoint e entregar o link atualizado.

## Adaptação visual do painel de pratos à referência

- [x] Reproduzir cabeçalho e navegação visual da referência, incluindo identidade, idioma e perfil.
- [x] Adaptar cartões de pratos para grelha com imagem, preço, categoria, estado e acções.
- [x] Adaptar filtros, alternância grelha/lista e secção de adicionar prato.
- [x] Manter funções persistentes de edição, estados, remoção, preparação e imagens.
- [x] Validar desktop/mobile, testes e salvar checkpoint visual.

## Correções prioritárias de identidade, imagens, contraste e idioma

- [x] Substituir “Sabores de Moçambique” por “Pátio Zambeze” em todo o painel e cabeçalhos internos.
- [x] Separar claramente galeria do dispositivo e câmara no carregamento de fotos do painel.
- [x] Corrigir textos transparentes e garantir contraste legível no menu e painel.
- [x] Tornar PT/EN claramente disponíveis no menu público e no painel.
- [x] Validar desktop/mobile, testes e salvar checkpoint prioritário.

## Correção prioritária do formulário de pratos

- [x] Corrigir o botão Guardar prato para aceitar e persistir os dados válidos do formulário.
- [x] Mostrar estados de gravação, sucesso e erro de forma legível.
- [x] Remover transparência residual de textos, campos, cartões e acções do painel.
- [x] Manter galeria/câmara, preparação automática e estados dos pratos.
- [x] Validar criação/edição, testes, build e mobile antes do checkpoint.

## Aplicação do ficheiro anexado

- [x] Ler e mapear as alterações do ficheiro anexado.
- [x] Aplicar as alterações no painel sem remover funções existentes.
- [x] Criar ou actualizar testes para os novos fluxos.
- [x] Validar desktop/mobile e publicar checkpoint.

## Análise e aplicação do ficheiro 5

- [x] Ler e analisar o conteúdo do ficheiro anexado.
- [x] Corrigir e aplicar as alterações relevantes no painel.
- [x] Actualizar testes e validar persistência, UI e responsividade.
- [x] Publicar checkpoint e entregar o link actualizado.

## Aplicação do ficheiro 6

- [x] Ler e mapear o conteúdo do ficheiro anexado.
- [x] Aplicar as alterações relevantes no painel.
- [x] Actualizar testes e validar interface e persistência.
- [x] Publicar checkpoint e entregar o resultado.

## Correcção de persistência de pratos

- [x] Auditar o fluxo painel → tRPC → helpers → base de dados.
- [x] Corrigir guardar e actualizar com dados persistentes.
- [x] Corrigir remoção lógica e exclusão do menu público.
- [x] Adicionar testes de integração e feedback de erro/sucesso.
- [x] Validar após recarregar a página em desktop/mobile e publicar checkpoint.

## Correcção de contraste dos cartões móveis

- [x] Auditar regras de layout e opacidade dos cartões de pratos.
- [x] Separar imagem, conteúdo, preço, estado e acções em blocos sólidos.
- [x] Garantir contraste legível em mobile e desktop.
- [x] Adicionar regressão visual/estrutural e validar a interface.
- [x] Publicar checkpoint da correcção.

## Correcção do formulário mobile e gravação de pratos

- [x] Corrigir botões Galeria, Câmara e Guardar para ficarem visíveis no mobile.
- [x] Auditar validação, payload e callbacks de guardar/actualizar.
- [x] Garantir persistência e feedback de sucesso/erro após recarregar.
- [x] Adicionar regressões para criação/edição e contraste dos botões.
- [x] Validar mobile/desktop e publicar checkpoint.

## Correcção do erro ao guardar alterações

- [x] Identificar a mensagem real por trás do aviso “1 error”.
- [x] Corrigir o payload/validação do actualizar prato.
- [x] Mostrar mensagem específica e legível ao utilizador.
- [x] Testar actualizar, recarregar e confirmar persistência no mobile.
- [x] Publicar checkpoint da correcção.

## Correcção do upload de fotos dos pratos

- [x] Auditar inputs de galeria/câmara, pré-visualização e payload.
- [x] Corrigir validação, selecção e persistência das imagens.
- [x] Permitir guardar o prato sem imagem com fallback visível.
- [x] Adicionar testes de imagem e validar o fluxo mobile.
- [x] Publicar checkpoint e documentar como adicionar fotos.

## Sincronização de edição e feedback de carregamento

- [x] Garantir que editar actualiza a base de dados e invalida o menu público.
- [x] Mostrar progresso durante processamento da foto e gravação do prato.
- [x] Confirmar feedback de sucesso/erro e evitar cliques duplicados.
- [x] Criar regressões para edição e sincronização do catálogo.
- [x] Validar mobile/desktop e publicar checkpoint.

## Correcção da validação de imageUrl

- [x] Auditar formatos imageUrl gerados pela galeria/câmara e enviados no update.
- [x] Aceitar data URLs válidos e preservar a foto existente quando não houver nova foto.
- [x] Rejeitar apenas formatos realmente inválidos com mensagem clara.
- [x] Testar criar, editar sem trocar foto e substituir foto.
- [x] Publicar checkpoint da correcção.
