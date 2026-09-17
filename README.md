# Lexicon Scrapbook


## Chosen APIs

Both APIs are free, work without an API key, and are called through this app’s own backend so the browser does not depend on third-party CORS headers.

1. **[Free Dictionary API](https://dictionaryapi.dev/)**  
   `GET https://api.dictionaryapi.dev/api/v2/entries/en/{word}`  
   Returns definitions, part of speech, phonetics, audio, examples, and etymology when available.

2. **[](https://www.datamuse.com/api/)**  

No API key is required. Nothing secret is stored in the repo.

## Interactive features

- Search box for any English word
- Filter definitions by part of speech
- Word of the day (changes by calendar day)
- Random leaf from a small academic word stack
- Pronunciation audio when the dictionary provides it
- Margin clippings saved in `localStorage`

## Run locally

Requires Node.js 18+ (no extra packages to install).

```bash
npm start
```

or:

```bash
node server.js
```

Open [http://localhost:3000](http://localhost:3000).

The Node server in `server.js` serves `public/` and exposes:

- `GET /api/define?word=lexicon`

## Deploy (Netlify)

This project is ready for Netlify:

- Static site: `public/`
- Redirects: `/api/*` → `/.netlify/functions/:splat` (see `netlify.toml`)

Steps:

1. Push this repository to GitHub (public).
2. In Netlify, **Add new site → Import an existing project**.
3. Build settings can stay empty besides what `netlify.toml` already sets (`publish = public`, `functions = netlify/functions`).
4. Deploy and paste the live URL into Canvas along with the GitHub link.

Local Netlify emulation (optional): `npx netlify-cli dev`

## Project layout

```
lib/dictionary.js          shared fetch helpers
server.js                  local Express backend
netlify/functions/         production proxies
public/index.html          scrapbook UI
public/css/style.css
public/js/app.js
```
