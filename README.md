# Puzzle Piece Locator (Front-End)

Aplicação React + TypeScript 100% front-end que mapeia e identifica peças de um quebra-cabeça a partir de fotos. O usuário envia a imagem completa do puzzle, define a quantidade de peças, o app fatiará a foto em tiles persistidos no IndexedDB e, em seguida, permitirá subir a foto de uma peça avulsa para localizar a posição correspondente utilizando embeddings do TensorFlow.js (MobileNet).

## Principais Recursos

- Upload da foto do quebra-cabeça e definição do total de peças com sugestão automática de grade.
- Divisão da imagem em peças dentro de um Web Worker, com feedback de progresso e miniaturas persistidas localmente.
- Persistência em IndexedDB (`idb`) para blobs das peças, miniaturas e embeddings.
- Matching via TensorFlow.js (backend WebGL) com MobileNet α0.5 e cálculo de similaridade cosseno em um worker dedicado.
- Destaque visual da peça encontrada sobre a imagem original e galeria das peças mapeadas.
- Reset rápido que limpa IndexedDB, cache de embeddings e estado da aplicação.

## Stack

- Vite + React + TypeScript
- Zustand para estado global
- IndexedDB via `idb`
- Web Workers para fatiamento/matching (`split.worker.ts`, `match.worker.ts`)
- TensorFlow.js + `@tensorflow-models/mobilenet`
- ESLint + Prettier + Husky/Lint-Staged
- Vitest + Testing Library (pronto para uso) – inclui teste básico das utilitárias de grid

## Pré-Requisitos

- Node.js 20+
- npm 10+
- Navegador com suporte a WebGL / OffscreenCanvas (Chrome, Edge, Firefox, Safari recentes)

## Instalação & Scripts

```bash
npm install           # instala dependências
npm run dev           # ambiente de desenvolvimento (http://localhost:5173)
npm run build         # build de produção para dist/
npm run preview       # serve build local
npm run lint          # checa estilo/código com ESLint + Prettier
npm run test -- --run # executa testes com Vitest em modo headless
```

## Fluxo de Uso

1. Abra o app (`npm run dev`).
2. Faça upload da foto completa do quebra-cabeça e informe o total de peças.
3. Clique em "Dividir imagem" para gerar e persistir as peças (feedback em tempo real).
4. O app exibirá "Pronto, já mapeamos todas as peças" e miniaturas na galeria.
5. Envie a foto da peça isolada (upload ou câmera). O TensorFlow.js gera o embedding e compara com as peças armazenadas.
6. Ao encontrar correspondência acima do limiar (0.78), a posição será destacada em vermelho sobre a imagem final. Caso contrário, uma mensagem sugere capturar nova foto.
7. Use "Limpar tudo" para zerar estado, cache e IndexedDB.

## Estrutura Importante

- `src/hooks/usePuzzleController.ts`: orquestra uploads, workers, IndexedDB e matching.
- `src/workers/`: workers de divisão (`split.worker.ts`) e matching (`match.worker.ts`).
- `src/storage/pieceStorage.ts`: camada de acesso ao IndexedDB.
- `src/utils/embedding.ts`: inicialização do TensorFlow.js + MobileNet e geração de embeddings.
- `src/components/`: UI modular (Uploader, Matcher, Canvas, Galeria, Status).

## Observações de Performance

- Imagens maiores que 4096 px na maior dimensão são automaticamente redimensionadas antes da divisão.
- O modelo MobileNet é carregado sob demanda; a primeira execução do matching pode demorar alguns segundos até o backend WebGL inicializar.
- Embeddings das peças são calculados e cacheados sob demanda. Após a primeira consulta, matching subsequentes são significativamente mais rápidos.

## Próximos Passos Sugeridos

- Adicionar equalização/segmentação mais robusta para normalizar fotos com fundo irregular.
- Permitir ajuste manual do threshold de similaridade e visualização dos top-N candidatos.
- Implementar PWA/service worker para uso offline completo.
- Criar testes e2e (Playwright) cobrindo fluxo de upload, divisão e matching.
