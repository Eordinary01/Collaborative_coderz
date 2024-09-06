const express = require('express');
const User = require('../models/User');
const Code = require('../models/Code');
const auth = require('../middleware/auth');
const { exec } = require('child_process');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');


const router = express.Router();
router.use(bodyParser.json());



router.post('/run/:id', auth, async (req, res) => {
    try {
        const code = await Code.findOne({ _id: req.params.id, user: req.user._id });
        if (!code) {
            return res.status(404).send({ error: 'Code not found' });
        }

        const scriptContent = code.content;
        if (typeof scriptContent !== 'string' || scriptContent.trim() === '') {
            return res.status(400).send({ error: 'Invalid code content' });
        }

        console.log('Script content:', scriptContent);

        const tempFile = path.join(__dirname, `temp_${req.params.id}.js`);

        await fs.writeFile(tempFile, scriptContent);

        // Escape the file path
        const escapedTempFile = tempFile.replace(/\\/g, '\\\\');

        exec(`node "${escapedTempFile}"`, async (error, stdout, stderr) => {
            try {
                await fs.unlink(tempFile);  // Delete the temporary file
            } catch (unlinkError) {
                console.error('Error deleting temp file:', unlinkError);
            }

            if (error) {
                console.error('Execution error:', error);
                return res.status(500).send({ 
                    error: error.message,
                    code: error.code,
                    stack: error.stack
                });
            }
            res.send({ output: stdout });
        });
    } catch (error) {
        console.error('Route error:', error);
        res.status(500).send({
            error: error.message,
            code: error.code,
            stack: error.stack
        });
    }
});





router.get('/session/:id', auth, async (req, res) => {
    try {
      const code = await Code.findOne({ _id: req.params.id, $or: [{ user: req.user._id }, { collaborators: req.user._id }] })
        .populate('user', 'username')
        .populate('collaborators', 'username')
        .populate('videoSessionParticipants', 'username');
      
      if (!code) {
        return res.status(404).send({ error: 'Code not found' });
      }
      
      res.send(code);
    } catch (error) {
      res.status(500).send(error);
    }
  });

router.post('/:id/accept/:userId', auth, async (req, res) => {
    try {
        const code = await Code.findOne({ _id: req.params.id, user: req.user._id });
        if (!code) {
            return res.status(404).send({ error: 'Code not found' });
        }

        const userIdToAccept = req.params.userId;
        if (!code.pendingRequests.includes(userIdToAccept)) {
            return res.status(400).send({ error: 'No pending request from this user' });
        }

        code.collaborators.push(userIdToAccept);
        code.pendingRequests = code.pendingRequests.filter(id => id.toString() !== userIdToAccept);
        await code.save();

        res.send(code);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Decline collaboration request
router.post('/:id/decline/:userId', auth, async (req, res) => {
    try {
        const code = await Code.findOne({ _id: req.params.id, user: req.user._id });
        if (!code) {
            return res.status(404).send({ error: 'Code not found' });
        }

        const userIdToDecline = req.params.userId;
        code.pendingRequests = code.pendingRequests.filter(id => id.toString() !== userIdToDecline);
        await code.save();

        res.send(code);
    } catch (error) {
        res.status(500).send(error);
    }
});
router.post('/', auth, async (req, res) => {
    try {
        const code = new Code({
            ...req.body,
            user: req.user._id
        }); 
        await code.save();
        res.status(201).send(code);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.get('/', auth, async (req, res) => {
    try {
        const codes = await Code.find({ user: req.user._id })
            .select('title language createdAt collaborators')
            .sort({ createdAt: -1 });
        res.send(codes);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/:id', auth, async (req, res) => {
    try {
        const code = await Code.findOne({ 
            _id: req.params.id, 
            $or: [{ user: req.user._id }, { collaborators: req.user._id }] 
        }).populate('user', 'username');
        if (!code) {
            return res.status(404).send({ error: 'Code not found' });
        }
        res.send(code);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.post('/collaborate', auth, async (req, res) => {
    try {
        const { collaborationCode } = req.body;
        console.log('Received collaboration code:', collaborationCode);
        
        const targetUser = await User.findOne({ collaborationCode });
        console.log('Found user:', targetUser);
        if (!targetUser) {
            return res.status(404).send({ error: 'User not found' });
        }
        if (targetUser._id.toString() === req.user._id.toString()) {
            return res.status(400).send({ error: 'You cannot collaborate with yourself' });
        }

        // Generate a unique collaboration session ID
        const collaborationId = new mongoose.Types.ObjectId();

        // Emit a socket event to notify the target user
        req.app.get('io').to(targetUser._id.toString()).emit('collaborationRequest', {
            id: collaborationId,
            requester: req.user.username
        });

        res.send({ message: 'Collaboration request sent', collaborationId });
    } catch (error) {
        res.status(500).send(error);
    }
});






module.exports = router;