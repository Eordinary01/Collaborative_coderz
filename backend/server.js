require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const codeRoutes = require('./routes/code');
const videoRoutes = require('./routes/video');
const userRoutes =  require('./routes/userRoutes');
const { setupSocket } = require('./socket');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: "localhost:3000",
    methods: ["GET", "POST","PUT"]
  }
});

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.get('/',(req,res)=>{
    res.json({message:'Dev has Arrived!!'})
})

app.use('/api/auth', authRoutes);
app.use('/api/code', codeRoutes);
app.use('/api/video',videoRoutes);
app.use('/api/user',userRoutes);

setupSocket(io);

const PORT = process.env.PORT || 8500;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));