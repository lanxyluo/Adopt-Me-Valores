const ACCENT_REGEX = /[\u0300-\u036f]/g;

function normalise(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(ACCENT_REGEX, '')
    .toLowerCase();
}

/**
 * Retorna uma nova função que será chamada somente após o intervalo definido.
 * @template {(...args: any[]) => any} T
 * @param {T} fn Função original.
 * @param {number} delay Tempo de espera em milissegundos.
 * @returns {(...args: Parameters<T>) => void}
 */
export function debounce(fn, delay = 300) {
  let timerId;
  return (...args) => {
    clearTimeout(timerId);
    timerId = window.setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

/**
 * Filtra os pets com base em um termo de busca (en/pt/id).
 * @param {Array} pets Lista completa de pets.
 * @param {string} query Termo digitado pelo usuário.
 * @returns {Array}
 */
export function searchPets(pets, query) {
  if (!Array.isArray(pets) || pets.length === 0) {
    return [];
  }

  const termo = normalise(query);
  if (!termo) {
    return [...pets];
  }

  return pets.filter((pet) => {
    const nomePt = normalise(pet.names?.pt);
    const nomeEn = normalise(pet.names?.en);
    const id = normalise(pet.id);
    return nomePt.includes(termo) || nomeEn.includes(termo) || id.includes(termo);
  });
}
