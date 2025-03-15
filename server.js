const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'Chat Bot';

// Run when client connects
io.on('connection', (socket) => {
  console.log('New WebSocket connection'); // Debugging

  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);

    // Welcome current user
    socket.emit('message', formatMessage(botName, `Welcome to ${room} Room`));

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit('message', formatMessage(botName, `${user.username} has joined the chat`));

    // Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room),
    });

    console.log(`${user.username} joined ${user.room}`); // Debugging
  });

  // Listen for chatMessage
  socket.on('chatMessage', (msg) => {
    const user = getCurrentUser(socket.id);
    if (user) {
      console.log(`${user.username} sent a message: ${msg}`); // Debugging
      io.to(user.room).emit('message', formatMessage(user.username, msg));
    } else {
      console.log('Message received from an unknown user'); // Debugging
    }
  });

  socket.on('fileMessage', (file) => {
    const user = getCurrentUser(socket.id);
    if (user) {
      console.log(`${user.username} sent a file: ${file.name}`); // Debugging
      console.log('File type:', file.type); // Debugging
      console.log('File data length:', file.data.length); // Debugging
  
      // Broadcast file to the room
      io.to(user.room).emit('file', {
        username: user.username,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
        ...file,
      });
    } else {
      console.log('File received from an unknown user'); // Debugging
    }
  });
  // Runs when client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);
    if (user) {
      console.log(`${user.username} left ${user.room}`); // Debugging
      io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));

      // Send updated users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));