const express = require('express');
const { uploadByLink, upload, photosMiddleware } = require('../controllers/uploadController');

const router = express.Router();

router.post('/upload-by-link', uploadByLink);
router.post('/upload', photosMiddleware.array('photos', 100), upload);

module.exports = router;
