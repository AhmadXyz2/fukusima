const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    const { text } = req.query;
    
    if (!text) {
        return res.status(400).json({
            error: 'Text parameter is required',
            example: '/tools/tobase64?text=Hello+World'
        });
    }
    
    // Convert text to Base64
    const base64 = Buffer.from(text).toString('base64');
    
    res.json({
        original_text: text,
        base64: base64,
        length: text.length,
        encoded_length: base64.length
    });
});

module.exports = router;
