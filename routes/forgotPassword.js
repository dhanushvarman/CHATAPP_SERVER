const hash = require('../hash');
var express = require('express');
const { protect } = require('../authMiddleware');
const { url } = require('../config');
const generateToken = require('../generateToken');
const User = require('../models/userModel');
var router = express.Router();
var nodemailer = require('nodemailer');

/* Verify User */
router.post('/forgot', async function(req, res, next) {

  const { email } = req.body;

  if(!email){
    return res.status(404).json({message : "Email not provided"});
  }

  try {
    var user = await User.findOne({email});
    
    if(!user){
        return res.status(404).json({message : "User Not Found"});
    }

    var token = generateToken(user._id);

    const link = `${url.api}/forgot-password/reset/${token}`;

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'dhanushvarmanj66@gmail.com',
            pass: 'cmskelsyfieblemd'
        }
    });

    var mailOptions = {
        from: 'dhanushvarmanj66@gmail.com',
        to: user.email,
        subject: 'Password Reset Link',
        html: `<div><h2>RESET PASSWORD : </h2>${link}</div>`
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });

    res.json({message : "Email sent successfully"});

  } catch (error) {
    console.log(error);
    res.status(500).json({message : "Something went wrong in Forgot Password"});
  }

});

router.put('/reset',protect,async(req,res)=>{
    
    var user = req.user;

    const { password } = req.body;

    if(!user){
        return res.status(400).status({ message : "Invalid Token"});
    }

    try {
        var hashedPassword = await hash(password);

        var updateUser = await User.findByIdAndUpdate(
            user._id,
            {
                $set : { password : hashedPassword }
            }
        );

        res.json(updateUser);

    } catch (error) {
        console.log(error);
        res.status(500).json({message : "Something went wrong in Reset Password"});
    }
});

module.exports = router;
