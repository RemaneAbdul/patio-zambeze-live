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
