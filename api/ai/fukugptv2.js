const express = require('express');
const axios = require('axios');
const router = express.Router();

// Endpoint: /api/vorai?message=Halo&userID=123
router.get('/', async (req, res) => {
  const { message, userID } = req.query;

  if (!message) {
    return res.status(400).json({
      error: 'Parameter "message" wajib diisi.',
      example: '/api/fukugptv2?message=Halo&userID=123'
    });
  }

  const prompt = `Kamu adalah Vortexion AI, asisten digital cerdas buatan AhmadXyz... (lanjutan prompt panjang kamu)`; // copy full prompt kamu di sini

  const payload = {
    content: message,
    user: userID || 'guest',
    prompt: prompt
  };

  try {
    const response = await axios.post('https://luminai.my.id/', payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = response.data?.result;

    if (!result) {
      return res.status(500).json({ error: 'Jawaban dari FUKUGPT tidak tersedia.' });
    }

    res.json({
      response: result
    });

  } catch (error) {
    res.status(500).json({
      error: 'Gagal menghubungi FUKUGPT.',
      detail: error.message
    });
  }
});

module.exports = router;