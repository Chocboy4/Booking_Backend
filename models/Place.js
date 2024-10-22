const moongose = require('mongoose')

const placeSchema = new moongose.Schema({
    owner: {type: moongose.Schema.Types.ObjectId, ref:'User'},
    title: String,
    address: String,
    photos: [String],
    description: String,
    perks: [String],
    extraInfo: String,
    checkIn: Number,
    checkOut: Number,
    maxGuests: Number,
    price: Number
});

const PlaceModel = moongose.model('Place', placeSchema)

module.exports = PlaceModel