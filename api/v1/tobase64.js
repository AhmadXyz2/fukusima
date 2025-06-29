module.exports = (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const base64 = Buffer.from(text).toString('base64');
        return res.status(200).json({ base64 });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};