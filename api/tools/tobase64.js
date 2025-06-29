const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({
                status: 'error',
                message: 'Text is required',
                data: null
            });
        }

        const encoded = Buffer.from(text).toString('base64');
        
        res.json({
            status: 'success',
            message: 'Text successfully encoded to Base64',
            data: {
                original: text,
                encoded: encoded,
                length: text.length,
                encodedLength: encoded.length,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error in toBase64:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            data: null
        });
    }
});

module.exports = router;