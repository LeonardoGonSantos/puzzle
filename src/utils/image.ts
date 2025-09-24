const getCanvas = (width: number, height: number) => {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

const canvasToBlob = (canvas: OffscreenCanvas | HTMLCanvasElement) => {
  if ('convertToBlob' in canvas) {
    return (canvas as OffscreenCanvas).convertToBlob({ type: 'image/png' });
  }
  return new Promise<Blob | null>((resolve) =>
    (canvas as HTMLCanvasElement).toBlob((blob) => resolve(blob), 'image/png'),
  );
};

export const fileToDataUrl = (file: File) => readBlobAsDataUrl(file);

export const readBlobAsDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

export const fileToImageBitmap = async (file: File, maxDimension = 4096) => {
  const bitmap = await createImageBitmap(file);
  if (Math.max(bitmap.width, bitmap.height) <= maxDimension) {
    return bitmap;
  }

  const scale = maxDimension / Math.max(bitmap.width, bitmap.height);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = getCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('Canvas context unavailable for resizing');
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await canvasToBlob(canvas);
  if (!blob) {
    throw new Error('Falha ao converter imagem redimensionada');
  }
  return createImageBitmap(blob);
};

export const imageBitmapToBlob = async (bitmap: ImageBitmap) => {
  const canvas = getCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context unavailable for serialization');
  }
  ctx.drawImage(bitmap, 0, 0);
  const blob = await canvasToBlob(canvas);
  if (!blob) {
    throw new Error('Falha ao gerar blob da imagem');
  }
  return blob;
};

export const imageBitmapToDataUrl = async (bitmap: ImageBitmap) => {
  const blob = await imageBitmapToBlob(bitmap);
  return readBlobAsDataUrl(blob);
};
