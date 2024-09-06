const express = require('express');
const Code = require('../models/Code');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/start/:codeId', auth, async (req, res) => {
  try {
    const code = await Code.findOne({ _id: req.params.codeId, user: req.user._id });
    if (!code) {
      return res.status(404).send({ error: 'Code not found' });
    }

    code.videoSessionActive = true;
    code.videoSessionParticipants = [req.user._id];
    await code.save();

    res.send({ message: 'Video session started', code });
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post('/join/:codeId', auth, async (req, res) => {
  try {
    const code = await Code.findById(req.params.codeId);
    if (!code) {
      return res.status(404).send({ error: 'Code not found' });
    }

    if (!code.videoSessionActive) {
      return res.status(400).send({ error: 'No active video session' });
    }

    if (!code.collaborators.includes(req.user._id)) {
      return res.status(403).send({ error: 'Not authorized to join this session' });
    }

    if (!code.videoSessionParticipants.includes(req.user._id)) {
      code.videoSessionParticipants.push(req.user._id);
      await code.save();
    }

    res.send({ message: 'Joined video session', code });
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post('/end/:codeId', auth, async (req, res) => {
  try {
    const code = await Code.findOne({ _id: req.params.codeId, user: req.user._id });
    if (!code) {
      return res.status(404).send({ error: 'Code not found' });
    }

    code.videoSessionActive = false;
    code.videoSessionParticipants = [];
    await code.save();

    res.send({ message: 'Video session ended', code });
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;