# Direção visual — Menu Digital Restaurante

## Três caminhos considerados

### 1. Caderno de Sabores
**Very Brief Intro:** Uma leitura editorial de menu impresso contemporâneo, com papel marfim, tipografia serifada e detalhes de cozinha moçambicana. Evoca proximidade, tradição e cuidado artesanal.
**Probability:** 0.03

### 2. Pátio Solar
**Very Brief Intro:** Uma interface clara, quente e arejada, inspirada na luz dos pátios costeiros de Moçambique. A experiência combina blocos assimétricos, fotografia gastronômica e uma assinatura terracota.
**Probability:** 0.07

### 3. Noite de Mercado
**Very Brief Intro:** Um menu escuro de alto contraste, com acentos luminosos e atmosfera noturna de mercado. Dramático, intenso e mais adequado a uma experiência de jantar sofisticada.
**Probability:** 0.02

## Abordagem escolhida: Pátio Solar

### Design Movement
Modernismo tropical editorial: composição limpa e funcional, materiais visuais quentes e uma relação direta com luz natural, cerâmica e ingredientes frescos.

### Core Principles
1. **Consulta sem fricção:** o menu abre diretamente na lista, sem login, onboarding ou funcionalidades de pedido.
2. **Calor com disciplina:** marfim, verde profundo e terracota criam personalidade sem competir com os nomes e preços.
3. **Ritmo editorial:** títulos fortes, descrições curtas e espaços generosos tornam a leitura rápida no smartphone.
4. **Presencial por princípio:** a interface lembra com clareza que o pedido é feito com o garçom, sem carrinho, checkout ou chamada digital.

### Color Philosophy
O fundo marfim funciona como papel sob luz natural; o verde folha comunica frescor e confiança; o terracota introduz a energia da cozinha e serve como cor proprietária para ações e preços. A paleta foi escolhida para parecer um objeto de restaurante, não um painel administrativo.

### Layout Paradigm
Uma coluna principal estreita e confortável para leitura, com cabeçalho assimétrico: marca à esquerda, mensagem operacional à direita em telas maiores. A navegação por categorias permanece horizontal e deslizável no mobile. Os produtos usam cartões com imagem lateral ou superior conforme a largura, e detalhes abrem em modal para manter o cliente no contexto do menu.

### Signature Elements
- Símbolo solar com onda e folha, usado em tamanho visível no cabeçalho e favicon.
- Linha fina terracota e pequenas etiquetas de categoria como sinais editoriais.
- Superfícies com textura de papel e sombras suaves, sem excesso de bordas arredondadas.

### Interaction Philosophy
Cada interação deve reduzir esforço: busca atualiza imediatamente, filtros podem ser combinados, cartões inteiros são clicáveis e o modal fecha com gesto, tecla Escape ou botão de voltar. O botão “Chamar garçom” apenas exibe a instrução presencial, nunca envia uma chamada.

### Animation
Entradas discretas dos produtos com opacidade e deslocamento vertical curto, em cascata de 40 ms; estados de filtro mudam com transições de cor de até 180 ms; modal entra com escala de 0.98 e opacidade, sem escala a partir de zero. Respeitar `prefers-reduced-motion`.

### Typography System
Display: **DM Serif Display**, para o nome do restaurante, títulos de seção e nomes dos pratos. Interface e descrições: **Manrope**, em pesos 400, 500, 600 e 700, para leitura clara em telas pequenas. Preços usam Manrope 700 com números tabulares quando disponíveis.

### Brand Essence
**Um menu digital de consulta para quem quer escolher com calma e pedir com presença — direto, local e bem editado.**
Personalidade: acolhedora, solar, precisa.

### Brand Voice
Headlines são curtas e sensoriais; CTAs são verbos claros; microcopy explica o fluxo sem soar burocrática.

Exemplos:
- “Escolha o seu sabor.”
- “Para pedir, chame o garçom da sua mesa.”

### Wordmark & Logo
O wordmark usa o nome “Pátio Zambeze” em DM Serif Display com uma pequena barra terracota sob a palavra “Zambeze”. O símbolo é um sol geométrico atravessado por uma onda e finalizado com uma folha, sem texto, com presença suficiente para ser reconhecido no cabeçalho.

### Signature Brand Color
**Terracota Zambeze — `#C85A3F`**. É a cor proprietária das ações, dos preços e dos pequenos sinais de navegação, escolhida para lembrar barro cozido, especiarias e luz de fim de tarde.

## Regra de implementação
Quando surgir uma decisão visual, perguntar: “Isso reforça ou dilui o Pátio Solar?”

## Style Decisions

- Itens sem fotografia usam um fallback de marca com padrão solar, onda e folha, nunca um campo de cor anônimo.
- O menu deve quebrar a repetição da grade com regras editoriais, marcadores de categoria e pequenos momentos de leitura.
- Terracota Zambeze `#C85A3F` fica reservada para preços, ações primárias, navegação ativa e regras editoriais de destaque.
