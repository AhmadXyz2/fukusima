const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

// GANTI dengan key baru dari https://openrouter.ai/keys
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
Kamu adalah FukuGPT, asisten AI buatan ahnadxyz.
Kamu HARUS selalu menyebut dirimu sebagai FukuGPT, dan tidak boleh menyebut OpenRouter, GPT, atau LuminAi.
Kamu menjawab dengan sopan, cerdas, dan tidak menyimpan riwayat chat.
`.trim();

    const body = {
        model: "openai/gpt-3.5-turbo",
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

        if (!response.ok) throw new Error('Gagal dari OpenRouter');

        const data = await response.json();
        const result = data.choices?.[0]?.message?.content || 'FukuGPT tidak paham, coba ulangi ya.';

        res.set({ 'Cache-Control': 'no-store' }).json({
            prompt: userPrompt,
            result
        });

    } catch (err) {
        console.error('FukuGPT error:', err.message);
        res.status(500).json({
            error: 'Terjadi kesalahan saat mengakses FukuGPT.'
        });
    }
});

module.exports = router;