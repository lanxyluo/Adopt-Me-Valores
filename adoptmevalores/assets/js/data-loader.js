const CACHE_KEY = 'adoptmevalores:pets-cache';
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hora
const DATA_PATHS = ['/data/pets.json', './data/pets.json', '../data/pets.json'];

const FALLBACK_DATA = {
  version: '1.0.0',
  lastUpdated: '2025-10-08T12:00:00Z',
  pets: [
    { id: 'shadow-dragon', names: { en: 'Shadow Dragon', pt: 'Dragão das Sombras' }, value: 270, rarity: 'legendary', demand: 'high', trend: 'stable', emoji: '🐉', category: 'pet' },
    { id: 'bat-dragon', names: { en: 'Bat Dragon', pt: 'Dragão Morcego' }, value: 230, rarity: 'legendary', demand: 'high', trend: 'rising', emoji: '🦇', category: 'pet' },
    { id: 'giraffe', names: { en: 'Giraffe', pt: 'Girafa' }, value: 255, rarity: 'legendary', demand: 'high', trend: 'stable', emoji: '🦒', category: 'pet' },
    { id: 'frost-dragon', names: { en: 'Frost Dragon', pt: 'Dragão de Gelo' }, value: 135, rarity: 'legendary', demand: 'high', trend: 'rising', emoji: '❄️', category: 'pet' },
    { id: 'owl', names: { en: 'Owl', pt: 'Coruja' }, value: 90, rarity: 'legendary', demand: 'high', trend: 'stable', emoji: '🦉', category: 'pet' },
    { id: 'parrot', names: { en: 'Parrot', pt: 'Papagaio' }, value: 85, rarity: 'legendary', demand: 'high', trend: 'stable', emoji: '🦜', category: 'pet' },
    { id: 'evil-unicorn', names: { en: 'Evil Unicorn', pt: 'Unicórnio Maligno' }, value: 80, rarity: 'legendary', demand: 'high', trend: 'stable', emoji: '🦄', category: 'pet' },
    { id: 'crow', names: { en: 'Crow', pt: 'Corvo' }, value: 75, rarity: 'legendary', demand: 'high', trend: 'stable', emoji: '🐦‍⬛', category: 'pet' },
    { id: 'arctic-reindeer', names: { en: 'Arctic Reindeer', pt: 'Rena do Ártico' }, value: 50, rarity: 'legendary', demand: 'medium', trend: 'stable', emoji: '🦌', category: 'pet' },
    { id: 'turtle', names: { en: 'Turtle', pt: 'Tartaruga' }, value: 40, rarity: 'legendary', demand: 'medium', trend: 'stable', emoji: '🐢', category: 'pet' },
    { id: 'kangaroo', names: { en: 'Kangaroo', pt: 'Canguru' }, value: 38, rarity: 'legendary', demand: 'medium', trend: 'stable', emoji: '🦘', category: 'pet' },
    { id: 'lion', names: { en: 'Lion', pt: 'Leão' }, value: 45, rarity: 'legendary', demand: 'medium', trend: 'stable', emoji: '🦁', category: 'pet' },
    { id: 'flamingo', names: { en: 'Flamingo', pt: 'Flamingo' }, value: 25, rarity: 'ultra-rare', demand: 'medium', trend: 'stable', emoji: '🦩', category: 'pet' },
    { id: 'dalmatian', names: { en: 'Dalmatian', pt: 'Dálmata' }, value: 20, rarity: 'ultra-rare', demand: 'medium', trend: 'stable', emoji: '🐕', category: 'pet' },
    { id: 'cow', names: { en: 'Cow', pt: 'Vaca' }, value: 18, rarity: 'rare', demand: 'medium', trend: 'rising', emoji: '🐄', category: 'pet' },
    { id: 'elephant', names: { en: 'Elephant', pt: 'Elefante' }, value: 22, rarity: 'rare', demand: 'medium', trend: 'stable', emoji: '🐘', category: 'pet' },
    { id: 'pig', names: { en: 'Pig', pt: 'Porco' }, value: 15, rarity: 'rare', demand: 'medium', trend: 'stable', emoji: '🐷', category: 'pet' },
    { id: 'llama', names: { en: 'Llama', pt: 'Lhama' }, value: 12, rarity: 'uncommon', demand: 'low', trend: 'stable', emoji: '🦙', category: 'pet' },
    { id: 'chicken', names: { en: 'Chicken', pt: 'Galinha' }, value: 10, rarity: 'rare', demand: 'low', trend: 'stable', emoji: '🐔', category: 'pet' },
    { id: 'unicorn', names: { en: 'Unicorn', pt: 'Unicórnio' }, value: 8, rarity: 'legendary', demand: 'low', trend: 'falling', emoji: '🦄', category: 'pet' },
    { id: 'dragon', names: { en: 'Dragon', pt: 'Dragão' }, value: 7, rarity: 'legendary', demand: 'low', trend: 'falling', emoji: '🐉', category: 'pet' },
    { id: 'kitsune', names: { en: 'Kitsune', pt: 'Kitsune' }, value: 6, rarity: 'legendary', demand: 'low', trend: 'stable', emoji: '🦊', category: 'pet' },
    { id: 'robo-dog', names: { en: 'Robo Dog', pt: 'Cachorro Robô' }, value: 5, rarity: 'legendary', demand: 'low', trend: 'stable', emoji: '🤖', category: 'pet' },
    { id: 'king-bee', names: { en: 'King Bee', pt: 'Abelha Rei' }, value: 4, rarity: 'legendary', demand: 'low', trend: 'falling', emoji: '🐝', category: 'pet' },
    { id: 'cerberus', names: { en: 'Cerberus', pt: 'Cérbero' }, value: 3, rarity: 'legendary', demand: 'low', trend: 'stable', emoji: '🐕‍🦺', category: 'pet' },
  ],
};

let cachedDataset = null;

function isCacheValid(entry) {
  if (!entry) return false;
  const { timestamp } = entry;
  return typeof timestamp === 'number' && Date.now() - timestamp < CACHE_DURATION_MS;
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isCacheValid(parsed) ? parsed.data : null;
  } catch (error) {
    console.warn('Não foi possível ler o cache local:', error);
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
  } catch (error) {
    console.warn('Não foi possível salvar no cache local:', error);
  }
}

async function fetchData() {
  for (const path of DATA_PATHS) {
    try {
      const response = await fetch(path, { headers: { 'Cache-Control': 'no-cache' } });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn(`Falha ao buscar ${path}:`, error);
    }
  }
  throw new Error('Não foi possível carregar os dados de pets.');
}

function normalisePayload(payload) {
  if (!payload) return { pets: [], lastUpdated: null, version: null };
  return {
    pets: Array.isArray(payload.pets) ? payload.pets : [],
    lastUpdated: typeof payload.lastUpdated === 'string' ? payload.lastUpdated : null,
    version: typeof payload.version === 'string' ? payload.version : null,
  };
}

/**
 * Carrega os dados de pets com cache em localStorage e fallback embutido.
 * @returns {Promise<{version: string|null,lastUpdated: string|null,pets: Array}>}
 */
export async function loadPets() {
  if (cachedDataset) {
    return cachedDataset;
  }

  const cached = readCache();
  if (cached) {
    cachedDataset = normalisePayload(cached);
    return cachedDataset;
  }

  try {
    const data = await fetchData();
    cachedDataset = normalisePayload(data);
    writeCache(cachedDataset);
    return cachedDataset;
  } catch (error) {
    console.error(error);
    cachedDataset = normalisePayload(FALLBACK_DATA);
    return cachedDataset;
  }
}
