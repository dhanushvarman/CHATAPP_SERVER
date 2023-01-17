const jwt = require('jsonwebtoken');
const { connectDb } = require('./config');
const mongodb = require('mongodb');
const User = require('./models/userModel');

const protect = async (req,res,next)=>{
    let token;

    if(
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ){
        try {
            token = req.headers.authorization.split(" ")[1];

            //Decoding Token Id
            const decoded = jwt.verify(token,process.env.JWT_SECRET);

            req.user = await User.findById(decoded.userId).select("-password");

            next();
        } catch (error) {
            console.log(error);
            res.status(500).json({ message : "Not Authorized, Token Failed"});
        }
    }

    if(!token){
        res.status(500).json({ message : "Not Authorized, No Token"});
    }
}

module.exports = { protect };