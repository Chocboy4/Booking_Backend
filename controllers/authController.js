const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = process.env.JWT_SECRET;

async function register(req, res) {
    const { name, email, password } = req.body;
    try {
        const userDoc = await User.create({
            name,
            email,
            password: bcrypt.hashSync(password, bcryptSalt),
        });
        res.json(userDoc);
    } catch (error) {
        res.status(422).json(error);
    }
}

async function login(req, res) {
    const { email, password } = req.body;
    try {
        const userDoc = await User.findOne({ email });
        if (userDoc) {
            const passOk = bcrypt.compareSync(password, userDoc.password);
            if (passOk) {
                jwt.sign({
                    email: userDoc.email,
                    id: userDoc._id,
                    name: userDoc.name,
                }, jwtSecret, {}, (err, token) => {
                    if (err) throw err;
                    res.cookie('token', token, {
                        httpOnly: true,
                        secure: false,
                    }).json(userDoc);
                });
            } else {
                return res.status(422).json("Password not valid");
            }
        } else {
            return res.status(404).json({ status: "error", message: "User not found" });
        }
    } catch (error) {
        return res.status(500).json({ status: "error", message: "Something went wrong" });
    }
}

function logout(req, res) {
    res.cookie('token', '').json(true);
}

async function getProfile(req, res) {
    const { token } = req.cookies;
    if (token) {
        jwt.verify(token, jwtSecret, {}, async (err, userData) => {
            if (err) throw err;
            const { name, email, _id } = await User.findById(userData.id);
            res.json({ name, email, _id });
        });
    } else {
        res.json(null);
    }
}

module.exports = { register, login, logout, getProfile };
