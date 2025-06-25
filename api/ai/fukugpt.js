const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/', async (req, res) => {
    const { prompt } = req.query;

    if (!prompt) {
        return res.status(400).json({
            error: 'Prompt parameter is required',
            example: '/ai/fukugpt?prompt=Siapa+itu+Sukarno'
        });
    }

    try {
        const response = await axios.post('https://luminai.my.id/', {
            content: prompt,
            cName: "S-AI",
            cID: "S-AIbAQ0HcC"
        });

        const result = response.data?.result || 'Tidak ada hasil dari AI';

        res.json({
            prompt: prompt,
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