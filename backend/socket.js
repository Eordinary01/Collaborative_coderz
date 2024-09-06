const Code = require('./models/Code');
const User = require('./models/User');

const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('joinRoom', async (data) => {
      const { roomId, userId } = data;
      socket.join(roomId);
      
      const code = await Code.findById(roomId);
      if (code && !code.collaborators.includes(userId)) {
        code.collaborators.push(userId);
        await code.save();
      }
      
      io.to(roomId).emit('userJoined', userId);
    });

    socket.on('codeChange', (data) => {
      socket.to(data.roomId).emit('codeUpdate', data.code);
    });

    socket.on('cursorMove', (data) => {
      socket.to(data.roomId).emit('cursorUpdate', { userId: data.userId, position: data.position });
    });

    socket.on('collaborationRequest', async (data) => {
      const { targetUserId, codeId, requestingUserId } = data;
      const targetUser = await User.findById(targetUserId);
      const requestingUser = await User.findById(requestingUserId);
      const code = await Code.findById(codeId);
      
      if (targetUser && requestingUser && code) {
        io.to(targetUser._id.toString()).emit('collaborationRequest', { 
          codeId: code._id, 
          userId: requestingUser._id,
          username: requestingUser.username,
          projectTitle: code.title
        });
      }
    });

    socket.on('collaborationResponse', async (data) => {
      const { codeId, userId, accepted } = data;
      if (accepted) {
        const code = await Code.findById(codeId);
        if (code && !code.collaborators.includes(userId)) {
          code.collaborators.push(userId);
          await code.save();
          io.to(userId).emit('collaborationAccepted', code);
        }
      } else {
        io.to(userId).emit('collaborationRejected', codeId);
      }
    });

    // WebRTC signaling
    socket.on('offer', (data) => {
      socket.to(data.roomId).emit('offer', data.offer);
    });

    socket.on('answer', (data) => {
      socket.to(data.roomId).emit('answer', data.answer);
    });

    socket.on('iceCandidate', (data) => {
      socket.to(data.roomId).emit('iceCandidate', data.candidate);
    });

    // Video chat events
    socket.on('startVideoChat', async (data) => {
      const { codeId, userId } = data;
      const code = await Code.findById(codeId);
      if (code) {
        code.videoSessionActive = true;
        code.videoSessionParticipants = [userId];
        await code.save();
        io.to(codeId).emit('videoChatStarted', { codeId, initiator: userId });
      }
    });

    socket.on('joinVideoChat', async (data) => {
      const { codeId, userId } = data;
      const code = await Code.findById(codeId);
      if (code && code.videoSessionActive) {
        if (!code.videoSessionParticipants.includes(userId)) {
          code.videoSessionParticipants.push(userId);
          await code.save();
        }
        io.to(codeId).emit('userJoinedVideoChat', { codeId, userId });
      }
    });

    socket.on('leaveVideoChat', async (data) => {
      const { codeId, userId } = data;
      const code = await Code.findById(codeId);
      if (code) {
        code.videoSessionParticipants = code.videoSessionParticipants.filter(id => id.toString() !== userId);
        if (code.videoSessionParticipants.length === 0) {
          code.videoSessionActive = false;
        }
        await code.save();
        io.to(codeId).emit('userLeftVideoChat', { codeId, userId });
      }
    });

    socket.on('endVideoChat', async (data) => {
      const { codeId, userId } = data;
      const code = await Code.findById(codeId);
      if (code && code.user.toString() === userId) {
        code.videoSessionActive = false;
        code.videoSessionParticipants = [];
        await code.save();
        io.to(codeId).emit('videoChatEnded', { codeId });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
};

module.exports = { setupSocket };