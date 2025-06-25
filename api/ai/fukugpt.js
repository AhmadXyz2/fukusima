const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

const GROQ_API_KEY = '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'; // Ganti jika perlu

router.get('/', async (req, res) => {
  const { prompt } = req.query;
  if (!prompt) {
    return res.status(400).json({
      error: 'Parameter "prompt" wajib diisi.',
      example: '/api/fukugpt?prompt=Apa+itu+AI'
    });
  }

  const systemPrompt = `
Kamu adalah FukuGPT, AI cepat dan pintar buatan ahnadxyz.
Jangan sebut GPT, OpenAI, atau Groq. Jawablah dengan profesional dan ramah.
`.trim();

  const body = {
    model: 'llama3-70b-8192', // atau 'llama3-8b-8192' untuk versi ringan
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ]
  };

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();

    if (result?.error) {
      return res.status(500).json({
        error: 'Gagal mengakses GroqGPT',
        detail: result.error
      });
    }

    const reply = result.choices?.[0]?.message?.content || 'GroqGPT tidak mengerti.';

    res.set({ 'Cache-Control': 'no-store' }).json({
      prompt,
      result: reply
    });

  } catch (err) {
    res.status(500).json({
      error: 'Gagal menghubungi GroqGPT',
      detail: err.message
    });
  }
});

module.exports = router;