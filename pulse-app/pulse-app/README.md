# PULSE — run it locally

A small Node/Express server that serves the app and proxies calls to the
Claude API, so your API key stays on your machine and never ends up in the
browser or in page source.

## 1. Requirements

- [Node.js](https://nodejs.org) installed (v18 or newer — check with `node -v`)
- An Anthropic API key from [console.anthropic.com](https://console.anthropic.com)

## 2. Install

Open a terminal in this folder and run:

```bash
npm install
```

## 3. Add your API key

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Then open `.env` and paste in your real key:

```
ANTHROPIC_API_KEY=sk-ant-your-real-key-here
```

## 4. Run it

**macOS / Linux:**
```bash
export $(cat .env | xargs) && npm start
```

**Windows (PowerShell):**
```powershell
Get-Content .env | ForEach-Object { $n,$v = $_.Split('='); [System.Environment]::SetEnvironmentVariable($n,$v) }
npm start
```

**Or, simplest — install `dotenv` once and never think about it again:**
```bash
npm install dotenv
```
Then add this as the very first line of `server.js`:
```js
require('dotenv').config();
```
After that, `npm start` alone will always pick up your `.env` file automatically.

## 5. Open it

Go to:

```
http://localhost:3000/domain-pulse.html
```

Every time you want to use the app after this, just re-run `npm start`
(with your key available as shown above) from this folder and open that
same URL. Nothing needs reinstalling — `npm install` is a one-time step.

## What's what

- `domain-pulse.html` — the entire app (UI, themes, animations, logic)
- `server.js` — local proxy: adds your key server-side, forwards requests
  to `https://api.anthropic.com`, and serves the HTML file
- `.env` — your API key (gitignored-worthy — never commit this file or
  share it)

## Notes

- Without a valid key, the app still runs — you can browse domains and
  companies, switch themes, use the command palette, and see all the
  animations. Only the "Get latest update", "Generate AI lesson", and
  "Live Q&A" buttons need the key to work, since those call Claude.
- API usage through your own key is billed to your Anthropic account per
  their normal API pricing — check current rates at
  [anthropic.com/pricing](https://www.anthropic.com/pricing) if you plan
  to use it a lot.
