const imageDownloader = require('image-downloader');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

async function uploadByLink(req, res) {
    try {
        const { link } = req.body;
        const newName = 'photo' + Date.now() + '.jpg';
        await imageDownloader.image({ url: link, dest: __dirname + '/../uploads/' + newName });
        res.json(newName);
    } catch (error) {
        res.status(500).json({ message: 'Image upload failed', error: error.message });
    }
}

const photosMiddleware = multer({ dest: 'uploads/' });

function upload(req, res) {
    const uploadedFiles = [];
    req.files.forEach((file) => {
        const { path: tempPath, originalname } = file;
        const ext = path.extname(originalname);
        const newPath = tempPath + ext;
        fs.rename(tempPath, newPath, (err) => {
            if (err) return res.status(500).json({ message: 'Error renaming file' });
            uploadedFiles.push(path.basename(newPath));
            if (uploadedFiles.length === req.files.length) res.json(uploadedFiles);
        });
    });
}

module.exports = { uploadByLink, upload, photosMiddleware };
