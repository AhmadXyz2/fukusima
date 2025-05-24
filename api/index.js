const config = require('../config.json');
const express = require('express');
const path = require('path');

const app = express();

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// API info endpoint
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
app.use('/search/pinterest', require('./search/pinterest'));


// Catch-all route for API documentation
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = app;
