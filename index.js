const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./models/User.js');
const Place = require('./models/Place.js')
const bcrypt = require("bcryptjs");
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const connectDB  = require('./connectDb.js');
const imageDownloader = require('image-downloader')
const multer = require('multer')
const fs = require('fs')
const path = require('path');
const Booking = require('./models/Booking.js')
const axios = require('axios')

const app = express();

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = process.env.JWT_SECRET;

app.use(express.json());
app.use(cookieParser())
app.use('/uploads', express.static(__dirname+'/uploads'))
app.use(cors({
    credentials: true, // Allow credentials (cookies)
    origin: 'https://booking-frontend-lemon.vercel.app', // Your frontend URL
}));


app.get("/", async (req, res) => {
    res.status(200).json({
      message: "Hello developers from Chocboy",
    });
  });


// mongoose.connect(process.env.MONGO_URL)
//     .then(() => {
//         console.log('MongoDB connected successfully');
//     })
//     .catch((err) => {
//         console.error('MongoDB connection error:', err);
//     });

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('Error connecting to MongoDB:', err));


// connectDB()    

function getUserDataFromReq(req) {
    return new Promise((resolve, reject) => {
        jwt.verify(req.cookies.token, jwtSecret, {}, async (err, userData) => {
            if (err) throw err
            resolve(userData)
        })
    })

}

app.get('/test', (req, res) => {
    res.json('test ok');
});

app.post('/register', async (req, res) => {
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
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const userDoc = await User.findOne({ email });
        if (userDoc) {
            const passOk = bcrypt.compareSync(password, userDoc.password);
            if (passOk) {
                jwt.sign({ email: userDoc.email,
                    id: userDoc._id,
                    name : userDoc.name
                    }, jwtSecret, {}, (err, token) => {
                    if (err) throw err;
                    // Set cookie with options
                    res.cookie('token', token, {
                        httpOnly: true, // Prevent JavaScript access
                        secure: false, // Set to true if using HTTPS
                        // sameSite: 'None', 
                        // maxAge: 24 * 60 * 60 * 1000
                    }).json(userDoc); // Send user document as response
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
});

app.get('/profile', (req, res) => {
    const {token} = req.cookies
    if(token){
        jwt.verify(token, jwtSecret, {}, async(err, userData) => {
            if(err) throw err;
            const {name, email, _id} = await User.findById(userData.id)

            res.json({name, email, _id})
        })
    }else{
        res.json(null)
    }
});

app.post('/logout', (req,res) => {
    res.cookie('token', '').json(true)
})

app.post('/upload-by-link', async (req, res) => {
    try {
        const { link } = req.body;
        const newName = 'photo' + Date.now() + '.jpg'; 
        
        // Attempt to download the image
        await imageDownloader.image({
            url: link,
            dest: __dirname + '/uploads/' + newName
        });

        // If successful, respond with the new image name
        res.json(newName);
    } catch (error) {
        // If any error occurs, respond with a 500 status and the error message
        console.error(error);
        res.status(500).json({ message: 'Image upload failed', error: error.message });
    }
});


const photosMiddleware = multer({ dest: 'uploads/' });

app.post('/upload', photosMiddleware.array('photos', 100), (req, res) => {
    const uploadedFiles = [];
    
    // Use asynchronous fs operations with error handling
    req.files.forEach((file) => {
        const { path: tempPath, originalname } = file;
        const ext = path.extname(originalname); // Get the extension of the file
        const newPath = tempPath + ext;

        // Rename the file to include its original extension
        fs.rename(tempPath, newPath, (err) => {
            if (err) {
                console.error("Error renaming file:", err);
                return res.status(500).json({ message: "Error renaming file" });
            }

            // Push only the filename to uploadedFiles array
            const filename = path.basename(newPath);  // Get just the file name
            uploadedFiles.push(filename);

            // Send response only when all files have been processed
            if (uploadedFiles.length === req.files.length) {
                res.json(uploadedFiles);
            }
        });
    });
});

app.post('/places', (req, res) => {
    const { token } = req.cookies;
    const { title, address, description, perks, extraInfo, checkIn, checkOut, maxGuests, price, photos } = req.body;  // Add 'photos' to destructuring
    const addedPhotos = photos || [];  // Ensure 'addedPhotos' is defined, default to an empty array if not provided

    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) throw err;

        const placeDoc = await Place.create({
            owner: userData.id,
            title,
            address,
            photos: addedPhotos,  // Use the defined 'addedPhotos'
            description,
            perks,
            extraInfo,
            checkIn,
            checkOut,
            maxGuests,
            price
        });
        
        res.json(placeDoc);
    });
});

app.get('/user-places', (req,res) => {
    const {token} = req.cookies;
    jwt.verify(token, jwtSecret, {}, async(err, userData) => {
        const {id} = userData;
        res.json( await Place.find({owner:id}))
    })
})
app.get('/places/:id',async (req,res) => {
    const {id} = req.params;
    res.json( await Place.findById(id))
})

app.put('/places', async (req, res) => {
    const { token } = req.cookies;
    const { id, title, address, description, perks, extraInfo, checkIn, checkOut, maxGuests, addedPhotos,price,} = req.body; // addedPhotos might be undefined
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const placeDoc = await Place.findById(id);
        if (userData.id === placeDoc.owner.toString()) {
            
            // Set only the fields that are provided, conditionally update photos
            placeDoc.set({
                title, 
                address, 
                description, 
                perks, 
                extraInfo, 
                checkIn, 
                checkOut, 
                maxGuests,
                price
            });

            if (addedPhotos) {
                placeDoc.photos = addedPhotos;  // Update photos only if addedPhotos is provided
            }

            await placeDoc.save();
            res.json('ok');
        } else {
            res.status(403).json({ message: 'You do not have permission to update this place' });
        }
    });
});

app.get('/places',async (req, res) => {
    res.json( await Place.find())
})

app.post('/bookings', async(req, res) => {
    const userData = await getUserDataFromReq(req)
    const {place, checkIn, checkOut, numberOfGuests, name, phone, price}  = req.body;
     await Booking.create({
        place, checkIn, checkOut, numberOfGuests, name, phone, price, user:userData.id
    }).then((doc) => {
        res.json(doc)
    }).catch((err) => {
        throw err
    })
})



app.get('/bookings', async(req, res) => {
   const userData = await getUserDataFromReq(req)
   res.json( await Booking.find({user:userData.id}).populate('place'))
})

app.post('/verify-payment', async (req, res) => {
    const { reference } = req.body;
    const secretKey = process.env.SECRET_KEY;
  
    try {
      const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      });
  
      if (response.data.status) {
        res.status(200).json({ message: 'Payment verified successfully', data: response.data });
      } else {
        res.status(400).json({ message: 'Payment verification failed' });
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/initiate-transaction', async (req, res) => {
    const { email, amount } = req.body;  // amount should be in kobo (i.e. Naira * 100)
    const secretKey = 'sk_test_9fd0154d1168530729e2a5b1ec5699aeb92d03ff';
  
    try {
      const response = await axios.post('https://api.paystack.co/transaction/initialize', {
        email,
        amount,
      }, {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      });
  
      if (response.data.status) {
        res.status(200).json({ authorization_url: response.data.data.authorization_url });
      } else {
        res.status(400).json({ message: 'Failed to initiate transaction' });
      }
    } catch (error) {
      console.error('Error initiating transaction:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });


app.listen(4000, () => {
    console.log('Server running on port 4000');
});


// const express = require('express');
// const mongoose = require('mongoose');
// const cookieParser = require('cookie-parser');
// const cors = require('cors');
// require('dotenv').config();

// const authRoutes = require('./routes/authRoutes');
// const bookingRoutes = require('./routes/bookingRoutes');
// const placeRoutes = require('./routes/placeRoutes');
// const uploadRoutes = require('./routes/uploadRoutes');
// const paymentRoutes = require('./routes/paymentRoutes');

// const app = express();

// app.use(express.json());
// app.use(cookieParser());
// app.use(cors({ credentials: true, origin: 'https://booking-frontend-lemon.vercel.app' }));
// app.use('/uploads', express.static(__dirname + '/uploads'));


// app.get("/", async (req, res) => {
//          res.status(200).json({
//            message: "Hello developers from Chocboy",
//          });
//        });

// // Database connection
// mongoose.connect(process.env
//     .MONGO_URL);

//     // Routes
//     app.post('/api/register', async (req, res) => {
//         try {
//             // Your registration logic here (e.g., creating a user)
//         } catch (error) {
//             console.error(error); // Log the error to the console
//             res.status(500).send('Internal Server Error');
//         }
//     });
    
//     app.use('/api', authRoutes);
//     app.use('/api', bookingRoutes);
//     app.use('/api', placeRoutes);
//     app.use('/api', uploadRoutes);
//     app.use('/api', paymentRoutes);
    
//     // Start server
//     const port = process.env.PORT || 4000;
//     app.listen(port, () => {
//         console.log(`Server running on port ${port}`);
//     });
    