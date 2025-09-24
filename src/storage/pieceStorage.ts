import { openDB, type DBSchema } from 'idb';

const DB_NAME = 'puzzle-piece-store';
const DB_VERSION = 2;

import type { HierarchyNode } from '../types/puzzle';

interface PieceStore extends DBSchema {
  pieces: {
    key: string;
    value: Blob;
  };
  thumbnails: {
    key: string;
    value: Blob;
  };
  embeddings: {
    key: string;
    value: Float32Array;
  };
  hierarchies: {
    key: string;
    value: HierarchyNode[];
  };
}

let dbPromise: Promise<import('idb').IDBPDatabase<PieceStore>> | null = null;

const getDb = () => {
  if (!dbPromise) {
    dbPromise = openDB<PieceStore>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains('pieces')) {
          database.createObjectStore('pieces');
        }
        if (!database.objectStoreNames.contains('thumbnails')) {
          database.createObjectStore('thumbnails');
        }
        if (!database.objectStoreNames.contains('embeddings')) {
          database.createObjectStore('embeddings');
        }
        if (!database.objectStoreNames.contains('hierarchies')) {
          database.createObjectStore('hierarchies');
        }
      },
    });
  }
  return dbPromise;
};

export const savePieceBlob = async (key: string, blob: Blob) => {
  const db = await getDb();
  await db.put('pieces', blob, key);
};

export const loadPieceBlob = async (key: string) => {
  const db = await getDb();
  return db.get('pieces', key);
};

export const saveThumbnailBlob = async (key: string, blob: Blob) => {
  const db = await getDb();
  await db.put('thumbnails', blob, key);
};

export const loadThumbnailBlob = async (key: string) => {
  const db = await getDb();
  return db.get('thumbnails', key);
};

export const saveEmbedding = async (key: string, embedding: Float32Array) => {
  const db = await getDb();
  await db.put('embeddings', embedding, key);
};

export const loadEmbedding = async (key: string) => {
  const db = await getDb();
  return db.get('embeddings', key);
};

export const clearStorage = async () => {
  const db = await getDb();
  const stores = ['pieces', 'thumbnails', 'embeddings', 'hierarchies'] as const;
  await Promise.all(stores.map((store) => db.clear(store)));
};

export const saveHierarchy = async (key: string, hierarchy: HierarchyNode[]) => {
  const db = await getDb();
  await db.put('hierarchies', hierarchy, key);
};

export const loadHierarchy = async (key: string) => {
  const db = await getDb();
  return db.get('hierarchies', key);
};
