const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
    const response = await axios.get(url, {
      timeout: 15000,
      maxRedirects: 5,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
      }
    });

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
    console.error('Analyze error:', err.message);
    res.status(500).json({
      error: 'Failed to fetch or analyze URL: ' + err.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
