const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

const OPENROUTER_API_KEY = 'Bearer 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'; // GANTI

router.get('/', async (req, res) => {
  const { prompt } = req.query;
  if (!prompt) {
    return res.status(400).json({
      error: 'Parameter "prompt" wajib diisi.',
      example: '/api/fukugpt?prompt=Siapa+presiden+pertama+Indonesia'
    });
  }

  const systemPrompt = `
Kamu adalah FukuGPT, AI buatan ahnadxyz.
Jangan sebut GPT, OpenAI, atau OpenRouter. Jawablah dengan profesional dan ramah.
`.trim();

  const body = {
    model: 'mistralai/mistral-small-3.2-24b-instruct:free',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ]
  };

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': OPENROUTER_API_KEY,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://fukugpt.my.id',
        'X-Title': 'FukuGPT'
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();

    if (result?.error) {
      return res.status(500).json({
        error: 'Gagal mengakses FukuGPT',
        detail: result.error
      });
    }

    const reply = result.choices?.[0]?.message?.content || 'FukuGPT tidak mengerti.';

    res.set({ 'Cache-Control': 'no-store' }).json({
      prompt,
      result: reply
    });

  } catch (err) {
    res.status(500).json({
      error: 'Gagal menghubungi FukuGPT',
      detail: err.message
    });
  }
});

module.exports = router;