const config = require('../config.json');
const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const { uploadToGithub } = require('./ai/fukucloud/uploader'); // pastikan path-nya benar

const app = express();

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: config.name,
    description: config.description,
    version: config.version,
    endpoints: config.endpoints
  });
});

// Import other API routes
app.use('/tools/tobase64', require('./tools/tobase64'));
app.use('/ai/fukugpt', require('./ai/fukugpt'));
app.use('/search/yts', require('./search/yts'));
app.use('/search/pinterest', require('./search/pinterest'));
app.use('/download/ytmp3', require('./download/ytmp3'));
app.use('/search/emojimix', require('./search/emojimix'));

// === UPLOADER ENDPOINT ===

// Setup multer (untuk form-data upload)
const upload = multer({
  storage: multer.memoryStorage(), // simpan di memori, tidak disimpan di disk
  limits: { fileSize: 100 * 1024 * 1024 } // batas max 100MB
});

// POST /upload
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: false, error: 'No file uploaded' });
  }

  try {
    const result = await uploadToGithub(req.file.buffer, req.file.originalname, req.file.mimetype);

    if (!result.status) {
      return res.status(500).json({ status: false, error: result.error });
    }

    res.json({
      status: true,
      message: 'File uploaded successfully!',
      filename: result.filename,
      mimetype: result.mimetype,
      github_raw_url: result.url,
      short_url: `https://fuku-cloud.my.id/upload/dl/${result.filename}`
    });

  } catch (err) {
    console.error('Upload failed:', err);
    res.status(500).json({ status: false, error: 'Upload failed' });
  }
});

// GET /upload/dl/:filename
app.get('/upload/dl/:filename', (req, res) => {
  const filename = req.params.filename;
  const rawUrl = `https://raw.githubusercontent.com/sampahdoank/fufuk/main/media/${filename}`;
  res.redirect(rawUrl);
});

// Catch-all route (for SPA or fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = app;
