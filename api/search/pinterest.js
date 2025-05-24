const express = require('express');
const axios = require('axios');
const router = express.Router();

// Endpoint: /tools/pinterest?q=ikan
router.get('/', async (req, res) => {
    const { q } = req.query;
    if (!q) {
        return res.status(400).json({
            error: 'Query parameter is required',
            example: '/search/pinterest?q=ikan'
        });
    }

    try {
        const response = await axios.get(`https://vor-apis.biz.id/api/pin?q=${encodeURIComponent(q)}`);
        const data = response.data;

        if (!data.status || !data.data?.length) {
            return res.status(404).json({ error: 'No images found.' });
        }

        // Ambil gambar pertama (bisa juga random)
        const result = data.data[Math.floor(Math.random() * data.data.length)];

        res.json({
            image: result.image,
            source: result.source,
            uploaded_by: result.upload_by,
            fullname: result.fullname,
            followers: result.followers,
            caption: result.caption
        });

    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data from Pinterest API', details: error.message });
    }
});

module.exports = router;