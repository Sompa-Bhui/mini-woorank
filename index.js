const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(express.json());

// NEW: root route
app.get('/', (req, res) => {
  res.send('Mini Woorank backend is running');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/analyze', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'url is required' });
  }

  try {
    const response = await axios.get(url, { timeout: 8000 });
    const html = response.data;
    const $ = cheerio.load(html);

    const title = $('title').text().trim();
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const h1Count = $('h1').length;
    const pageSize = Buffer.byteLength(html, 'utf8');

    let score = 100;
    if (!title) score -= 20;
    if (!metaDesc) score -= 20;
    if (h1Count === 0) score -= 20;
    if (pageSize > 500000) score -= 10;

    res.json({
      url,
      title_present: !!title,
      meta_description_present: !!metaDesc,
      h1_count: h1Count,
      page_size_bytes: pageSize,
      score
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch or analyze URL' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
