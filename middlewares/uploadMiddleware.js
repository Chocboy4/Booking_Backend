const multer = require('multer');

const photosMiddleware = multer({ dest: 'uploads/' });
module.exports = photosMiddleware;
