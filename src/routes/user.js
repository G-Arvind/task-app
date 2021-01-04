const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const auth = require('../middleware/auth');
const User = require('../models/user');
const mailSender = require('../mail/sendMail');

const router = new express.Router();

// Login user
router.post('/users/login', async (req, res) => {

    try {
        const user = await User.findUserByCredentials(req.body.email, req.body.password);
        const token = await user.getAuthToken();
        res.status(201).send({user, token});
    } catch (e) {
        res.status(400).send('invalid login');
    }
});

// Create a new user
router.post('/users', async (req, res) => {
    const user = new User(req.body);
    try {
        await user.save();
        mailSender.sendWelcomeMsg(user.name, user.email);
        const token = await user.getAuthToken();
        res.status(201).send({user, token});
    } catch(e) {
        res.status(400).send(e);
    }
});

//logout
router.get('/users/logout', auth, async (req, res) => {
    try {
        const reqToken = req.token;
        const user = req.user;

        user.tokens = user.tokens.filter((token) => {
            return reqToken !== token.token
        });

        await user.save();

        res.status(200).send('logout success');
    } catch (e) {
        res.status(500).send('error');
    }
});

//logout all
router.get('/users/logoutall', auth, async (req, res) => {
    try {
        const reqToken = req.token;
        const user = req.user;

        user.tokens = [];

        await user.save();
        
        res.status(200).send('logout success');
    } catch (e) {
        res.status(500).send('error');
    }
});

// Get user profile
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
});

// Update user by id
router.patch('/users/me', auth, async (req, res) => {
    const givenParams = Object.keys(req.body);
    const allowedParams = ['name', 'email', 'password', 'age'];

    const isValidCall = givenParams.every((givenParam) => {
        return allowedParams.includes(givenParam);
    })

    if(!isValidCall) {
        return res.status(400).send({"error": "Invalid keys"});
    }

    try {
        if(!req.user) {
            return res.status(404).send('not found');
        }

        givenParams.forEach((givenParam) => {
            req.user[givenParam] = req.body[givenParam];
        });

        await req.user.save();
        res.send(req.user);
    } catch (e) {
        return res.status(500).send(e);
    }
});

// Delete user by id
router.delete('/users/me', auth, async(req, res) => {
    try {
        await req.user.remove();
        mailSender.sendCancellationMsg(req.user.name, req.user.email);
        res.send(req.user);
    } catch (e) {
        return res.status(500).send(e);
    }
});

const avatars = multer({
    limits: {
        fileSize:1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(png|jpej|jpg)$/)){
            return cb(new Error('Error file not supported'))
        }
        cb(null, true);
    }
});

router.post('/users/me/avatar', auth, avatars.single('avatar'), async (req, res) => {
    const buffer = sharp(req.file.buffer).resize({width:250, height: 250}).png().toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
}, (error, req, res, next) => {
    res.status(400).send({"error": error.message});
});

router.delete('/users/me/avatar', auth, async (req, res) => {
    try {
        req.user.avatar = undefined;
        await req.user.save();
        res.send('removed');
    } catch (e){
        res.status(500).send('error');
    }
});

router.get('/users/:id/avatar', async (req,res) => {
    try {
        const user = await User.findById(req.params.id);
        if(!user || !user.avatar) {
            throw new Error('not found');
        }
        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    } catch (e){
        res.status(500).send('error');
    }
});

module.exports = router;