const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

// Langsung masukkan API Key kamu di sini
const OPENROUTER_API_KEY = 'Bearer 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'; // GANTI dengan yang baru kamu buat

router.get('/', async (req, res) => {
    const { prompt } = req.query;

    if (!prompt) {
        return res.status(400).json({
            error: 'Parameter "prompt" wajib diisi.',
            example: '/ai/fukugpt?prompt=Siapa+nama+kamu'
        });
    }

    const systemPrompt = `
Kamu adalah FukuGPT, AI buatan ahnadxyz.
Jangan pernah menyebut nama LuminAi, GPT, ChatGPT, OpenRouter, OpenAI, atau model lain.
Jawablah dengan ramah, profesional, dan jangan simpan percakapan.
Kamu selalu melupakan chat sebelumnya setelah menjawab.
`.trim();

    const body = {
        model: 'openai/gpt-3.5-turbo',
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
                'X-Title': 'FukuGPT',
                'HTTP-Referer': 'https://fukugpt.my.id' // Opsional, bisa ganti domain kamu
            },
            body: JSON.stringify(body)
        });

        const raw = await response.text();
        if (!response.ok) {
            return res.status(500).json({
                error: 'Gagal mengakses FukuGPT',
                detail: raw
            });
        }

        const json = JSON.parse(raw);
        const reply = json.choices?.[0]?.message?.content || 'Tidak ada jawaban dari FukuGPT.';

        res.set({ 'Cache-Control': 'no-store' }).json({
            prompt,
            result: reply
        });

    } catch (err) {
        console.error('FukuGPT Error:', err.message);
        res.status(500).json({
            error: 'Terjadi kesalahan saat memproses permintaan ke FukuGPT.',
            detail: err.message
        });
    }
});

module.exports = router;