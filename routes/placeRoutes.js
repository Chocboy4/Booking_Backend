const express = require('express');
const { createPlace, updatePlace, getPlace, getAllPlaces } = require('../controllers/placeController');

const router = express.Router();

router.post('/places', createPlace);
router.put('/places', updatePlace);
router.get('/places/:id', getPlace);
router.get('/places', getAllPlaces);

module.exports = router;
