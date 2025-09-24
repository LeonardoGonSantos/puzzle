# Plano de Implementação – Busca Hierárquica por Quadrantes

## Contexto

Atualmente o app compara o embedding da peça avulsa com todas as peças recortadas do puzzle. A ideia é tornar a busca mais assertiva (e menos custosa) adicionando uma etapa hierárquica: localizar primeiro em qual região/quadrante da imagem a peça pertence, refinando progressivamente até chegar à peça exata.

## Visão Geral da Estratégia

1. **Divisão inicial grossa (12 blocos)**: ao dividir o puzzle principal geramos também 12 regiões retangulares (grade 3x4, ajustável) e guardamos embeddings médios de cada bloco.
2. **Refino recursivo**: com base no bloco identificado, dividimos aquele recorte em quatro subblocos (2x2), calculamos embeddings agregados e continuamos até chegar ao nível de peça individual.
3. **Matching final**: apenas as peças dentro do quadrante final são comparadas; se houver mais de uma candidata, aplicamos o matching detalhado original.

## Pré-requisitos e Assumptions

- Manteremos o canvas e workers atuais; a lógica hierárquica roda no `match.worker` para não travar a UI.
- Precisamos persistir metadados por bloco (ex.: `hierarchyLevel`, `parentBlockId`, `childBlockIds`, `pieceIds`).
- As regiões podem ser pré-computadas durante o split ou geradas on-demand. Recomenda-se pré-computar até um nível configurável (ex.: níveis 0, 1, 2) e derivar o nível final com o conjunto de peças.

## Estrutura de Dados Proposta

```ts
interface QuadNode {
  id: string;
  level: number; // 0 = 12 blocos iniciais, 1 = subdivisão em 4, etc.
  bounds: { x: number; y: number; width: number; height: number };
  parentId?: string;
  childIds?: string[];
  pieceIds: string[]; // apenas no último nível (peças verdadeiras)
  embeddingKey: string; // média/centroide de embeddings das peças do bloco
}
```

- Guardar os nós numa estrutura `quadTree[puzzleId] = QuadNode[]` tanto na memória quanto no IndexedDB.
- Cada vez que subdividimos um node, computamos o embedding agregado somando os embeddings das peças filhas e normalizando.

## Fluxo Detalhado

### 1. Split do Puzzle

- Após o corte padrão em peças, gerar também a hierarquia inicial:
  - Calcular bounding boxes dos 12 blocos iniciais (ajustar cortes para preencher a imagem inteira, respeitando `grid.rows`/`grid.cols`).
  - Associar peças a cada bloco via interseção de coordenadas.
  - Para cada bloco, somar embeddings das peças (ou `histogramas RGB` se embeddings ainda não estiverem disponíveis) e salvar um vetor médio.

### 2. Subdivisão recursiva

- Para cada bloco com mais de `maxPiecesPerLeaf` (ex.: > 16), subdividir em 4 subblocos:
  - Calcula limites (metade horizontal/vertical).
  - Os subblocos herdam e filtram as peças do bloco pai.
  - Gerar embedding médio e persistir.
  - Parar quando o número de peças por bloco for <= `leafThreshold` (ex.: 4) ou atingir profundidade máxima (ex.: 3 níveis: 12 -> 48 -> 192 -> peças).

### 3. Matching Hierárquico

- Fluxo no worker:
  1. Gerar embedding da peça avulsa.
  2. Comparar com os 12 blocos do nível 0; escolher o melhor (ou top-K) e aplicar threshold secundário.
  3. Para o bloco vencedor, analisar seus 4 filhos, repetir até chegar aos nós folha.
  4. No nível folha, executar matching padrão (cosine similarity) só com as peças daquele nó.
  5. Registrar o caminho percorrido para visualização (cores gradientes ou overlays).

- Em caso de empate ou score baixo, armazenar múltiplos caminhos e retornar fallback para o matching global.

## Ajustes Necessários

### Persistência / Estado

- Novas stores em `pieceStorage.ts`: `hierarchyNodes` para salvar/recuperar `QuadNode`.
- Atualizar `PuzzleImage` para ter `hierarchyDepth` e métricas de blocos.
- `puzzleStore` passa a guardar `quadPath` (caminho percorrido) para highlight incremental.

### Workers

- `split.worker`: além de devolver peças, retorna a lista de nós nível 0 (12 blocos) e dados auxiliares (dimensões, peças associadas). Pode delegar a construção da árvore completa para o main thread (após computar embeddings) ou fazer tudo dentro do worker.
- `match.worker`: implementar função `traverseQuadTree(targetEmbedding, quadTree)` que retorna `{ path: QuadNode[], candidates: PieceMatch[] }`.
- Manter a comparação final com `coseno_cosseno`; opcionalmente adicionar histograma ou edge matching para desempate.

### UI

- Atualizar `PuzzleCanvas` para mostrar overlays por nível: highlight do bloco 12, depois subbloco, etc. (camadas semi-transparentes com label `Nível 1`, `Nível 2`, ...).
- Exibir no `PieceMatcher` o caminho percorrido: lista de blocos com suas probabilidades.

## Métricas e Thresholds

- Configurar constantes:
  - `ROOT_DIVISIONS = { rows: 3, cols: 4 }` (12 blocos).
  - `SUBDIVISION_FACTOR = 2` (divide em 4 filhos).
  - `LEAF_MAX_PIECES = 4`.
  - `LEVEL_THRESHOLD = 0.6` (score mínimo por nível para prosseguir; abaixo disso cai na busca completa).
- Logar tempos de matching por nível para validar ganho de performance.

## Workflow de Implementação Sugerido

1. **Data Model** – ajustar types/interfaces e storage para suportar `QuadNode`.
2. **Split Worker** – gerar blocos iniciais + associação peça/bloco.
3. **Main Thread** – construir árvore e pré-computar embeddings agregados (pode ser lazy durante o primeiro matching).
4. **Match Worker** – implementar travessia hierárquica e retorno do caminho.
5. **UI Feedback** – destacar blocos e mostrar trilha no painel do matcher.
6. **Fallback & Configuração** – adicionar controles (on/off, thresholds) e fallback para matching tradicional.
7. **Testes** – unitários para `deriveQuadTree`, integração para travessia, testes manuais comparando desempenho/precisão.

## Riscos & Mitigações

- **Peças muito distintas dentro do bloco**: embeddings médios podem mascarar detalhes. Mitigar usando top-K blocos por nível ou armazenando mediana/cluster.
- **Custos de memória**: hierarquia pode duplicar dados em puzzles gigantes. Persistir apenas metadados e embeddings (não blobs) e gerar subblocos sob demanda.
- **Erros de arredondamento**: garantir que limites dos blocos cobrem 100% da imagem e que cada peça pertença a exatamente um filho em cada nível.

## Próximos Passos

- Validar empiricamente o tamanho ideal da grade inicial (12 pode ser ajustado para 9 ou 16 conforme o formato da imagem).
- Decidir se a construção da árvore ocorre durante o split (tempo maior upfront) ou lazy (no primeiro matching).
- Prototipar com um puzzle pequeno para medir melhoria na assertividade.
