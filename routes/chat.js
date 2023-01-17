var express = require('express');
const { protect } = require('../authMiddleware');
const { connectDb, closeConnection } = require('../config');
var router = express.Router();
var Chat = require('../models/chatModel');
const User = require('../models/userModel');
const Message = require('../models/messageModel');

// ONE TO ONE CHAT

// Creating chat
router.post('/create', protect, async (req, res, next) => {

    try {
        console.log(req.body);
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "userId param is not Sent" });
        }

        var isChat = await Chat.find({
            isGroupChat: false,
            $and: [
                { users: { $elemMatch: { $eq: req.user._id } } },
                { users: { $elemMatch: { $eq: userId } } }
            ]
        }).populate("users", "-password").populate("latestMessage");

        isChat = await User.populate(isChat, {
            path: 'latestMessage.sender',
            select: 'name image email',
        });

        if (isChat.length > 0) {
            res.json(isChat[0]);
        } else {
            var chatData = {
                chatName: "sender",
                isGroupChat: false,
                users: [req.user._id, userId]
            };

            try {
                const createdChat = await Chat.create(chatData);

                const fullChat = await Chat.findOne({ _id: createdChat._id }).populate("users", "-password");

                res.json(fullChat);
            } catch (error) {
                console.log(error);
                return res.status(500).json({ message: "Something Wrong in Creating Chat" });
            }
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Something Went Wrong in Create Chat" });
    }
});

// Fetching Chats
router.get('/chats', protect, async (req, res, next) => {

    try {
        await Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
            .populate("users", "-password")
            .populate("groupAdmin", "-password")
            .populate("latestMessage")
            .sort({ updatedAt: -1 })
            .then(async (results) => {
                results = await User.populate(results, {
                    path: 'latestMessage.sender',
                    select: 'name image email',
                });

                res.json(results);
            })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Something Went Wrong in Chats" });
    }
});

// GROUP CHAT

// Creating a group chat
router.post('/createGroup', protect, async (req, res, next) => {

    try {
        if (!req.body.users || !req.body.name) {
            return res.status(400).json({ message: "Please fill all the fields" });
        }

        var users = JSON.parse(req.body.users);

        if (users.length < 2) {
            return res.status(400).json({ message: "More than 2 users are required to form a group chat" });
        }

        users.push(req.user);

        const groupChat = await Chat.create({
            chatName: req.body.name,
            users: users,
            isGroupChat: true,
            groupAdmin: req.user,
        });

        const fullChat = await Chat.findOne({ _id: groupChat._id })
            .populate("users", "-password")
            .populate("groupAdmin", "-password");

        res.json(fullChat);

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Something Went Wrong in Create Group Chat" });
    }
});

// Rename Group
router.put('/renameGroup', protect, async (req, res, next) => {

    try {
        const { chatId, chatName } = req.body;

        const updatedChat = await Chat.findByIdAndUpdate(
            chatId,
            {
                chatName,
            },
            {
                new: true,
            }
        ).populate("users", "-password")
            .populate("groupAdmin", "-password");

        if (!updatedChat) {
            return res.status(400).json({ message: "Chat Not Found" });
        } else {
            res.json(updatedChat);
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Something Went Wrong in Rename Group" });
    }
});

// Remove Member from Group
router.put('/removeFromGroup', protect, async (req, res, next) => {

    try {
        const { chatId, userId } = req.body;

        const removed = await Chat.findByIdAndUpdate(
            chatId,
            {
                $pull: { users: userId },
            },{
                new : true
            }
        ).populate("users", "-password")
        .populate("groupAdmin", "-password");

        if (!removed) {
            return res.status(400).json({ message: "Chat Not Found" });
        } else {
            res.json(removed);
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Something Went Wrong in Remove Group" });
    }
});

// Add Member to Group
router.put('/addToGroup', protect, async (req, res, next) => {

    try {
        const { chatId, userId } = req.body;

        const added = await Chat.findByIdAndUpdate(
            chatId,
            {
                $push: { users: userId },
            },{
                new : true
            }
        ).populate("users", "-password")
        .populate("groupAdmin", "-password");

        if (!added) {
            return res.status(400).json({ message: "Chat Not Found" });
        } else {
            res.json(added);
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Something Went Wrong in Add To Group" });
    }
});

module.exports = router;