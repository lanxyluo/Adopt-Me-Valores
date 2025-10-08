import { loadPets } from './data-loader.js';
import { searchPets, debounce } from './search.js';

const rarityLabels = {
  legendary: 'Lendário',
  'ultra-rare': 'Ultra Raro',
  rare: 'Raro',
  uncommon: 'Incomum',
  common: 'Comum',
};

const rarityClasses = {
  legendary: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400',
  'ultra-rare': 'border-purple-500/40 bg-purple-600/10 text-purple-300',
  rare: 'border-blue-500/40 bg-blue-600/10 text-blue-300',
  uncommon: 'border-green-500/40 bg-green-600/10 text-green-300',
  common: 'border-slate-600/60 bg-slate-700/30 text-slate-300',
};

const demandInfo = {
  high: { label: 'Alta', className: 'text-green-400' },
  medium: { label: 'Média', className: 'text-yellow-400' },
  low: { label: 'Baixa', className: 'text-red-400' },
};

const trendIcons = {
  rising: '📈',
  falling: '📉',
  stable: '➡️',
};

const state = {
  pets: [],
  searchTerm: '',
  activeRarities: new Set(),
  sortOption: 'value-desc',
};

const elements = {
  grid: document.getElementById('pet-grid'),
  empty: document.getElementById('empty-state'),
  lastUpdated: document.getElementById('last-updated'),
  filters: Array.from(document.querySelectorAll('#rarity-filters [data-rarity]')),
  sortSelect: document.getElementById('sort-select'),
  searchInput: document.getElementById('search-input'),
  resetSearch: document.getElementById('reset-search'),
  resultsCount: document.getElementById('results-count'),
};

function formatValue(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '--';
  return numeric.toLocaleString('pt-BR');
}

function formatUpdatedAt(value) {
  if (!value) return '--';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' });
}

function createBadge(content, classes) {
  const span = document.createElement('span');
  span.className = `inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${classes}`;
  span.textContent = content;
  return span;
}

function createCard(pet) {
  const card = document.createElement('article');
  card.className =
    'group flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-800/80 p-6 shadow-lg transition-transform duration-200 ease-out hover:scale-105 hover:bg-slate-700/70';

  const header = document.createElement('div');
  header.className = 'flex items-start justify-between gap-3';

  const nameBlock = document.createElement('div');
  nameBlock.className = 'flex flex-col';

  const namePt = document.createElement('h2');
  namePt.className = 'text-xl font-semibold text-white';
  namePt.textContent = pet.names?.pt || pet.names?.en || pet.id;

  const nameEn = document.createElement('p');
  nameEn.className = 'text-sm text-slate-400';
  nameEn.textContent = pet.names?.en || '';

  nameBlock.append(namePt, nameEn);

  const emoji = document.createElement('div');
  emoji.className = 'text-6xl';
  emoji.textContent = pet.emoji || '🐾';

  header.append(nameBlock, emoji);

  const valueContainer = document.createElement('div');
  valueContainer.className = 'flex items-center gap-2';
  valueContainer.innerHTML = `<span class="text-4xl font-bold text-yellow-400">${formatValue(
    pet.value,
  )}</span><span class="text-xl text-yellow-300">⭐</span>`;

  const badgeContainer = document.createElement('div');
  badgeContainer.className = 'flex flex-wrap gap-2';

  const rarityKey = pet.rarity || 'common';
  badgeContainer.append(
    createBadge(
      `Raridade · ${rarityLabels[rarityKey] || rarityKey}`,
      rarityClasses[rarityKey] || rarityClasses.common,
    ),
  );

  const demandKey = demandInfo[pet.demand] || { label: 'Desconhecida', className: 'text-slate-300' };
  badgeContainer.append(
    createBadge(
      `Demanda · ${demandKey.label}`,
      `${demandKey.className} border-transparent bg-slate-900/40`,
    ),
  );

  const trend = document.createElement('div');
  trend.className = 'flex items-center gap-2 text-sm text-slate-300';
  const trendIcon = trendIcons[pet.trend] || trendIcons.stable;
  const trendLabel =
    pet.trend === 'rising' ? 'Em alta' : pet.trend === 'falling' ? 'Em queda' : 'Estável';
  trend.innerHTML = `<span class="text-lg">${trendIcon}</span><span>${trendLabel}</span>`;

  card.append(header, valueContainer, badgeContainer, trend);
  return card;
}

function updateResultsCount(count) {
  if (!elements.resultsCount) return;
  elements.resultsCount.textContent = count.toString().padStart(2, '0');
}

function renderList(pets) {
  if (!elements.grid) return;

  elements.grid.innerHTML = '';

  if (!pets || pets.length === 0) {
    if (elements.empty) {
      elements.empty.classList.remove('hidden');
      elements.empty.textContent =
        state.pets.length === 0 ? 'Erro ao carregar dados.' : '😢 Nenhum pet encontrado';
    }
    updateResultsCount(0);
    return;
  }

  elements.empty?.classList.add('hidden');
  updateResultsCount(pets.length);
  pets.forEach((pet) => elements.grid.appendChild(createCard(pet)));
}

function applyFilters() {
  const base = searchPets(state.pets, state.searchTerm);

  const filtered = base.filter((pet) => {
    if (state.activeRarities.size === 0) return true;
    const rarity = pet.rarity || 'common';
    return state.activeRarities.has(rarity);
  });

  const sorted = [...filtered];
  switch (state.sortOption) {
    case 'value-asc':
      sorted.sort((a, b) => (a.value || 0) - (b.value || 0));
      break;
    case 'name-asc':
      sorted.sort((a, b) => {
        const aName = (a.names?.pt || a.names?.en || a.id || '').toLowerCase();
        const bName = (b.names?.pt || b.names?.en || b.id || '').toLowerCase();
        return aName.localeCompare(bName);
      });
      break;
    case 'value-desc':
    default:
      sorted.sort((a, b) => (b.value || 0) - (a.value || 0));
      break;
  }

  renderList(sorted);
}

function setupFilters() {
  elements.filters.forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.rarity;
      if (!key) return;

      if (state.activeRarities.has(key)) {
        state.activeRarities.delete(key);
        button.classList.remove('is-active');
      } else {
        state.activeRarities.add(key);
        button.classList.add('is-active');
      }
      applyFilters();
    });
  });
}

function setupSort() {
  if (!elements.sortSelect) return;
  elements.sortSelect.addEventListener('change', (event) => {
    state.sortOption = event.target.value;
    applyFilters();
  });
}

function setupSearch() {
  if (!elements.searchInput) return;

  const handleSearch = debounce((value) => {
    state.searchTerm = value;
    applyFilters();
  });

  elements.searchInput.addEventListener('input', (event) => {
    handleSearch(event.target.value);
  });

  elements.searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      state.searchTerm = event.target.value;
      applyFilters();
    }
  });

  elements.resetSearch?.addEventListener('click', () => {
    elements.searchInput.value = '';
    state.searchTerm = '';
    applyFilters();
  });
}

function setLastUpdated(value) {
  if (!elements.lastUpdated) return;
  elements.lastUpdated.textContent = formatUpdatedAt(value);
}

async function init() {
  if (!elements.grid) {
    console.warn('Elemento de lista de pets não encontrado. Abortando inicialização.');
    return;
  }

  setupFilters();
  setupSort();
  setupSearch();

  try {
    const dataset = await loadPets();
    state.pets = Array.isArray(dataset.pets) ? dataset.pets : [];
    setLastUpdated(dataset.lastUpdated);
    applyFilters();
  } catch (error) {
    console.error('Erro ao carregar os dados:', error);
    renderList([]);
  }
}

document.addEventListener('DOMContentLoaded', init);
