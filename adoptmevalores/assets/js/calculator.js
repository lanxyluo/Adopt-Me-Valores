import { loadPets } from './data-loader.js';
import { searchPets, debounce } from './search.js';

const MAX_SUGGESTIONS = 5;

const state = {
  pets: [],
  offers: {
    you: [],
    them: [],
  },
};

const elements = {
  searchInputs: {
    you: document.querySelector('input[data-column="you"]'),
    them: document.querySelector('input[data-column="them"]'),
  },
  suggestionLists: {
    you: document.querySelector('[data-results="you"]'),
    them: document.querySelector('[data-results="them"]'),
  },
  lists: {
    you: document.querySelector('[data-list="you"]'),
    them: document.querySelector('[data-list="them"]'),
  },
  totals: {
    you: document.querySelector('[data-total="you"]'),
    them: document.querySelector('[data-total="them"]'),
  },
  banner: document.getElementById('result-banner'),
  resetButton: document.getElementById('reset-button'),
};

function formatValue(value) {
  return `${Number(value || 0)} ⭐`;
}

function renderOffer(column) {
  const container = elements.lists[column];
  if (!container) return;

  container.innerHTML = '';
  const offer = state.offers[column];

  if (offer.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'trade-empty';
    empty.textContent = 'Adicione pets aqui';
    container.appendChild(empty);
    return;
  }

  offer.forEach((pet, index) => {
    const item = document.createElement('div');
    item.className = 'trade-item';
    item.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-3xl">${pet.emoji || '🐾'}</span>
        <div>
          <p class="text-sm font-semibold text-white">${pet.names?.pt || pet.names?.en || pet.id}</p>
          <p class="text-xs text-slate-400">${pet.names?.en || ''}</p>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <span class="text-sm font-medium text-yellow-300">${formatValue(pet.value)}</span>
        <button class="trade-remove" aria-label="Remover pet">×</button>
      </div>
    `;

    item.querySelector('.trade-remove').addEventListener('click', () => {
      removePet(column, index);
    });

    container.appendChild(item);
  });
}

function updateTotals() {
  const totalYou = state.offers.you.reduce((sum, pet) => sum + (pet.value || 0), 0);
  const totalThem = state.offers.them.reduce((sum, pet) => sum + (pet.value || 0), 0);

  if (elements.totals.you) elements.totals.you.textContent = formatValue(totalYou);
  if (elements.totals.them) elements.totals.them.textContent = formatValue(totalThem);

  updateBanner(totalYou, totalThem);
}

function updateBanner(totalYou, totalThem) {
  if (!elements.banner) return;
  const banner = elements.banner;
  banner.className = '';

  if (totalYou === 0 && totalThem === 0) {
    banner.classList.add('result-neutral');
    banner.textContent = 'Adicione pets para ver o resultado da troca.';
    return;
  }

  const difference = totalThem - totalYou;
  const absDifference = Math.abs(difference);
  const reference = Math.max(totalYou, totalThem);
  const percentage = reference > 0 ? Math.round((absDifference / reference) * 100) : 0;

  if (percentage <= 5) {
    banner.classList.add('result-fair');
    banner.textContent = '✅ Troca Justa!';
    return;
  }

  if (difference > 0) {
    banner.classList.add('result-win');
    banner.textContent = `💰 Você está ganhando! - Diferença: ${absDifference} ⭐ (${percentage}%)`;
  } else {
    banner.classList.add('result-loss');
    banner.textContent = `⚠️ Você está perdendo - Diferença: ${absDifference} ⭐ (${percentage}%)`;
  }
}

function addPet(column, pet) {
  state.offers[column].push(pet);
  renderOffer(column);
  updateTotals();
}

function removePet(column, index) {
  state.offers[column].splice(index, 1);
  renderOffer(column);
  updateTotals();
}

function clearSuggestions(column) {
  const list = elements.suggestionLists[column];
  if (!list) return;
  list.innerHTML = '';
  list.classList.remove('is-visible');
}

function renderSuggestions(column, query) {
  const list = elements.suggestionLists[column];
  if (!list) return;

  const input = elements.searchInputs[column];
  if (!input) return;

  list.innerHTML = '';
  const results = searchPets(state.pets, query).slice(0, MAX_SUGGESTIONS);

  if (results.length === 0) {
    list.classList.remove('is-visible');
    return;
  }

  results.forEach((pet) => {
    const item = document.createElement('li');
    item.className = 'autocomplete-item';
    item.innerHTML = `
      <span class="text-2xl">${pet.emoji || '🐾'}</span>
      <div class="flex flex-col text-left">
        <strong class="text-sm text-white">${pet.names?.pt || pet.names?.en || pet.id}</strong>
        <span class="text-xs text-slate-400">${pet.names?.en || ''}</span>
      </div>
      <span class="text-sm font-medium text-yellow-300">${formatValue(pet.value)}</span>
    `;
    item.addEventListener('click', () => {
      addPet(column, pet);
      clearSuggestions(column);
      input.value = '';
      input.focus({ preventScroll: true });
    });
    list.appendChild(item);
  });

  list.classList.add('is-visible');
}

function setupSearch(column) {
  const input = elements.searchInputs[column];
  if (!input) return;

  const debounced = debounce((value) => renderSuggestions(column, value));

  input.addEventListener('input', (event) => {
    const value = event.target.value;
    if (!value) {
      clearSuggestions(column);
      return;
    }
    debounced(value);
  });

  input.addEventListener('focus', () => {
    if (input.value) {
      renderSuggestions(column, input.value);
    }
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      clearSuggestions(column);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (input.value) {
        const matches = searchPets(state.pets, input.value);
        if (matches.length > 0) {
          addPet(column, matches[0]);
          clearSuggestions(column);
          input.value = '';
        }
      }
    }
  });
}

function handleClickOutside(event) {
  if (event.target.closest('.trade-search')) return;
  clearSuggestions('you');
  clearSuggestions('them');
}

function resetCalculator() {
  state.offers.you = [];
  state.offers.them = [];
  renderOffer('you');
  renderOffer('them');
  updateTotals();
  clearSuggestions('you');
  clearSuggestions('them');
  if (elements.searchInputs.you) elements.searchInputs.you.value = '';
  if (elements.searchInputs.them) elements.searchInputs.them.value = '';
}

async function init() {
  try {
    const dataset = await loadPets();
    state.pets = Array.isArray(dataset.pets) ? dataset.pets : [];
  } catch (error) {
    console.error('Não foi possível carregar os pets:', error);
    state.pets = [];
  }

  renderOffer('you');
  renderOffer('them');
  updateTotals();

  setupSearch('you');
  setupSearch('them');
  elements.resetButton?.addEventListener('click', resetCalculator);
  document.addEventListener('click', handleClickOutside);
}

document.addEventListener('DOMContentLoaded', init);
