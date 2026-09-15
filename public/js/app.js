const WORD_STACK = [
  "lexicon",
  "palimpsest",
  "ephemeral",
  "vellum",
  "sonder",
  "liminal",
  "petrichor",
  "serendipity",
  "folio",
  "scribble",
  "annotation",
  "margin",
  "archive",
  "inkwell",
  "codex",
  "epistle",
  "quietude",
  "hiraeth",
  "sonnet",
  "aperture",
];

const form = document.querySelector("#lookup-form");
const input = document.querySelector("#word-input");
const statusEl = document.querySelector("#status");
const entryEl = document.querySelector("#entry");
const entryWord = document.querySelector("#entry-word");
const entryPhonetic = document.querySelector("#entry-phonetic");
const entryOrigin = document.querySelector("#entry-origin");
const meaningsEl = document.querySelector("#meanings");
const posFilters = document.querySelector("#pos-filters");
const relatedEl = document.querySelector("#related");
const relatedBody = document.querySelector("#related-body");
const playAudio = document.querySelector("#play-audio");
const audioEl = document.querySelector("#pronounce");
const clippingsList = document.querySelector("#clippings-list");
const wotdWord = document.querySelector("#wotd-word");
const wotdBlurb = document.querySelector("#wotd-blurb");

let currentMeanings = [];
let activePos = "all";
let lookupToken = 0;

function dayIndex() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / 86400000);
}

function saveClippings(items) {
  localStorage.setItem("lexicon-clippings", JSON.stringify(items.slice(0, 8)));
}

function loadClippings() {
  try {
    return JSON.parse(localStorage.getItem("lexicon-clippings")) || [];
  } catch {
    return [];
  }
}

function renderClippings() {
  const items = loadClippings();
  clippingsList.innerHTML = "";
  if (!items.length) {
    const empty = document.createElement("li");
    empty.innerHTML = "<strong>empty margin</strong><span>lookups will stick here</span>";
    empty.style.cursor = "default";
    clippingsList.append(empty);
    return;
  }
  items.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${item.word}</strong><span>${item.snippet}</span>`;
    li.addEventListener("click", () => lookup(item.word));
    clippingsList.append(li);
  });
}

function addClipping(word, snippet) {
  const next = [{ word, snippet }, ...loadClippings().filter((item) => item.word !== word)];
  saveClippings(next);
  renderClippings();
}

function uniqueWords(words) {
  return [...new Set((words || []).map((word) => word.toLowerCase()))];
}

function showStatus(title, message) {
  entryEl.classList.add("hidden");
  statusEl.classList.remove("hidden");
  statusEl.innerHTML = `<p class="scribble">${title}</p><p>${message}</p>`;
}

function audioUrl(phonetics) {
  const hit = (phonetics || []).find((item) => item.audio);
  if (!hit) return "";
  return hit.audio.startsWith("//") ? `https:${hit.audio}` : hit.audio;
}

function renderMeanings() {
  const filtered =
    activePos === "all" ? currentMeanings : currentMeanings.filter((block) => block.partOfSpeech === activePos);

  meaningsEl.innerHTML = filtered
    .map((block) => {
      const defs = block.definitions
        .map((def) => {
          const example = def.example ? `<span class="example">ex. ${def.example}</span>` : "";
          return `<li>${def.definition}${example}</li>`;
        })
        .join("");
      return `<section class="meaning-block" data-pos="${block.partOfSpeech}">
        <h3>${block.partOfSpeech}</h3>
        <ol>${defs}</ol>
      </section>`;
    })
    .join("");
}

function renderFilters() {
  const parts = [...new Set(currentMeanings.map((block) => block.partOfSpeech))];
  if (parts.length < 2) {
    posFilters.hidden = true;
    posFilters.innerHTML = "";
    return;
  }
  posFilters.hidden = false;
  posFilters.innerHTML = ["all", ...parts]
    .map(
      (part) =>
        `<button type="button" data-pos="${part}" class="${part === activePos ? "active" : ""}">${part}</button>`
    )
    .join("");
}

function renderRelated(data) {
  const seen = new Set();
  const groups = [
    ["synonyms", uniqueWords(data.synonyms)],
    ["similar", uniqueWords(data.similar)],
    ["rhymes", uniqueWords(data.rhymes)],
  ]
    .map(([label, words]) => [
      label,
      words.filter((word) => {
        if (seen.has(word)) return false;
        seen.add(word);
        return true;
      }),
    ])
    .filter(([, words]) => words.length);

  if (!groups.length) {
    relatedEl.classList.add("hidden");
    return;
  }

  relatedBody.innerHTML = groups
    .map(([label, words]) => {
      const chips = words
        .map((word) => `<button type="button" class="chip" data-word="${word}">${word}</button>`)
        .join("");
      return `<p class="chip-label">${label}</p><div class="chip-row">${chips}</div>`;
    })
    .join("");
  relatedEl.classList.remove("hidden");
}

async function lookup(rawWord) {
  const word = String(rawWord || "").trim();
  if (!word) return;

  const token = ++lookupToken;
  input.value = word;
  relatedEl.classList.add("hidden");
  showStatus("turning pages…", `Looking up “${word}”.`);

  try {
// Fetch directly from Free Dictionary API
const targetUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
const defineRes = await fetch(targetUrl);
    const defineData = await defineRes.json();
    if (!defineRes.ok) {
      showStatus(defineData.title || "Not found", defineData.message || "No entry for that word.");
      return;
    }

    const entry = Array.isArray(defineData) ? defineData[0] : defineData;
    currentMeanings = entry.meanings || [];
    activePos = "all";

    entryWord.textContent = entry.word;
    entryPhonetic.textContent = entry.phonetic || entry.phonetics?.find((p) => p.text)?.text || "";
    entryOrigin.textContent = entry.origin ? `etym. ${entry.origin}` : "";

    const src = audioUrl(entry.phonetics);
    if (src) {
      audioEl.src = src;
      playAudio.classList.remove("hidden");
    } else {
      playAudio.classList.add("hidden");
    }

    renderFilters();
    renderMeanings();
    statusEl.classList.add("hidden");
    entryEl.classList.remove("hidden");

    const firstDef = currentMeanings[0]?.definitions?.[0]?.definition || "opened in the scrapbook";
    addClipping(entry.word, firstDef.slice(0, 72) + (firstDef.length > 72 ? "…" : ""));

    // Fetch related words from Datamuse API (Synonyms, Similar words, Rhymes)
    try {
      const [synRes, simRes, rhyRes] = await Promise.all([
        fetch(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(word)}&max=6`),
        fetch(`https://api.datamuse.com/words?ml=${encodeURIComponent(word)}&max=6`),
        fetch(`https://api.datamuse.com/words?rel_rhy=${encodeURIComponent(word)}&max=6`),
      ]);
      if (token !== lookupToken) return;

      const synonyms = synRes.ok ? (await synRes.json()).map((i) => i.word) : [];
      const similar = simRes.ok ? (await simRes.json()).map((i) => i.word) : [];
      const rhymes = rhyRes.ok ? (await rhyRes.json()).map((i) => i.word) : [];

      renderRelated({ synonyms, similar, rhymes });
    } catch {
      if (token !== lookupToken) return;
      relatedEl.classList.add("hidden");
    }
  } catch {
    if (token !== lookupToken) return;
    showStatus("the courier is late", "Could not reach the lexicon just now.");
  }
}

async function loadWordOfTheDay() {
  const word = WORD_STACK[dayIndex() % WORD_STACK.length];
  wotdWord.textContent = word;
  try {
// Fetch directly from Free Dictionary API
const targetUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
const response = await fetch(targetUrl);
    const data = await response.json();
    const entry = Array.isArray(data) ? data[0] : data;
    const blurb = entry.meanings?.[0]?.definitions?.[0]?.definition;
    wotdBlurb.textContent = blurb || "A word worth keeping in the margin.";
  } catch {
    wotdBlurb.textContent = "Keep this one in the margin anyway.";
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  lookup(input.value);
});

document.querySelector("#random-btn").addEventListener("click", () => {
  const word = WORD_STACK[Math.floor(Math.random() * WORD_STACK.length)];
  lookup(word);
});

document.querySelector("#wotd-open").addEventListener("click", () => {
  lookup(wotdWord.textContent);
});

document.querySelector("#clear-clippings").addEventListener("click", () => {
  saveClippings([]);
  renderClippings();
});

posFilters.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-pos]");
  if (!button) return;
  activePos = button.dataset.pos;
  renderFilters();
  renderMeanings();
});

relatedBody.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-word]");
  if (!chip) return;
  lookup(chip.dataset.word);
});

playAudio.addEventListener("click", () => {
  audioEl.play().catch(() => {});
});

renderClippings();
loadWordOfTheDay();
loadWordOfTheDay();
