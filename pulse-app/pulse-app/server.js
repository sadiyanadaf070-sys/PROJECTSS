// server.js — tiny local proxy so the browser never sees your API key
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json({ limit: '2mb' }));

// Serve the app itself (domain-pulse.html and any assets) from /public
app.use(express.static(path.join(__dirname, 'public')));

// Proxy: browser calls /api/claude, this adds the key and forwards to Anthropic
app.post('/api/claude', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set. See README.md.' });
  }
  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(502).json({ error: 'Failed to reach Anthropic API', detail: String(err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\nPULSE is running → http://localhost:${PORT}/domain-pulse.html\n`);
});
