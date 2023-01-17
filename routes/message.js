var express = require('express');
const { protect } = require('../authMiddleware');
const Chat = require('../models/chatModel');
const Message = require('../models/messageModel');
const User = require('../models/userModel');
var router = express.Router();


router.post('/sendMessage', protect, async(req,res,next)=>{
    
    const { content, chatId } = req.body;

    try {
        if(!content || !chatId){
            res.status(400).json({ message : "Invalid data passed into request"});
        }

        var newMessage = {
            sender : req.user._id,
            content : content,
            chat : chatId,
        };

        var message = await Message.create(newMessage);

        message = await message.populate("sender","name image");
        message = await message.populate("chat");
        message = await User.populate(message,{
            path : "chat.users",
            select : "name image email"
        });

        await Chat.findByIdAndUpdate(req.body.chatId, {
            latestMessage : message
        });

        res.json(message);
        
    } catch (error) {
        console.log(error);
        res.status(500).json({message : "Something Went Wrong in message"});
    }
});

router.get('/allMessages/:chatId', protect, async(req,res,next)=>{

    try {
        const messages = await Message.find({chat : req.params.chatId}).populate("sender","name image email").populate("chat");

        res.json(messages);

    } catch (error) {
        console.log(error);
        res.status(500).json({message : "Something Went Wrong in Fetching message"});
    }   
});

module.exports = router;
