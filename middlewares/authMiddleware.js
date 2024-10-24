const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;

exports.authMiddleware = (req, res, next) => {
    const { token } = req.cookies;
    if (token) {
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
            if (err) throw err;
            req.userData = userData;
            next();
        });
    } else {
        res.status(401).json({ message: "Unauthorized" });
    }
};
