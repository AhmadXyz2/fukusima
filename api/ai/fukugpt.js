const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

// API Key langsung (tidak pakai .env)
const OPENROUTER_API_KEY = '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';

router.get('/', async (req, res) => {
    const { prompt: userPrompt } = req.query;

    if (!userPrompt) {
        return res.status(400).json({
            error: 'Prompt parameter is required',
            example: '/ai/fukugpt?prompt=Siapa+nama+kamu'
        });
    }

    const systemPrompt = `
Kamu adalah FukuGPT, AI cerdas dan sopan buatan ahnadxyz.
Tugasmu adalah menjawab semua pertanyaan dengan ramah.
JANGAN pernah menyebut LuminAi, OpenAI, OpenRouter, GPT, atau model apapun. Hanya sebut dirimu FukuGPT.
Kamu tidak menyimpan riwayat percakapan dan selalu lupa setelah menjawab.
`.trim();

    const body = {
        model: "openai/gpt-3.5-turbo", // Bisa ganti ke model lain jika mau
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ]
    };

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const rawText = await response.text();

        if (!response.ok) {
            console.error('OpenRouter Error:', rawText);
            return res.status(500).json({
                error: 'Gagal mengambil respons dari FukuGPT.',
                detail: rawText
            });
        }

        const data = JSON.parse(rawText);
        const result = data.choices?.[0]?.message?.content || 'FukuGPT tidak mengerti, coba ulangi.';

        res.set({ 'Cache-Control': 'no-store' }).json({
            prompt: userPrompt,
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