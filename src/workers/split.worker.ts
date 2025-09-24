/// <reference lib="webworker" />
import type { SplitWorkerMessage, SplitWorkerResponse, SplitPieceData } from './types';

const createTileBlob = async (
  image: ImageBitmap,
  sx: number,
  sy: number,
  width: number,
  height: number,
) => {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }
  ctx.drawImage(image, sx, sy, width, height, 0, 0, width, height);
  return canvas.convertToBlob({ type: 'image/png' });
};

const createThumbnail = async (blob: Blob, maxSize: number) => {
  const bitmap = await createImageBitmap(blob);
  const ratio = Math.min(maxSize / bitmap.width, maxSize / bitmap.height, 1);
  const width = Math.max(1, Math.round(bitmap.width * ratio));
  const height = Math.max(1, Math.round(bitmap.height * ratio));
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.convertToBlob({ type: 'image/png' });
};

const handleSplit = async (message: SplitWorkerMessage) => {
  const { grid, image, tileSize, puzzleId, thumbnailSize } = message;
  const total = grid.rows * grid.cols;
  const pieces: SplitPieceData[] = [];

  for (let row = 0; row < grid.rows; row += 1) {
    for (let col = 0; col < grid.cols; col += 1) {
      const id = `${puzzleId}-${row}-${col}`;
      const sx = Math.round(col * tileSize.width);
      const sy = Math.round(row * tileSize.height);
      const tileBlob = await createTileBlob(image, sx, sy, tileSize.width, tileSize.height);
      const thumbnailBlob = await createThumbnail(tileBlob, thumbnailSize);
      pieces.push({
        id,
        row,
        col,
        blob: tileBlob,
        thumbnail: thumbnailBlob,
        width: tileSize.width,
        height: tileSize.height,
      });
      const progress: SplitWorkerResponse = {
        type: 'split-progress',
        processed: pieces.length,
        total,
      };
      (self as DedicatedWorkerGlobalScope).postMessage(progress);
    }
  }

  image.close();

  const response: SplitWorkerResponse = {
    type: 'split-result',
    puzzleId,
    pieces,
  };
  (self as DedicatedWorkerGlobalScope).postMessage(response);
};

self.onmessage = (event: MessageEvent<SplitWorkerMessage>) => {
  const { data } = event;
  if (data.type === 'split') {
    handleSplit(data).catch((error: Error) => {
      console.error('Split worker failed', error);
      const response: SplitWorkerResponse = {
        type: 'split-error',
        message: error.message,
      };
      (self as DedicatedWorkerGlobalScope).postMessage(response);
    });
  }
};

export {}; // Make this module-safe for TS
