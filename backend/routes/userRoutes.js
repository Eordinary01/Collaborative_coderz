const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/collaboration-code', auth, async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      res.json({ collaborationCode: user.collaborationCode });
    } catch (error) {
      res.status(500).send({ error: 'Failed to fetch collaboration code' });
    }
  });
  module.exports = router;