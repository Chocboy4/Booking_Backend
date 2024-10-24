const Place = require('../models/Place');
const { getUserDataFromReq } = require('../helpers');

async function createPlace(req, res) {
    const { token } = req.cookies;
    const { title, address, description, perks, extraInfo, checkIn, checkOut, maxGuests, price, photos } = req.body;
    const addedPhotos = photos || [];

    jwt.verify(token, process.env.JWT_SECRET, {}, async (err, userData) => {
        if (err) throw err;
        const placeDoc = await Place.create({
            owner: userData.id,
            title, address, photos: addedPhotos, description, perks, extraInfo, checkIn, checkOut, maxGuests, price,
        });
        res.json(placeDoc);
    });
}

async function updatePlace(req, res) {
    const { token } = req.cookies;
    const { id, title, address, description, perks, extraInfo, checkIn, checkOut, maxGuests, addedPhotos, price } = req.body;
    jwt.verify(token, process.env.JWT_SECRET, {}, async (err, userData) => {
        if (err) return res.status(401).json({ message: 'Unauthorized' });
        const placeDoc = await Place.findById(id);
        if (userData.id === placeDoc.owner.toString()) {
            placeDoc.set({ title, address, description, perks, extraInfo, checkIn, checkOut, maxGuests, price });
            if (addedPhotos) placeDoc.photos = addedPhotos;
            await placeDoc.save();
            res.json('ok');
        } else {
            res.status(403).json({ message: 'Permission denied' });
        }
    });
}

async function getPlace(req, res) {
    const { id } = req.params;
    const place = await Place.findById(id);
    res.json(place);
}

async function getAllPlaces(req, res) {
    const places = await Place.find();
    res.json(places);
}

module.exports = { createPlace, updatePlace, getPlace, getAllPlaces };
