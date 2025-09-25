# Redesign da Interface PuzzleLocator

## Objetivos Gerais

- Guiar o usuário pelo fluxo completo sem fricção, com sensação de app mobile.
- Manter chamadas para ação consistentes e no mesmo local em todas as telas.
- Comunicar claramente o estado atual do processo (upload, escolha da quantidade de peças, loading, etc.).

## Componentes Persistentes

- **Rodapé fixo:** barra inferior com botão primário full width. Nas telas com múltiplas ações (upload), os botões ficam empilhados dentro do rodapé.
- **Área central responsiva:** layout centrado que escalona bem entre mobile e desktop, priorizando touch.
- **Paleta e tipografia:** manter padrão atual da marca; títulos com tom convidativo e emojis quando fizer sentido.

## Fluxo de Telas

### Tela 1 – Boas-vindas

- **Estrutura:** container centralizado com h1 `Vamos jogar? 🧩` e breve descrição opcional.
- **Rodapé:** botão primário `Enviar foto do quebra-cabeça` (full width). Ao apertar, abre seleção de imagem.
- **Estado pós-upload:** preview reduzido + confirmação textual opcional (“Foto recebida!”) acima do rodapé.

### Tela 2 – Escolher quantidade de peças

- **Título:** h2 `Quantas peças tem o seu quebra-cabeça?` com subtítulo breve incentivando precisão.
- **Conteúdo:**
  - Grid de botões com tamanhos populares (500, 1000, 2000…).
  - Campo numérico para inserção customizada que sincroniza com o botão selecionado.
  - Mensagem auxiliar (“Você pode ajustar depois!”).
- **Rodapé:** botão primário `Continuar` habilitado após seleção/entrada válida.

### Tela 3 – Loading

- **Tela fullscreen:** fundo que remete ao brand (degradê suave) e ícone animado de peça girando.
- **Texto animado:** `Preparando miniaturas brilhantes…` com variações para tornar espera divertida.
- **Transição automática** quando processamento termina, sem interação do usuário.

### Tela 4 – Mapa do quebra-cabeça

- **Navbar fixa:** logo/texto `PuzzleLocator` + ícone/menu para configurações.
- **Área principal:**
  - Exibe imagem do puzzle completo carregado com controles de zoom/opcionais.
  - Se existir, lista de peças enviadas (miniaturas) abaixo da imagem.
- **Rodapé:** botão primário `Encontrar uma peça`. Leva para Tela 5.

### Tela 5 – Upload da peça

- **Card/Modal central:** com título `Envie a peça que deseja localizar` e instruções curtas.
- **Área de upload:** dropzone + preview dinâmico da peça.
- **Rodapé:** botões empilhados:
  1. `📂 Enviar da galeria`
  2. `📸 Tirar foto agora`
- **Após envio:** botões substituídos por ação única `Confirmar` ou `Localizar peça`, preservando posição.

### Tela 6 – Lista de peças enviadas

- **Seção dedicada:** logo abaixo do puzzle na Tela 4.
- **Título:** `Peças enviadas` com contador.
- **Layout:** grade/carrossel de miniaturas clicáveis que levam o usuário à peça correspondente no mapa.
- **Rodapé:** botão primário `Enviar outra peça` para repetir fluxo.

## Microinterações e Feedback

- Estados de hover/touch consistentes com leve animação (bounce/fade).
- Loader presente nas transições com mensagens divertidas.
- Confirmações visuais (check, borda brilhante) após uploads bem-sucedidos.

## Benefícios do Modelo

- Botão primário sempre na mesma posição evita rolagem excessiva e melhora usabilidade.
- Fluxo fluido em telas pequenas, respeitando padrões de app mobile.
- Visual moderno e coerente com o posicionamento do PuzzleLocator.
