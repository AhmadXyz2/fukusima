const express = require('express');
const multer = require('multer');
const { uploadToGithub } = require('./uploader');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { buffer, originalname, mimetype } = req.file;
  const result = await uploadToGithub(buffer, originalname, mimetype);

  if (result.status) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

router.get('/dl/:filename', (req, res) => {
  const filename = req.params.filename;
  res.redirect(`https://raw.githubusercontent.com/sampahdoank/fufuk/main/upload/${filename}`);
});

module.exports = router;