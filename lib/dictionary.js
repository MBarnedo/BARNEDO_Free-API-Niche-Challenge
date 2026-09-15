const DICTIONARY_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";
const DATAMUSE_URL = "https://api.datamuse.com/words";
const cache = new Map();

function cached(key, loader) {
  if (cache.has(key)) return cache.get(key);
  const pending = loader().then(
    (result) => {
      cache.set(key, Promise.resolve(result));
      return result;
    },
    (error) => {
      cache.delete(key);
      throw error;
    }
  );
  cache.set(key, pending);
  return pending;
}

function timedFetch(url) {
  return fetch(url, { signal: AbortSignal.timeout(12000) });
}

function sanitizeWord(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z'\- ]/g, "")
    .slice(0, 64);
}

async function fetchDefinition(word) {
  const clean = sanitizeWord(word);
  if (!clean) {
    return { status: 400, body: { title: "Blank slip", message: "Write a word first." } };
  }

  const response = await cached(`define:${clean}`, () => timedFetch(DICTIONARY_URL + encodeURIComponent(clean)));
  const data = await response.clone().json().catch(() => ({}));

  if (!response.ok) {
    if (response.status !== 404) cache.delete(`define:${clean}`);
    return {
      status: response.status === 404 ? 404 : 502,
      body: {
        title: data.title || "Not in this lexicon",
        message: data.message || `No entry found for “${clean}”.`,
        word: clean,
      },
    };
  }

  return { status: 200, body: data };
}

async function fetchRelated(word) {
  const clean = sanitizeWord(word);
  if (!clean) {
    return { status: 400, body: { title: "Blank slip", message: "Write a word first." } };
  }

  const [synonyms, similar, rhymes] = await cached(`related:${clean}`, () =>
    Promise.all([
      timedFetch(`${DATAMUSE_URL}?rel_syn=${encodeURIComponent(clean)}&max=8`).then((r) => r.json()),
      timedFetch(`${DATAMUSE_URL}?ml=${encodeURIComponent(clean)}&max=8`).then((r) => r.json()),
      timedFetch(`${DATAMUSE_URL}?rel_rhy=${encodeURIComponent(clean)}&max=6`).then((r) => r.json()),
    ])
  );

  return {
    status: 200,
    body: {
      word: clean,
      synonyms: synonyms.map((item) => item.word),
      similar: similar.map((item) => item.word),
      rhymes: rhymes.map((item) => item.word),
    },
  };
}

module.exports = { sanitizeWord, fetchDefinition, fetchRelated };
