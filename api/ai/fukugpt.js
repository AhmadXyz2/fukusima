const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

const apiKey = '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'; // Ganti dgn key kamu
const referer = 'https://fukugpt.my.id'; // Ganti dgn domain kamu
const title = 'FukuGPT'; // Bebas

router.get('/', async (req, res) => {
  const { prompt } = req.query;

  if (!prompt) {
    return res.status(400).json({
      error: 'Prompt parameter is required',
      example: '/ai/fukugpt?prompt=Siapa+presiden+pertama+Indonesia'
    });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': referer,
        'X-Title': title,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'moonshotai/kimi-dev-72b:free',
        messages: [
          {
            role: 'system',
            content: 'Kamu adalah FukuGPT, AI buatan ahnadxyz. Kamu bukan LuminAi. Jawablah dengan ramah dan profesional.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();

    if (data?.error) {
      return res.status(500).json({
        error: 'Gagal mengakses FukuGPT',
        detail: data.error
      });
    }

    const result = data.choices?.[0]?.message?.content || 'Tidak ada balasan.';
    res.set({ 'Cache-Control': 'no-store' }).json({
      prompt,
      result
    });

  } catch (err) {
    console.error('FukuGPT Error:', err);
    res.status(500).json({
      error: 'Terjadi kesalahan saat memproses permintaan ke FukuGPT.',
      detail: err.message
    });
  }
});

module.exports = router;