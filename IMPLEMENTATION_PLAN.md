# Puzzle Piece Locator – Front-End Implementation Plan

## 1. Objetivo e Escopo

- Aplicação 100% front-end para mapear peças de um quebra-cabeça.
- Funcionalidades principais: upload da imagem completa, divisão em peças, cadastro local das peças, upload de peça avulsa, matching automatizado da peça com destaque visual.
- Sem backend; dados guardados em memória e IndexedDB.

## 2. Público e Resultados Esperados

- Usuário final: pessoa que possui um quebra-cabeça físico e quer descobrir onde encaixar uma peça.
- Resultado esperado: após upload da peça avulsa, apresentar a localização da peça no puzzle original com feedback visual e texto.

## 3. Requisitos Funcionais

1. Upload da imagem principal (quebra-cabeça montado ou foto de referência).
2. Campo para número de peças total (ou fatorável em linhas x colunas).
3. Botão “Dividir” que recorta a imagem original no número de peças solicitado.
4. Mensagem de sucesso após a divisão: “Pronto, já mapeamos todas as peças.”
5. Upload ou captura (via `input type="file"` com `capture`) de uma peça individual.
6. Matching automático contra as peças recortadas e feedback “Encontrei onde ela fica.” ao encontrar uma correspondência.
7. Visualização da imagem original com highlight em redor da peça correspondente.
8. Carrossel/galeria com miniaturas das peças recortadas.
9. Persistência local para reusar peças e evitar recomputar (IndexedDB).
10. Tratamento de erros (upload inválido, número de peças incompatível, matching sem resultado).

## 4. Requisitos Não Funcionais

- App responsivo (mobile-first).
- Performance: divisão e matching não devem bloquear a UI (uso de Web Workers).
- Tempo de matching alvo < 2 s para puzzles 10x10 em dispositivos medianos.
- Suporte a imagens até ~15 MP (ajustar resample se exceder limite de memória).
- Suporte offline (funciona sem rede após carregado).

## 5. Stack Técnica

- Build: Vite + React + TypeScript.
- Estado: Zustand (leve, sem boilerplate) ou alternativa com React Context.
- Persistência local: IndexedDB via biblioteca `idb`.
- Estilização: Tailwind CSS ou CSS Modules (decidir na Fase 0).
- Workers: Web Worker nativo + `comlink` para comunicação mais simples (opcional).
- Visão computacional: TensorFlow.js (`@tensorflow/tfjs` + `@tensorflow/tfjs-backend-webgl`) e modelo `@tensorflow-models/mobilenet` (versão 1.0 α 0.50 ou similar).
- Testes: Vitest + React Testing Library, Playwright para e2e.
- Lint/format: ESLint + Prettier.

## 6. Arquitetura de Componentes

- `App`: shell principal com roteamento simples ou single page.
- `PuzzleUploader`: formulário para imagem principal + número de peças + botão dividir.
- `PiecesGallery`: exibe miniaturas, estados de carregamento, resumo das peças.
- `PieceMatcher`: fluxo de upload da peça avulsa + status do matching + resultado.
- `PuzzleCanvas`: renderiza puzzle original com canvas; aplica highlight.
- `StatusBanner`: mensagens de feedback e erros.
- `SettingsPanel`: thresholds ajustáveis, resets, opções de exportação.

### Hooks/Stores

- `usePuzzleStore`: guarda imagem original, peças, status do processamento, resultados de matching.
- `useSplitWorker`: hook para orquestrar worker de divisão.
- `useMatchWorker`: hook para worker de matching.

### Workers

- `split.worker.ts`: recebe imagem base + linhas/colunas, devolve blobs/metadata.
- `match.worker.ts`: recebe peça avulsa + lista de embeddings/metadata e retorna índice melhor pontuado.

## 7. Fluxo de Dados

1. Usuário faz upload da imagem original → conversão para `ImageBitmap` → envio para worker de divisão com linhas/colunas.
2. Worker recorta a imagem usando canvas offscreen → devolve array de peças com blob, índice (row, col), bounding box e miniatura.
3. Estado é atualizado, peças persistidas em IndexedDB (para recarregar mais tarde).
4. Usuário envia peça avulsa → normalização (canvas local) → geração de embedding (TensorFlow.js) → worker de matching compara embeddings com distância cosseno + fallback histograma de cor.
5. Worker retorna melhor correspondência com score → UI exibe highlight na posição (row, col).

## 8. Divisão da Imagem (Detalhes Técnicos)

- Validar número de peças informado: tentar fatorar em linhas x colunas próximas (e.g., sqrt). Caso a multiplicação não bata exatamente, sugerir alternativas ao usuário.
- Preparar `OffscreenCanvas` no worker (fallback para `canvas` + `ImageData` se não suportado).
- Calcular `tileWidth = imageWidth / cols`, `tileHeight = imageHeight / rows`.
- Loop duplo (row, col): utiliza `drawImage` para recortar tile → `canvas.convertToBlob()` (ou `canvas.toBlob`) → retorno com `URL.createObjectURL` apenas na UI.
- Gerar miniaturas reduzidas (128 px) para visualização rápida.
- Persistir metadados: `{ id, row, col, width, height, blobKey, thumbnailKey, embedding?: number[] }`.

## 9. Matching da Peça (Detalhes Técnicos)

1. Pré-processamento: desenhar peça em canvas, aplicar `ctx.filter = 'brightness(1.1) contrast(1.05)'` ou equalização manual; remover fundo via threshold adaptativo (convertendo para escala de cinza).
2. Redimensionar para dimensões padrão do tile (do puzzle) mantendo proporção.
3. Converter para tensor (`tf.browser.fromPixels`), normalizar [0,1].
4. `mobilenet.infer(imageTensor, 'conv_preds')` para obter embedding (float32 vetor 1024 ou 512 dependendo da versão).
5. Worker guarda embeddings de cada peça recortada ao dividir (gera uma vez por peça).
6. Matching: calcular similaridade cosseno; caso empate, usar métrica auxiliar: diferença de histogramas HSV + comparação de contorno (via `MarchingSquares` simples ou `cv.Canny` se integrar OpenCV.js, opcional).
7. Definir threshold (e.g., similaridade > 0.85). Caso nenhum resultado passe, sugerir ajuste manual.

## 10. UX e Feedback

- Fluxo linear guiado por banners e botões desabilitados até completar etapas.
- Indicadores de progresso durante divisão (barra, percentual baseado na quantidade de peças processadas).
- Mensagens claras:
  - Sucesso divisão: "Pronto, já mapeamos todas as peças."
  - Sucesso matching: "Encontrei onde ela fica." com botão "Ver peça".
  - Falha matching: "Não encontramos uma peça com alta confiança. Ajuste a foto ou tente novamente." + sugestão de ajustes.
- Opção de esconder/mostrar highlight; salvar imagem com highlight (`canvas.toDataURL`).
- Carrossel com filtros (mostrar apenas peças com baixa confiança, etc.).

## 11. Plano de Implementação por Fases

### Fase 0 – Discover/UX (1-2 dias)

- Definir user flow detalhado (diagrama de estados).
- Wireframes para mobile/desktop.
- Especificar guidelines de acessibilidade (contraste, foco, ARIA labels).
- Selecionar estratégia de estilização (Tailwind x CSS Modules).

### Fase 1 – Setup (1 dia)

- Criar projeto Vite (`npm create vite@latest puzzle-app -- --template react-ts`).
- Configurar ESLint, Prettier, Vitest, husky + lint-staged.
- Instalar dependências: `zustand`, `idb`, `@tensorflow/tfjs`, `@tensorflow-models/mobilenet`, `comlink`, libs de UI (opcional).
- Implementar layout base e provider de estado.

### Fase 2 – Pipeline de Divisão (3-4 dias)

- Implementar `PuzzleUploader` com validações.
- Criar worker de divisão com OffscreenCanvas e mensageria (via `postMessage` ou `comlink`).
- Persistência em IndexedDB após retorno.
- Renderizar feedback “Pronto, já mapeamos todas as peças.”
- Testes unitários para fatoração de grid e slicing (Vitest simulando canvas com `canvas` npm ou mocks).

### Fase 3 – Visualização das Peças (2 dias)

- Implementar galeria com miniaturas e estados (carregando, erro, sucesso).
- Botões para exportar dados/limpar estado.
- Verificação de reidratação do estado a partir de IndexedDB ao recarregar a página.

### Fase 4 – Matching (4-5 dias)

- Implementar fluxo de upload da peça avulsa e pré-processamento.
- Gerar embeddings MobileNet na divisão e armazenar.
- Criar worker de matching e rotina de comparação.
- Aplicar thresholds configuráveis e fallback de histograma de cores.
- Mostrar highlight no `PuzzleCanvas`, render e overlay.
- Testes automáticos com dados mockados; medir performance.

### Fase 5 – Refinos e Observabilidade (2 dias)

- Loading states refinados, mensagens de erro.
- Métricas simples (tempo de processamento logado no console ou painel).
- Playwright smoke test (upload → split → match).
- Documentação final (README, guia de uso).

## 12. Considerações de Performance

- Lazy load dos modelos TensorFlow (carregar somente quando necessário).
- Habilitar backend WebGL (`tf.setBackend('webgl')`) com fallback para `wasm` se necessário.
- Gerenciar memória: liberar `ObjectURL` após uso, limpar blobs antigos.
- Limitar resolução da imagem original (dimensionar para máx. 4096 px no maior lado antes de dividir).

## 13. Estratégia de Testes

- Unit tests: funções utilitárias (fatoração, grid mapping, normalização de imagem) com Vitest.
- Integration tests: mocks de canvas para garantir geração de peças e embeddings.
- E2E (Playwright): cenários básicos em browsers Chromium/Firefox.
- Testes de acessibilidade (axe-core) nas principais telas.

## 14. Tarefas Detalhadas (Backlog Sugerido)

1. Setup Vite + TS + lint/test tooling.
2. Criar store global (Zustand) com tipagem.
3. Implementar UI do formulário de upload principal.
4. Desenvolver worker de divisão e integrar com UI.
5. Persistir peças no IndexedDB.
6. Construir galeria de peças com miniaturas.
7. Integrar TensorFlow.js + carregamento MobileNet (lazy).
8. Implementar pré-processamento da peça avulsa.
9. Calcular e salvar embeddings das peças durante a divisão.
10. Matching no worker usando distância cosseno.
11. Highlight visual no canvas com overlay vermelho.
12. Tratamento de erros e mensagens.
13. Função de reset/limpeza total.
14. Testes unitários e e2e básicos.
15. Documentação final e checklist de QA.

## 15. Entregáveis

- `README.md` com instruções de build/uso.
- `IMPLEMENTATION_PLAN.md` (este documento) atualizado conforme avanços.
- Wireframes e assets de UI.
- Scripts de testes automatizados.

## 16. Riscos e Mitigações

- **Performance em dispositivos fracos**: reduzir resolução automaticamente, permitir usuário escolher “modo leve”.
- **Precisão do matching**: ajustar thresholds, permitir o usuário iterar manualmente, oferecer modo debug mostrando top N matches.
- **Compatibilidade browser**: testar Chrome, Firefox, Safari; fallback quando OffscreenCanvas indisponível.

## 17. Próximos Passos Imediatos

1. Validar/ajustar requisitos com stakeholders.
2. Produzir wireframes e aprovar UX.
3. Iniciar Fase 1 (setup do projeto) com o board de tarefas criado.
