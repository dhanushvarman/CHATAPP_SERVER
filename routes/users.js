var express = require('express');
const { connectDb, closeConnection } = require('../config');
const generateToken = require('../generateToken');
var router = express.Router();
var bcrypt = require('bcrypt');
const hash = require('../hash');
const { protect } = require('../authMiddleware');
var mongodb = require('mongodb');
const User = require('../models/userModel');

//Registering User
router.post('/register', async (req, res, next) => {

  try {

    var { name, email, password, image } = req.body;

    const userExist = await User.findOne({ email });

    if (userExist) {
      return res.status(400).json({ message: "User Already Exists" });
    }

    const pass = await hash(password);
    password = pass;

    const user = await User.create({
      name,
      email,
      password,
      image,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        token: generateToken(user._id),
        message: "User Created Successfully",
      });
    } else {
      return res.status(500).json({ message: "User Failed to Create" });
    }

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something Went Wrong in Register" });
  }
})

//Login 
router.post('/login', async (req, res, next) => {

  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user) {
      const compare = await bcrypt.compare(password, user.password);
      if (compare) {
        res.status(201).json({
          _id: user._id,
          name: user.name,
          email: user.email,
          image: user.image,
          token: generateToken(user._id),
          message: "User Created Successfully",
        });
      } else {
        return res.status(401).json({ message: "Username/Password Incorrect" });
      }
    } else {
      return res.status(401).json({ message: "Username/Password Incorrect" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something Went Wrong in Login" });
  }
});

// Search User
router.get('/user', protect, async (req, res, next) => {

  try {
    const keyword = req.query.search
      ? {
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } }
        ]
      }
      : {};

    const users = await User.find(keyword).find({_id : {$ne : req.user._id}});

    res.json(users);

  } catch (error) {
    console.log(error);
  }
})

module.exports = router;
