const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/', async (req, res) => {
    const { emoji1, emoji2 } = req.query;
    if (!emoji1 || !emoji2) {
        return res.status(400).json({
            error: 'Both emoji1 and emoji2 parameters are required',
            example: '/search/emojimix?emoji1=😀&emoji2=😂'
        });
    }

    try {
        const response = await axios.get('https://fastrestapis.fasturl.cloud/maker/emojimix', {
            params: { emoji1, emoji2 },
            responseType: 'stream'
        });

        res.setHeader('Content-Type', 'image/png');
        response.data.pipe(res);

    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch emoji mix image', details: error.message });
    }
});

module.exports = router;