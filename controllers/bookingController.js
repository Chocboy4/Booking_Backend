const Booking = require('../models/Booking');
const { getUserDataFromReq } = require('../utils/authHelpers');

// Define your booking functions here
async function createBooking(req, res) {
    try {
        const userData = await getUserDataFromReq(req);
        const { place, checkIn, checkOut, numberOfGuests, name, phone, price } = req.body;
        const booking = await Booking.create({
            place, checkIn, checkOut, numberOfGuests, name, phone, price, user: userData.id
        });
        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: 'Booking failed', error: error.message });
    }
}

async function getBookings(req, res) {
    try {
        const userData = await getUserDataFromReq(req);
        const bookings = await Booking.find({ user: userData.id }).populate('place');
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching bookings', error: error.message });
    }
}

module.exports = { createBooking, getBookings };
