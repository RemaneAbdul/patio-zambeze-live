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

## Correcção do erro SQL ao actualizar imagem

- [x] Verificar tipo e limite actual da coluna imageUrl.
- [x] Evitar enviar base64 grande directamente no UPDATE.
- [x] Guardar a imagem de forma compatível e manter o URL no prato.
- [x] Testar editar com foto, sem trocar foto e apenas texto.
- [x] Validar menu público e publicar checkpoint.

## Notificação visual após guardar prato

- [x] Mostrar notificação de sucesso após criar ou actualizar prato.
- [x] Tornar a notificação acessível, legível e responsiva.
- [x] Testar sucesso, erro, dismiss e mobile.
- [x] Publicar checkpoint da melhoria.

## Correcção do recibo para impressão

- [x] Diagnosticar a falha ao preparar o recibo no histórico da mesa.
- [x] Corrigir a geração e os estados de erro do recibo.
- [x] Validar pré-visualização e impressão em desktop e mobile/iPhone.
- [x] Publicar checkpoint da correcção.

## Pré-visualização, PDF e impressão de uma página

- [x] Criar pré-visualização detalhada do recibo antes da impressão.
- [x] Adicionar opção para guardar o recibo como PDF.
- [x] Garantir que a impressão térmica gera apenas uma página.
- [x] Validar 58 mm, 80 mm, mobile e regressões.
- [x] Publicar checkpoint da melhoria.

## Cabeçalho do recibo e acções PDF/impressão

- [x] Diagnosticar por que os botões Imprimir Recibo e Guardar como PDF não executam a acção.
- [x] Incluir logotipo, nome e contactos do restaurante no cabeçalho impresso.
- [x] Incluir o nome do garçom que atendeu a mesa no cabeçalho.
- [x] Testar impressão, PDF, mobile e regressões.
- [x] Publicar checkpoint da correcção.

## Consolidação do histórico numa única secção de recibo

- [x] Remover a apresentação duplicada de “Histórico da Mesa”.
- [x] Mostrar apenas “Recibo da mesa” com itens, subtotais e total.
- [x] Manter apenas as acções Partilhar, Imprimir e Guardar como PDF.
- [x] Corrigir estados de erro, carregamento e responsividade.
- [x] Testar e publicar checkpoint da correcção.

## Permissão do recibo e retorno às mesas

- [x] Permitir apenas visualização do recibo antes de o garçom marcar a mesa como vista.
- [x] Liberar download/partilha do recibo após estado Visto.
- [x] Manter impressão e pré-visualização coerentes com a permissão definida.
- [x] Adicionar botão visível “Voltar para as mesas” no ecrã do recibo.
- [x] Testar permissões, navegação e responsividade; publicar checkpoint.

## Estados do pedido, impressão directa e confirmação de mesa vista

- [x] Mostrar ao cliente o estado de cada selecção: Pendente, Em preparação, Entregue e Concluído.
- [x] Actualizar o recibo térmico com o estado de cada selecção.
- [x] Fazer Imprimir Recibo e Guardar como PDF abrirem directamente a tela de impressão do sistema.
- [x] Mostrar confirmação animada após o garçom marcar a mesa como vista.
- [x] Testar estados, impressão, animação e publicar checkpoint.

## Alertas de estado e impressão sem páginas brancas

- [x] Alertar o cliente com som e vibração quando o estado mudar para Pronto ou Entregue.
- [x] Garantir que o cliente não vê a pré-visualização ao imprimir ou guardar PDF.
- [x] Corrigir o portal/CSS para imprimir somente o recibo preenchido em uma página.
- [x] Testar notificações, PDF, impressão mobile e regressões; publicar checkpoint.

## Preferências e histórico de notificações do cliente

- [x] Adicionar controlo persistente para activar/desactivar som e vibração.
- [x] Mostrar um histórico curto das mudanças de estado do pedido.
- [x] Integrar o histórico com a actualização automática do menu.
- [x] Testar preferências, histórico, mobile e publicar checkpoint.

## Impressão directa no iPhone sem pré-visualização

- [x] Corrigir o clique em Imprimir para abrir directamente a impressão nativa.
- [x] Corrigir o clique em Guardar como PDF para abrir directamente a impressão nativa em modo PDF.
- [x] Remover a pré-visualização e o menu visível por baixo durante a preparação/impressão.
- [x] Testar Safari/iPhone, Android, desktop e publicar checkpoint.

## Alertas para todos os estados e remoção do botão público

- [x] Emitir som e vibração quando o pedido mudar para Pendente, Em preparação, Pronto ou Entregue.
- [x] Registar visualmente essas mudanças no histórico de notificações.
- [x] Remover “Voltar para as mesas” do recibo/menu público do cliente.
- [x] Testar alertas, histórico, mobile e publicar checkpoint.

## Acompanhamento sincronizado com o recibo

- [x] Remover o botão Limpar do bloco Acompanhamento/Actualizações do pedido.
- [x] Mostrar no acompanhamento os estados Pendente, Em preparação, Pronto, Entregue e Concluído sincronizados com o recibo.
- [x] Garantir que Mostrar ao garçom cria a nova selecção como Pendente.
- [x] Testar sincronização, estados, alertas e mobile; publicar checkpoint.

## Alterações descritas no ficheiro enviado

- [x] Ler e decompor todos os requisitos do ficheiro enviado.
- [x] Implementar os requisitos aplicáveis sem quebrar as funcionalidades existentes.
- [x] Testar as alterações, responsividade e regressões.
- [x] Publicar checkpoint da implementação.

## Alterações descritas no pasted_content_8.txt

- [x] Ler e decompor os requisitos do novo ficheiro.
- [x] Implementar as alterações no projecto preservando o funcionamento existente.
- [x] Testar alterações, regressões, build e mobile.
- [x] Publicar checkpoint da implementação.

## Garçom no recibo após “Marcar como visto”

- [x] Auditar a associação actual do garçom à sessão da mesa.
- [x] Persistir o garçom que executa “Marcar como visto”.
- [x] Exibir nome e identificador do garçom no recibo do cliente.
- [x] Testar backend, recibo, PDF e mobile; publicar checkpoint.

## Hora de “Marcar como visto” no recibo

- [x] Auditar o timestamp actual da sessão e da marcação como visto.
- [x] Persistir a hora exacta em campo próprio quando o garçom marcar como visto.
- [x] Exibir nome, identificador e hora do garçom no recibo do cliente.
- [x] Testar backend, recibo, PDF e mobile; publicar checkpoint.

## Correcção de chaves duplicadas no painel de mesas

- [x] Diagnosticar por que mesas sem sessão recebem a mesma chave React.
- [x] Garantir chaves únicas para todas as mesas e QR Codes.
- [x] Testar `/painel/mesas`, actualizações e regressões; publicar checkpoint.

## Arquivo de recibos vistos e segunda via

- [x] Auditar as sessões e selecções marcadas como vistas.
- [x] Criar consulta protegida de recibos vistos para o painel Impressões.
- [x] Mostrar arquivo pesquisável com mesa, garçom, data, hora e total.
- [x] Permitir abrir e imprimir uma segunda via usando o mesmo recibo.
- [x] Testar autorização, impressão, regressões e mobile; publicar checkpoint.

## Alterações descritas no pasted_content_9.txt

- [x] Ler e decompor todos os requisitos do ficheiro.
- [x] Implementar as alterações preservando as funcionalidades existentes.
- [x] Testar alterações, regressões, build e mobile.
- [x] Publicar checkpoint da implementação.

## Alterações descritas no pasted_content_10.txt

- [x] Ler e decompor todos os requisitos do ficheiro.
- [x] Implementar as alterações preservando as funcionalidades existentes.
- [x] Testar alterações, regressões, build e mobile.
- [x] Publicar checkpoint da implementação.

## Correcção da segunda via do recibo

- [x] Diagnosticar o erro ao clicar em Segunda via.
- [x] Corrigir a preparação e abertura da impressão sem criar dados novos.
- [x] Validar primeira via, segunda via e reimpressões consecutivas.
- [x] Publicar checkpoint da correcção.

## Correcção do PDF no menu do cliente

- [x] Diagnosticar por que o PDF do recibo não é gerado.
- [x] Corrigir a renderização exclusiva do recibo e o download/partilha.
- [x] Validar PDF em desktop e mobile sem alterar dados.
- [x] Publicar checkpoint da correcção.

## Correcção exclusiva do recibo do cliente

- [x] Auditar geração PDF, impressão, dados carregados e referências HTML.
- [x] Corrigir PDF e impressão usando apenas o recibo real, sem alterar o menu ou pedidos.
- [x] Validar conteúdo, ausência de páginas brancas, desktop, Android, iPhone e térmica.
- [x] Publicar checkpoint da correcção.

## Alterações descritas no pasted_content_11.txt

- [x] Ler e decompor os requisitos do ficheiro.
- [x] Implementar as alterações preservando as funcionalidades existentes.
- [x] Testar alterações, regressões, build e mobile.
- [x] Publicar checkpoint da implementação.

## Identificação automática da mesa por QR Code — pasted_content_12.txt

- [x] Validar o identificador único do QR Code e rejeitar mesas inexistentes.
- [x] Mostrar a mesa identificada no topo do menu sem permitir alteração manual.
- [x] Manter a associação da sessão, histórico, pedido e recibo ao QR Code validado.
- [x] Preservar design, categorias, pesquisa, seleção, painel, impressão e PDF.
- [x] Criar testes de QR Code válido, inválido e associação da sessão.
- [x] Validar testes, build e experiência responsiva.
- [x] Publicar checkpoint da implementação.

## Separação de pedidos e recibos após “Marcar como visto” — pasted_content_13.txt

- [x] Fechar e tornar imutável cada pedido quando for marcado como visto.
- [x] Criar automaticamente um novo pedido/recibo para novas selecções após o fecho.
- [x] Garantir a regra no backend com timestamps e protecção contra alteração de pedidos vistos.
- [x] Apresentar, imprimir, baixar PDF e reimprimir cada pedido separadamente.
- [x] Preservar QR Code, mesa, menu, atribuição exclusiva, histórico e painel.
- [x] Criar testes de separação, imutabilidade e auditoria.
- [x] Validar testes, build e experiência responsiva.
- [x] Publicar checkpoint da implementação.

## Remoção de itens pelo garçom antes de “Marcar como visto” — pasted_content_14.txt

- [x] Permitir remover itens apenas de pedidos abertos e ainda não vistos.
- [x] Validar no backend a mesa, o garçom, o pedido e o item antes da remoção.
- [x] Recalcular quantidade, subtotal e total depois da remoção.
- [x] Sincronizar automaticamente o recibo do cliente e o painel do garçom.
- [x] Rejeitar remoções em pedidos vistos/fechados sem alterar recibos antigos.
- [x] Criar testes de autorização, remoção, recálculo e bloqueio após visto.
- [x] Validar testes, build e experiência responsiva.
- [x] Publicar checkpoint da implementação.

## Correcção: sessionToken inválido no painel de mesas

- [x] Impedir que o painel execute staffLookup com token vazio ou menor que 32 caracteres.
- [x] Mostrar estado neutro enquanto nenhuma mesa válida estiver seleccionada.
- [x] Adicionar teste/regressão para o estado sem mesa seleccionada.
- [x] Validar testes, TypeScript, build e painel mobile.
- [x] Publicar checkpoint da correcção.

## Limpeza controlada das Mesas 1–12 e recriação real

- [x] Rever as instruções de persistência e identificar exactamente as tabelas de mesas/QR/sessões.
- [x] Inspeccionar os registos das Mesas 1–12 e confirmar que são dados de teste antes de apagar.
- [x] Remover somente QR Codes e registos de mesa de teste, preservando usuários, garçons, pratos, configurações e dados reais.
- [x] Garantir que não existem dois QR Codes activos para a mesma mesa.
- [x] Validar que o administrador pode recriar mesas reais e gerar QR Code único por mesa.
- [x] Validar integridade do menu, histórico, painel e identificação automática por QR Code.
- [x] Documentar a limpeza e criar checkpoint da operação.

## QR Code permanente — remover regeneração do painel do garçom

- [x] Localizar todos os botões, labels e mutations de gerar/regenerar/alterar QR Code.
- [x] Remover a ação de regeneração da interface do painel do garçom.
- [x] Restringir o backend para que somente administradores possam gerir QR Codes, sem alterar a permanência dos QR Codes existentes.
- [x] Preservar visualização de mesas, atendimento, pedidos, recibos, impressão e PDF.
- [x] Criar testes de permissão e garantir que o QR Code permanece único por mesa.
- [x] Validar testes, TypeScript, build e painel responsivo.
- [x] Publicar checkpoint da correcção.

## Visibilidade dos botões no Dashboard de Pratos — pasted_content_15.txt

- [x] Localizar acções de editar, remover, activar/desactivar, adicionar e upload de imagem.
- [x] Remover dependências de hover, opacity, invisible ou text-transparent que escondam acções.
- [x] Garantir contraste, foco visível e área de toque mínima nos controlos.
- [x] Mostrar texto e ícones acessíveis para editar, remover, status, câmara e galeria.
- [x] Preservar confirmação de remoção e toda a lógica existente de CRUD/upload.
- [x] Criar ou actualizar testes de visibilidade/acessibilidade sem alterar a lógica funcional.
- [x] Validar desktop, mobile, TypeScript, build e painel responsivo.
- [x] Publicar checkpoint da correcção.

## Exportação SQL completa solicitada pelo utilizador

- [x] Gerar dump SQL com estrutura e dados actuais da base de dados.
- [x] Validar que o ficheiro contém comandos SQL legíveis e não está vazio.
- [x] Entregar o ficheiro SQL ao utilizador com aviso sobre dados sensíveis.

## Migração para Supabase e Vercel

- [x] Identificar o projecto Supabase alvo e verificar acesso administrativo.
- [x] Mapear schema, queries e tipos MySQL/TiDB incompatíveis com PostgreSQL.
- [x] Converter Drizzle e configuração de conexão para PostgreSQL sem apagar a base actual.
- [x] Migrar schema e dados com validação de contagens e relações.
- [x] Configurar variáveis de ambiente no deployment Vercel.
- [x] Validar autenticação, menu, mesas, QR Codes, pedidos, recibos e painel após a migração.
- [x] Criar checkpoint apenas depois de confirmar a migração e o deployment.

## Reconstrução destrutiva confirmada: MySQL/TiDB para Supabase

- [x] Confirmar o projecto Supabase Patio Zambeze em sa-east-1 como destino.
- [x] Apagar imediatamente os dados da base MySQL/TiDB actual, sem cópia de segurança, conforme confirmação do utilizador.
- [x] Criar o schema vazio no Supabase PostgreSQL.
- [x] Adaptar Drizzle, driver, backend e variáveis de ambiente para PostgreSQL.
- [x] Validar a nova ligação com teste PostgreSQL mínimo.
- [x] Validar testes, build, menu, painel, mesas, QR Codes, pedidos e recibos.
- [x] Publicar somente depois da validação final.

## Ligação passo a passo a nova base Supabase

- [x] Confirmar a criação do schema vazio no Supabase SQL Editor.
- [x] Configurar a connection string PostgreSQL com SSL através do campo seguro.
- [x] Validar a conexão com teste mínimo antes de alterar o backend.
- [x] Adaptar Drizzle e queries MySQL/TiDB para PostgreSQL.
- [x] Validar a aplicação com a nova base sem apagar a base actual prematuramente.
- [x] Preparar as variáveis do Vercel e documentar os passos finais.

## Nova integração Supabase/Vercel desde o zero

- [x] Confirmar a organização Supabase e escolher a região do novo projecto.
- [x] Criar um novo projecto Supabase sem reutilizar o projecto eliminado.
- [x] Criar o schema vazio e validar a nova conexão PostgreSQL.
- [x] Adaptar a aplicação para a nova base apenas depois da validação.
- [x] Criar/configurar o novo projecto Vercel apenas depois da base estar pronta.
- [x] Validar menu, painel, mesas, QR Codes, pedidos, recibos e PDF.


## Migração Supabase PostgreSQL

- [x] Validar connection string PostgreSQL do Supabase com `SELECT 1`
- [x] Converter `drizzle/schema.ts` de MySQL para `pgTable`/PostgreSQL
- [x] Actualizar `drizzle.config.ts` e dependências para o dialecto PostgreSQL
- [x] Actualizar `server/db.ts` para o driver `pg` e pool SSL do Supabase
- [x] Adaptar routers e consultas para tipos, timestamps e sintaxe PostgreSQL
- [x] Aplicar/verificar o schema PostgreSQL no Supabase sem dados de teste
- [x] Preservar QR codes permanentes, sessões, pedidos separados e atendimento exclusivo
- [x] Validar menu PT/EN, painel de garçons, recibos, PDF/impressão e identificação por QR
- [x] Preparar variáveis e documentação de deploy para Vercel
- [x] Executar Vitest, TypeScript, build e verificação visual
- [x] Criar checkpoint final após todos os itens concluídos


## Estado do Vercel

- [x] Activar a integração Vercel existente.
- [x] Criar um deployment de preview solicitado para `patio-zambeze`.
- [x] Confirmar o deployment na equipa Vercel e configurar as variáveis de ambiente de produção antes de promover para produção.


## Correcção do runtime Vercel

- [x] Separar a criação da aplicação Express do arranque com `listen` para suportar função Vercel.
- [x] Criar entradas serverless (`api/[...path].ts`, `api/trpc.ts` e `api/oauth/callback.ts`) para expor tRPC/OAuth/storage no Vercel.
- [x] Configurar `vercel.json` para servir assets Vite e encaminhar `/api/*` para a função.
- [x] Recriar deployment Vercel depois da correcção e testar menu público e endpoint tRPC.
- [x] Configurar no Vercel as variáveis Manus necessárias ao painel autenticado.


## Bloqueio externo Vercel

- [x] Reenviar a versão serverless pelo Vercel após conceder à integração MCP permissão de deploy no projecto `patio-zambeze`; o Vercel devolveu HTTP 403 para a equipa actual.
- [x] Confirmar no preview Vercel o carregamento do frontend e do endpoint `/api/trpc` após o deploy serverless.


## Bug Vercel: imagens dos pratos

- [x] Identificar os URLs actuais e confirmar por que `/manus-storage/*` não é acessível no Vercel.
- [x] Tornar as imagens dos pratos acessíveis no domínio Vercel sem guardar bytes na base de dados.
- [x] Corrigir referências e upload/serviço de imagens sem alterar dados do menu.
- [x] Testar todas as imagens no Vercel em desktop e smartphone e criar checkpoint.


## Configuração do painel no Vercel

- [x] Mapear as variáveis de autenticação e OAuth exigidas pelo backend.
- [x] Adicionar variáveis Manus ao Vercel em Production e Preview como Sensitive quando aplicável.
- [x] Criar novo deployment automático a partir do GitHub após a configuração.
- [x] Validar a rota `/painel/mesas` e preservar o menu público e as imagens.


## Rotas Vercel após activar o painel

- [x] Corrigir o fallback SPA para `/painel/mesas` e outras rotas internas não devolverem 404.
- [x] Remover o rewrite `/api/:path*` auto-referente e preservar a descoberta das funções serverless tRPC/OAuth.
- [x] Criar novo deployment pelo GitHub e validar homepage, imagens, `/painel/mesas` e `/api/trpc`.


## API tRPC no Vercel

- [x] Impedir que o fallback SPA encaminhe `/api/trpc/*` para `index.html`.
- [x] Fazer `/api/trpc/*` chegar à função Express/tRPC com o path original.
- [x] Republicar pelo GitHub e validar resposta JSON do endpoint público `menu.active`.


## Proxy da API Vercel

- [x] Encaminhar `/api/*` do domínio Vercel para o backend Manus validado, antes do fallback SPA.
- [x] Encaminhar o callback OAuth do domínio Vercel sem expor credenciais.
- [x] Republicar e validar JSON tRPC, login do painel e menu público com imagens.


## Conflito de função e proxy

- [x] Remover as entradas `api/*` do deployment Vercel, pois interceptam o proxy externo e geram `FUNCTION_INVOCATION_FAILED`.
- [x] Manter o backend Manus como origem única de `/api/*` no domínio Vercel.
- [x] Republicar e validar resposta JSON tRPC, rota do painel, OAuth e imagens.


## Teste de login real do garçom

- [x] Abrir `/painel/mesas` no domínio Vercel e iniciar o fluxo OAuth; a rota encaminha para a origem Manus autorizada.
- [x] Concluir o login numa conta autorizada sem expor credenciais no chat através do host Manus autorizado.
- [x] Confirmar cookie/sessão, carregamento do painel e acesso aos dados Supabase no host Manus autorizado.
- [x] Registar o resultado no TODO e criar checkpoint da correcção necessária.


## Login OAuth no domínio Vercel

- [x] Diagnosticar o bloqueio de sessão causado pela redirect URI Vercel não autorizada.
- [x] Corrigir a origem de redireccionamento com proxy/redirect Vercel→Manus, preservando o cookie no host autorizado.
- [x] Republicar e validar o login real, sessão autenticada e carregamento do painel no host Manus autorizado.


## Bloqueio de login no Vercel

- [x] Capturar a mensagem de `invalid redirect_uri` ao clicar em Sign in no domínio Vercel.
- [x] Corrigir o fluxo com redirect para a callback Manus autorizada; autorização directa do domínio Vercel permanece dependente do serviço Manus.
- [x] Republicar e validar que o garçom entra no painel com sessão persistente no host Manus.


## Botão Sign in sem navegação

- [x] Identificar a variável pública OAuth ausente ou inválida no build Vercel.
- [x] Corrigir a configuração do botão Sign in sem expor credenciais.
- [x] Republicar e validar que o clique abre o portal OAuth e regressa ao painel.


## Incidente crítico de segurança no bundle Vercel

- [x] Remover `SUPABASE_DATABASE_URL` e qualquer segredo server-side do bundle frontend.
- [x] Confirmar que apenas variáveis `VITE_*` públicas chegam ao cliente.
- [x] Invalidar e substituir a connection string Supabase que foi usada no build público.
- [x] Republicar e validar o botão Sign in sem expor credenciais.


## Erro OAuth: redirect URI Vercel não autorizada

- [x] Solicitar autorização de `https://patio-zambeze-live.vercel.app/api/oauth/callback`; a alternativa aplicada foi o redirect para Manus.
- [x] Repetir o login pelo domínio Vercel e confirmar o encaminhamento para Manus.
- [x] Confirmar cookie/sessão e carregamento do painel do garçom no host Manus autorizado.


## Painel do garçom integrado no Vercel

- [x] Confirmar rota `/painel/mesas`, fallback SPA e proxy `/api/trpc` no domínio Vercel.
- [x] Integrar uma origem OAuth autorizada para o painel através do redirect Vercel→Manus sem expor credenciais.
- [x] Validar sessão autenticada, API tRPC e leitura dos dados Supabase no painel encaminhado pelo Vercel.
- [x] Fornecer o link final do painel e guardar checkpoint após validação.


## Opção 1: redirect do painel Vercel para Manus

- [x] Encaminhar `/painel/*` do domínio Vercel para o painel Manus autorizado.
- [x] Manter o menu público, imagens e API do menu no Vercel sem alteração.
- [x] Validar redirect e navegação das rotas internas; o login OAuth continua dependente da autorização do serviço Manus.
- [x] Criar checkpoint e fornecer os links finais.


## QR Codes devem abrir o menu Vercel

- [x] Identificar onde a URL dos QR Codes é construída e por que usa o host Manus.
- [x] Fazer QR Codes apontarem para `https://patio-zambeze-live.vercel.app/menu?...` ou a rota pública equivalente.
- [x] Garantir que o redirect para Manus afecta apenas `/painel/*`.
- [x] Validar scan/URL, identificação da mesa e preservação do painel do garçom.


## Erro staffLookup na página de Impressões

- [x] Auditar o uso de `skipToken`/inputs na consulta `tableHistory.staffLookup`.
- [x] Impedir qualquer query sem `queryFn` ou com `skipToken` executado como input.
- [x] Adicionar regressão e validar `/painel/impressoes` sem erros de consola.
- [x] Criar checkpoint da correcção.


## Implementação do documento completo: Admin, Garçom e RBAC

- [x] Auditar requisitos do documento contra schema, routers, rotas e componentes existentes.
- [x] Identificar lacunas reais sem reconstruir funcionalidades já implementadas.
- [x] Completar o núcleo de RBAC, acesso de staff activo e controlo backend sem alterar a autenticação Manus existente.
- [x] Validar pedidos, mesas, QR Codes, recibos, impressão, PDF e responsividade sem regressões.
- [x] Adicionar/actualizar testes de segurança e fluxos críticos.
- [x] Rever todo o TODO, criar checkpoint e fornecer o resultado desta implementação incremental.


## Correcções da secção Garçons — pasted_content_3

- [x] Auditar a secção Garçons actual contra gestão, permissões, atendimento e histórico exigidos.
- [x] Garantir que apenas o administrador pode listar, adicionar, activar/desactivar e gerir garçons; edição de perfil e credenciais continuam no Manus OAuth.
- [x] Preservar histórico de pedidos, mesas, operações e auditoria ao desactivar um garçom.
- [x] Expor no backend as mesas actualmente atribuídas a cada garçom.
- [x] Expor no backend o histórico de atendimento por garçom com datas e horas.
- [x] Impedir definitivamente ao garçom gerir garçons, permissões, QR Codes, mesas e configurações administrativas.
- [x] Manter as permissões operacionais do garçom para mesas, pedidos, estados, recibos, PDF e finalização.
- [x] Actualizar a interface Garçons sem fotografia, com estado, mesa actual e acções administrativas claras.
- [x] Não implementar redefinição de palavra-passe local enquanto a autenticação oficial for Manus OAuth; documentar a limitação de forma segura.
- [x] Adicionar testes de autorização, preservação de histórico, atendimento actual e histórico por garçom.
- [x] Validar TypeScript, suite Vitest, build e fluxos desktop/mobile.
- [x] Rever TODO, criar checkpoint e fornecer a implementação.


## Migração completa da secção Garçons — pasted_content_4

- [ ] Auditar tabelas Supabase existentes, modelo de restaurante, utilizadores e relações de atendimento.
- [ ] Remover da interface o bloco de credenciais e a dependência explícita de contas Manus OAuth para adicionar garçons.
- [ ] Definir arquitectura segura para autenticação Supabase Auth sem guardar palavras-passe no PostgreSQL aplicacional.
- [ ] Criar ou adaptar a entidade `garcons` sem duplicar restaurante, utilizador ou histórico existente.
- [ ] Associar garçom, utilizador Auth e restaurante com isolamento administrativo por restaurante.
- [ ] Implementar criação, listagem, edição, activação e desactivação de garçons com validações e contador real.
- [ ] Implementar login operacional Supabase Auth para garçons e bloquear contas inactivas.
- [ ] Implementar RLS/segurança de base de dados compatível com o backend actual e validar o escopo por restaurante.
- [ ] Preservar e ligar o histórico de mesas, pedidos, recibos e auditoria ao garçom sem apagar dados ao desactivar.
- [ ] Manter garçons impedidos de gerir outros garçons, QR Codes, mesas administrativas e configurações.
- [ ] Adicionar testes de schema, validação, autorização, isolamento e regressão das funcionalidades existentes.
- [ ] Validar TypeScript, suite Vitest, migração, build e fluxos desktop/mobile.
- [ ] Rever TODO, guardar checkpoint e entregar o resultado.

## Migração do Waiter Panel para Supabase Auth

- [x] Criar helper server-side para criar contas email/palavra-passe no Supabase Auth.
- [x] Criar perfil `garcons` e ligação ao utilizador legado `users` com `openId=supabase:<uuid>`.
- [x] Persistir activação/desactivação no Auth e nas tabelas locais sem apagar histórico.
- [x] Ligar listagem, criação, edição e activação/desactivação aos procedimentos tRPC administrativos.
- [x] Actualizar a interface administrativa para gerir garçons reais sem mostrar palavras-passe existentes.
- [x] Criar login dedicado `/painel/login` com email/palavra-passe via Supabase Auth.
- [x] Validar Bearer token Supabase no contexto tRPC e reutilizar o RBAC existente.
- [x] Validar TypeScript, suite Vitest completa e build de produção.
- [x] Validar visualmente a página de login em desktop.
- [ ] Validar login com uma conta real de garçom criada no Supabase e confirmar as rotas operacionais em produção.
