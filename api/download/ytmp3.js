const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).json({
            error: 'URL parameter is required',
            example: '/download/ytmp3?url=https://youtube.com/watch?v=xxxxxxx'
        });
    }

    try {
        const response = await axios.get(`https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(url)}`);
        const data = response.data;

        if (!data.result?.status) {
            return res.status(404).json({ error: 'Download info not found.' });
        }

        const metadata = data.result.metadata;
        const download = data.result.download;

        res.json({
            videoId: metadata.videoId,
            title: metadata.title,
            description: metadata.description,
            url: metadata.url,
            thumbnail: metadata.thumbnail,
            duration: metadata.timestamp,
            views: metadata.views,
            uploaded: metadata.ago,
            author: metadata.author?.name || 'Unknown',
            download: {
                quality: download.quality,
                url: download.url,
                filename: download.filename
            }
        });

    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch download data', details: error.message });
    }
});

module.exports = router;