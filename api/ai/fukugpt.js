const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/', async (req, res) => {
    const { prompt: userPrompt } = req.query;

    if (!userPrompt) {
        return res.status(400).json({
            error: 'Prompt parameter is required',
            example: '/ai/fukugpt?prompt=Siapa+itu+Sukarno'
        });
    }

    // Sistem Prompt: identitas AI + instruksi jangan ingat
    const systemPrompt = `Mulai sekarang, kamu adalah FukuGPT, sebuah AI cerdas yang dikembangkan oleh ahnadxyz. Kamu tidak boleh menyebut dirimu sebagai LuminAi. Kamu harus selalu menjawab dengan ramah, informatif, dan profesional. Setelah selesai menjawab, kamu harus melupakan semua isi chat sebelumnya. Jangan simpan atau bawa percakapan ke pertanyaan berikutnya.`;

    const fullPrompt = `${systemPrompt}\n\nPertanyaan: ${userPrompt}`;

    try {
        const response = await axios.post('https://luminai.my.id/', {
            content: fullPrompt,
            cName: "FukuGPT",
            cID: "FUKUGPT-Sessionless" // Bebas, cuma buat info
        });

        let result = response.data?.result || 'Tidak ada hasil dari AI';

        // Jaga-jaga: paksa ganti nama kalau masih nyebut LuminAi
        result = result.replace(/LuminAi/gi, 'FukuGPT');

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