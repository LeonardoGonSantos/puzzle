import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs';
import { load as loadMobileNet, type MobileNet } from '@tensorflow-models/mobilenet';

let modelPromise: Promise<MobileNet> | null = null;

const ensureBackend = async () => {
  const current = tf.getBackend();
  if (current !== 'webgl') {
    await tf.setBackend('webgl');
  }
  await tf.ready();
};

export const loadEmbeddingModel = async () => {
  if (!modelPromise) {
    await ensureBackend();
    modelPromise = loadMobileNet({ version: 1, alpha: 0.5 });
  }
  return modelPromise;
};

export const embedImageBitmap = async (bitmap: ImageBitmap) => {
  const model = await loadEmbeddingModel();
  return tf.tidy(() => {
    const tensor = tf.browser.fromPixels(bitmap).toFloat().div(255) as tf.Tensor3D;
    const resized = tf.image.resizeBilinear(tensor, [224, 224], true);
    const batched = resized.expandDims(0);
    const embedding = (
      model as unknown as {
        infer: (input: tf.Tensor, endpoint?: string) => tf.Tensor;
      }
    ).infer(batched, 'conv_preds');
    const data = embedding.dataSync();
    const vector = new Float32Array(data.length);
    vector.set(data);
    return vector;
  });
};

export const cosineSimilarity = (a: Float32Array, b: Float32Array) => {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    const av = a[i];
    const bv = b[i];
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  if (normA === 0 || normB === 0) {
    return 0;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};
