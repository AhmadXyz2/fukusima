const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/', async (req, res) => {
    const { q } = req.query;
    if (!q) {
        return res.status(400).json({
            error: 'Query parameter is required',
            example: '/search/yts?q=DJ malam pagi'
        });
    }

    try {
        const response = await axios.get(`https://api.vreden.my.id/api/ytplaymp3?query=${encodeURIComponent(q)}`);
        const data = response.data;

        if (!data.result?.status) {
            return res.status(404).json({ error: 'No video found.' });
        }

        const metadata = data.result.metadata;

        res.json({
            videoId: metadata.videoId,
            title: metadata.title,
            description: metadata.description,
            url: metadata.url,
            thumbnail: metadata.thumbnail,
            duration: metadata.timestamp,
            views: metadata.views,
            uploaded: metadata.ago,
            author: metadata.author?.name || 'Unknown'
        });

    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data from YouTube API', details: error.message });
    }
});

module.exports = router;