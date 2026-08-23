// js/db.js - Gerenciador do Banco de Dados Offline do EstudAI
const DB_NAME = 'EstudAIDB';
const DB_VERSION = 3;

const MATERIAS_PADRAO = [
  'Matemática',
  'História',
  'Geografia',
  'Física',
  'Português',
  'Inglês',
  'Química'
];

export function abrirBanco() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('albuns')) {
        const storeAlbuns = db.createObjectStore('albuns', { keyPath: 'id', autoIncrement: true });
        storeAlbuns.createIndex('nome', 'nome', { unique: true });
        MATERIAS_PADRAO.forEach((nome) => {
          storeAlbuns.add({ nome, ePadrao: true, criadoEm: new Date() });
        });
      }

      if (!db.objectStoreNames.contains('imagens')) {
        const storeImagens = db.createObjectStore('imagens', { keyPath: 'id', autoIncrement: true });
        storeImagens.createIndex('albumId', 'albumId', { unique: false });
      }

      if (!db.objectStoreNames.contains('flashcards')) {
        const storeFC = db.createObjectStore('flashcards', { keyPath: 'id', autoIncrement: true });
        storeFC.createIndex('imagemId', 'imagemId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function listarAlbuns() {
  const db = await abrirBanco();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('albuns', 'readwrite');
    const store = tx.objectStore('albuns');
    const req = store.getAll();

    req.onsuccess = () => {
      let res = req.result || [];
      if (res.length === 0) {
        MATERIAS_PADRAO.forEach((nome) => {
          store.add({ nome, ePadrao: true, criadoEm: new Date() });
        });
        const reqRecarregado = store.getAll();
        reqRecarregado.onsuccess = () => resolve(reqRecarregado.result || []);
      } else {
        resolve(res);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function criarAlbum(nome) {
  const db = await abrirBanco();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('albuns', 'readwrite');
    const store = tx.objectStore('albuns');
    const req = store.add({ nome, ePadrao: false, criadoEm: new Date() });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function deletarAlbum(id) {
  const db = await abrirBanco();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('albuns', 'readwrite');
    const store = tx.objectStore('albuns');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function salvarImagem(dadosBase64, albumId = null, titulo = 'Nova Foto') {
  const db = await abrirBanco();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('imagens', 'readwrite');
    const store = tx.objectStore('imagens');
    const fotoObj = {
      base64: dadosBase64,
      albumId: albumId,
      titulo: titulo,
      transcricao: 'Texto detectado automaticamente na imagem da lousa/resumo.',
      criadoEm: new Date()
    };
    const req = store.add(fotoObj);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function MoverImagemDePasta(imagemId, novoAlbumId) {
  const db = await abrirBanco();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('imagens', 'readwrite');
    const store = tx.objectStore('imagens');
    const reqGet = store.get(imagemId);

    reqGet.onsuccess = () => {
      const img = reqGet.result;
      if (img) {
        img.albumId = novoAlbumId;
        store.put(img);
        resolve();
      }
    };
    reqGet.onerror = () => reject(reqGet.error);
  });
}

export async function listarImagensPorAlbum(albumId = null) {
  const db = await abrirBanco();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('imagens', 'readonly');
    const store = tx.objectStore('imagens');
    const req = store.getAll();

    req.onsuccess = () => {
      const todas = req.result || [];
      const filtradas = todas.filter(img => img.albumId === albumId);
      resolve(filtradas);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deletarImagem(imagemId) {
  const db = await abrirBanco();
  await limparFlashcardsDaImagem(imagemId);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('imagens', 'readwrite');
    const store = tx.objectStore('imagens');
    const req = store.delete(imagemId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// --- FLASHCARDS ---
export async function salvarFlashcard(imagemId, pergunta, resposta) {
  const db = await abrirBanco();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('flashcards', 'readwrite');
    const store = tx.objectStore('flashcards');
    const fc = { imagemId, pergunta, resposta, criadoEm: new Date() };
    const req = store.add(fc);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function listarFlashcardsPorImagem(imagemId) {
  const db = await abrirBanco();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('flashcards', 'readonly');
    const store = tx.objectStore('flashcards');
    const req = store.getAll();

    req.onsuccess = () => {
      const todos = req.result || [];
      const filtrados = todos.filter(fc => fc.imagemId === imagemId);
      resolve(filtrados);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deletarFlashcard(id) {
  const db = await abrirBanco();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('flashcards', 'readwrite');
    const store = tx.objectStore('flashcards');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function limparFlashcardsDaImagem(imagemId) {
  const db = await abrirBanco();
  const cards = await listarFlashcardsPorImagem(imagemId);
  const tx = db.transaction('flashcards', 'readwrite');
  const store = tx.objectStore('flashcards');
  cards.forEach(card => store.delete(card.id));
}