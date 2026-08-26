## Cover
# Pátio Zambeze
## Estado da entrega e plano de validação prática
Apresentação de fecho operacional · Agosto de 2026

## Slide 1
# O projecto está tecnicamente pronto para validação final
- Build de produção aprovado e TypeScript sem erros.
- 48 ficheiros de teste e 139 testes Vitest aprovados.
- Versão publicada no ambiente Manus e sincronizada com o GitHub.
- Falta concluir apenas a validação prática com contas, dispositivos e dados reais do restaurante.

## Slide 2
# As funcionalidades críticas já estão implementadas
- Menu público por QR Code, categorias, pesquisa, filtros e idiomas PT/EN.
- Painel separado para Administração e Garçons, com permissões por função.
- Pedidos de clientes e pedidos manuais de garçons associados à mesa correcta.
- Recibos com impressão, PDF, partilha, segunda via e histórico.

## Slide 3
# Segurança e dados seguem regras de acesso restritas
- RLS activo nas sessões, selecções e itens de selecção.
- Funções SECURITY DEFINER restringidas a utilizadores autenticados e service_role.
- Garçons consultam e operam apenas os recibos que lhes pertencem.
- Audit Logs registam acções relevantes de autenticação, pedidos e gestão.

## Slide 4
# O fluxo de imagens recebeu as correcções finais
- Galeria e câmara aceitam JPG/JPEG, PNG e WEBP em dispositivos móveis e desktop.
- Pré-visualização antes de guardar e armazenamento persistente da referência.
- Indicador de envio com spinner, barra indeterminada e bloqueio contra duplicação.
- Imagem sincronizada entre Admin, Menu Cliente e Novo Pedido do Garçom.

## Slide 5
# O desempenho foi melhorado sem mudar a experiência principal
- Rotas internas carregadas sob demanda com React.lazy e Suspense.
- Geração de PDF separada por imports dinâmicos.
- Bundle inicial reduzido para aproximadamente 976 kB.
- O aviso restante de chunk superior a 500 kB é não bloqueante e pode ser optimizado depois.

## Slide 6
# Teste prático 1: acesso, mesas e QR Codes
- Entrar como administrador e confirmar acesso ao painel Admin.
- Entrar como garçom e confirmar redireccionamento para o painel operacional.
- Criar uma mesa real e testar o QR Code num Android e num iPhone.
- Confirmar que o QR identifica a mesa correcta e permanece permanente.

## Slide 7
# Teste prático 2: menu, imagem e pedido
- Adicionar uma fotografia JPG ou PNG a partir da galeria do telemóvel.
- Confirmar pré-visualização, progresso de envio e mensagem de sucesso.
- Actualizar a página e confirmar a imagem no Menu Cliente e no painel do Garçom.
- Fazer um pedido de cliente e outro manual, validando itens, quantidades, observações e total.

## Slide 8
# Teste prático 3: estados, recibos e permissões
- Alterar o pedido por Pendente, Em preparação, Pronto, Entregue e Concluído.
- Confirmar que o cliente recebe o estado e as notificações configuradas.
- Marcar a mesa como vista e validar nome/hora do garçom no recibo.
- Testar impressão, PDF, partilha e segunda via sem páginas em branco.

## Slide 9
# Critérios para declarar a entrega operacional
- Todos os testes práticos passam em produção sem erros de consola ou API.
- Cada garçom vê apenas as mesas e recibos autorizados.
- Imagens, pedidos e recibos permanecem correctos após actualizar ou voltar a entrar.
- O administrador confirma categorias, pratos, mesas, garçons e histórico.

## Slide 10
# Pendências conhecidas e decisão recomendada
- A protecção HaveIBeenPwned permanece desactivada no Supabase Free; requer plano Pro.
- O aviso de chunk grande não impede o funcionamento e pode ser tratado numa optimização futura.
- Recomenda-se executar primeiro o roteiro dos slides 6–8 com dados reais controlados.
- Após aprovação do responsável, iniciar a operação e manter uma cópia dos procedimentos de teste.

## Slide 11
# Próximo passo: validação presencial controlada
- Reservar uma sessão curta com administrador, garçom e dois telemóveis.
- Registar cada resultado do roteiro: passou, falhou ou requer correcção.
- Corrigir apenas problemas reproduzíveis encontrados em produção.
- Declarar a entrega operacional depois da aprovação do responsável do restaurante.
