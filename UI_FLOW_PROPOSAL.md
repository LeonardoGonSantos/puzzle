# Puzzle Piece Locator – Fluxo Visual & Layout (Mobile-First + Fun Mood)

## Objetivo

Entregar uma jornada em etapas muito visual, com vibe divertida e temática de quebra-cabeça. A experiência deve incentivar o usuário a enviar ou tirar foto na hora, mostrar progresso com animações (confetes, peças dançantes) e fornecer feedback claro em cada fase.

## Steps & Interações

1. **Step 1 – Escolher Foto do Puzzle**
   - **Opções**: `Enviar foto da galeria` ou `Tirar foto agora` (botões lado a lado, com ícones de pasta e câmera).
   - **Visual**: card com fundo lúdico (peças semi-transparentes) e animação leve quando a foto é selecionada (peças girando).
   - **Extras**: link “Dicas rápidas” abre bottom sheet com checklist (boa iluminação, ângulo superior).
   - **CTA**: “Continuar para grade”.

2. **Step 2 – Ajustar Grade Inicial**
   - **Preview**: puzzle preenchendo a tela, overlay da grade 3x4 com bordas coloridas.
   - **Ações**: slider para ajustar linhas/colunas, botão “Auto-ajustar” (animação de peças se encaixando).
   - **Feedback**: badge “Grade pronta!” com micro-confete quando validado.
   - **CTA**: “Dividir puzzle”.

3. **Step 3 – Dividir Peças & Armazenar**
   - **Timeline**: barra de progresso com checkpoints (“Cortando”, “Gerando miniaturas”, “Salvando”).
   - **Animação**: conforme peças são processadas, mini thumbnails saltam para o grid com efeito bounce.
   - **Ações**: “Ver detalhes da divisão” abre modal com estatísticas (tempo, tamanho médio das peças).
   - **CTA**: “Ir para localizar peça”.

4. **Step 4 – Enviar/Tirar Foto da Peça**
   - **Dual CTA**: `Enviar foto da peça` (abre picker) e `Tirar foto agora` (ativação de câmera com overlay guia em formato de puzzle).
   - **Mensagens**: dicas gamificadas (“Capture como se fosse um detetive!”).
   - **Loading**: animação de peças girando formando um coração enquanto o worker trabalha.
   - **CTA**: “Analisar peça”.

5. **Step 5 – Resultado & Celebração**
   - **Visual**: puzzle com highlight da peça; Top 5 candidatos aparece como cartões coloridos com medalhas.
   - **Confete**: se score > 85%, disparar confete (CSS ou Lottie) e mensagem “Encontramos a peça! 🧩✨”.
   - **Fallback**: score baixo → mensagem bem-humorada, ex.: “Hmm… essa peça fugiu! Tente outra foto 😉”.
   - **Ações**: “Salvar imagem”, “Compartilhar com amigos”, “Tentar novamente”.

## Layout & Estilo (Mobile-First)

- **Stepper fixo** no topo com ícones decorativos (peça, grade, tesoura, câmera, medalha).
- **Cards modulares** com fundos gradientes (ex.: azul/roxo) e texturas de puzzle.
- **CTAs sticky** no rodapé (botões grandes com cantos 24px).
- **Paleta**: Azul (#2563EB), Amarelo (#FACC15) para destaques, Roxo (#7C3AED) para diversão.
- **Tipografia**: Inter + destaque com fonte script divertida (para headings curtos).

## Animações & Microinterações

- Upload: animação “peça flutuando” até encaixar no card.
- Progresso: confete digital quando etapas são completadas.
- Estados vazios: ilustrações de peças sorridentes.
- Humor: tooltips com frases (“Peças unidas jamais serão vencidas!”).

## Versão Desktop

- Layout 12 colunas: 4 para stepper, 8 para conteúdo.
- Cards expandidos; grid de peças com efeito hover.
- Side panel com log da hierarquia opcional (timeline vertical).

## Próximos Passos

1. Produzir wireframes mobile/desktop com stepper divertido e CTAs duplos (upload/câmera).
2. Definir assets animados (Lottie ou CSS) e gatilhos de confete.
3. Planejar estados offline/erro com mensagens leves.
4. Documentar tokens de design (cores, espaçamentos, animações) para handoff.
