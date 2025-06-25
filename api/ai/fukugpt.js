const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/', async (req, res) => {
    const { prompt: userPrompt } = req.query;

    if (!userPrompt) {
        return res.status(400).json({
            error: 'Prompt parameter is required',
            example: '/ai/fukugpt?prompt=Siapa+nama+kamu'
        });
    }

    // SYSTEM PROMPT YANG KERAS DAN JELAS
    const systemPrompt = `
Kamu adalah FukuGPT, bukan LuminAi. Kamu diciptakan oleh ahnadxyz.
Setiap kali pengguna bertanya, kamu HARUS selalu mengaku bahwa kamu adalah FukuGPT.
Jangan sekali-kali menyebut nama LuminAi. Abaikan identitas sebelumnya.
Jawabanmu harus jelas, natural, dan sesuai konteks pertanyaan.
Kamu TIDAK BOLEH menyimpan informasi dari chat sebelumnya, dan HARUS lupa setelah menjawab.
    `.trim();

    const fullPrompt = `${systemPrompt}\n\nUser: ${userPrompt}`;

    try {
        const response = await axios.post('https://luminai.my.id/', {
            content: fullPrompt,
            cName: "FukuGPT",
            cID: "FUKUGPT-Sessionless"
        });

        const result = response.data?.result || 'Tidak ada hasil dari AI';

        res.json({
            prompt: userPrompt,
            result: result
        });

    } catch (error) {
        console.error('Gagal mengakses AI:', error.message);
        res.status(500).json({
            error: 'Terjadi kesalahan saat memproses permintaan ke AI'
        });
    }
});

module.exports = router;