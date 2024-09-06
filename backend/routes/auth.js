const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const router = express.Router();
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            // Check if the password is the same
            const isPasswordSame = await bcrypt.compare(password, existingUser.password);
            if (isPasswordSame) {
                return res.status(400).send({ message: 'Username exists with the same password. Please choose a different username or password.' });
            }
            return res.status(400).send({ message: 'Username already exists' });
        }
        
        // Create new user
        const user = new User({ username, password });
        await user.save();
        
        res.status(201).send({ message: 'User Registered Successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).send({ message: 'Registration failed', error: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({username: req.body.username});
        if (!user) {
            return res.status(401).send({ error: 'User not found' });
        }
        
        const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
        if (!isPasswordValid) {
            return res.status(401).send({ error: 'Invalid password' });
        }

        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
        res.send({ 
            user: {
                _id: user._id,
                username: user.username,
                collaborationCode: user.collaborationCode
            }, 
            token 
        });
    } catch (error) {
        res.status(400).send(error);
    }
});




module.exports = router;