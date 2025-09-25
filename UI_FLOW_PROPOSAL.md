# Puzzle Piece Locator – Fluxo Mobile-First com Interações Divertidas

## Estrutura Geral

- Linha do tempo com 3 telas principais (Tela 1, 2 e 3), cada uma projetada para mobile.
- Entre as transições, exibir “puzzle loader”: animação fullscreen com peça dançando + frases engraçadas (ex.: “Juntando as pontas...”).
- Stepper fixo superior (bolinhas numeradas + ícones) reforça progresso.

## Tela 1 – Escolha do Puzzle (Step 1/3)

### Layout

- **AppBar**: logo + botão ajuda (abre modal com dicas).
- **Card central** com título “Comece seu mapa 🧩”, descrição e dois botões do mesmo tamanho:
  - `📁 Enviar da galeria`
  - `📸 Tirar foto agora`
- Após selecionar, mostra thumbnail mini + texto “Perfeito! Foto carregada”.
- **CTA fixo** no rodapé: botão “Próximo” (desabilitado até ter foto).

### Interações & animações

- Botões têm hover/press com leve bounce.
- Ao selecionar foto, surge animação confete suave no card.

## Loading 1 – “Preparando grade”

- Fullscreen com fundo degradê.
- Lottie ou CSS de peça dançando girando.
- Texto cíclico: “Ajustando cantos...”, “Polindo bordas...”.

## Tela 2 – Validar foto & Peças (Step 2/3)

### Layout

- Header mostra stepper + informação “Foto pronta”.
- **Preview** da foto ocupa 60% da altura, com botão flutuante “Trocar foto”.
- Card inferior com pergunta: “Quantas peças esse puzzle tem?”
  - Input numérico + chips com sugestões (100, 500, 1000).
  - Mensagem divertida (“Quanto mais preciso, mais rápido encontramos a peça!”).
- CTA rodapé: “Gerar grade”.

### Interações & animações

- Ao tocar nos chips, input atualiza com animação vibrante.
- Quando o usuário clica “Gerar grade”, botão transforma em loader com ícone de tesoura cortando.

## Loading 2 – “Dividindo puzzle”

- Peças caindo do topo e se encaixando.
- Mensagens cíclicas (“Desmontando cuidadosamente...”, “Quase lá!”).

## Tela 3 – Puzzle Quadriculado + Enviar Peça (Step 3/3)

### Layout

- **Header**: Stepper completo + texto “Vamos encontrar sua peça!”.
- Secção principal: puzzle quadriculado com slider de zoom; toggle para mostrar/esconder grade.
- Abaixo: card “Envie sua peça” com botões (galeria/câmera) e dica (“Capture como se fosse o detetive das peças”).
- Lista Top 5 aparece após o matching com cartões horizontais.

### Interações & animações

- Ao enviar a peça, loader com peças girando e frase “Comparando quadrantes...”.
- Se encontrar: confete + highlight na grade com pulse.
- Se não encontrar: animação triste (peça abanando “não”) + CTA “Tentar novamente”.

## Considerações Adicionais

- Todo texto reforça tom divertido, incentivando o usuário a brincar com o processo.
- Para desktop, os mesmos componentes escalonam com mais espaço lateral.
