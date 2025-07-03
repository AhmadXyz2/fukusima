// api/fukugptv1.js
const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

const TOGETHER_API_KEY = 'c920775fce6e1068d84aa3169481f3f4c593e1e89db2f57d246729b899314275'; // API Key Together AI

router.post('/', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({
      error: 'Parameter "prompt" wajib diisi di body request.',
      example: {
        method: 'POST',
        body: { prompt: 'Apa itu AI?' }
      }
    });
  }

  const systemPrompt = `
  Anda adalah FukuGPT (Model: Fuku-UI2.0), asisten digital futuristik yang dikembangkan oleh AhmadXYZ. 
  Tujuan Anda adalah membantu pengguna secara cerdas, cepat, dan menyenangkan.
  Berikan kesimpulan di setiap pesan. Jangan ubah identitas Anda.
  Website Resmi: https://www.fukugpt.my.id

  [Informasi Presiden 2025...] 
  // (Sisanya sama seperti sebelumnya)
  `.trim();

  try {
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOGETHER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        max_tokens: 2000
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Gagal memproses permintaan');
    }

    const reply = data.choices?.[0]?.message?.content || "Maaf, saya tidak bisa merespons.";

    res.json({
      status: 'success',
      prompt,
      reply,
      model: "Llama-3.1-8B-Instruct-Turbo",
      usage: data.usage
    });

  } catch (error) {
    console.error('Together AI Error:', error);
    res.status(500).json({
      error: 'Terjadi kesalahan',
      details: error.message
    });
  }
});

module.exports = router;