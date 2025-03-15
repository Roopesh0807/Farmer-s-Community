const chatForm = document.getElementById('chat-form');
const chatMessages = document.getElementById('chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
const fileInput = document.getElementById('file-input');

// Get username and room from URL
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const socket = io('https://farmer-s-community.onrender.com/');

// Join chatroom
socket.emit('joinRoom', { username, room });

// Get room and users
socket.on('roomUsers', ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

// Message from server
socket.on('message', (message) => {
  outputMessage(message);
  chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll to the latest message
});

// File from server
socket.on('file', (file) => {
  outputFile(file);
  chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll to the latest message
});

// Message or file submit
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const msg = e.target.elements.msg.value.trim();
  const file = fileInput.files[0];

  if (msg || file) {
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const fileData = {
          name: file.name,
          type: file.type,
          data: e.target.result,
        };
        socket.emit('fileMessage', fileData); // Send file via Socket.IO
      };
      reader.readAsDataURL(file);
    }

    if (msg) {
      socket.emit('chatMessage', msg); // Send text message via Socket.IO
    }

    // Clear input fields
    e.target.elements.msg.value = '';
    fileInput.value = '';
  }
});

// Function to display text messages
function outputMessage(message) {
  const div = document.createElement('div');
  div.classList.add('message');
  div.innerHTML = `
    <p class="meta">${message.username} <span>${message.time}</span></p>
    <p class="text">${message.text}</p>
  `;
  chatMessages.appendChild(div);
}

// Function to display file messages
function outputFile(file) {
  const div = document.createElement('div');
  div.classList.add('message');
  div.innerHTML = `
    <p class="meta">${file.username} <span>${file.time}</span></p>
    <div class="file-preview">
      ${file.type.startsWith('image/') ? 
        `<img src="${file.data}" alt="${file.name}" style="max-width: 100%; border-radius: 5px;" />` : 
        `<a href="${file.data}" download="${file.name}" class="file-download">Download ${file.name}</a>`
      }
    </div>
  `;
  chatMessages.appendChild(div);
}
// Add room name to DOM
function outputRoomName(room) {
  roomName.innerText = room;
}

// Add users to DOM
function outputUsers(users) {
  userList.innerHTML = '';
  users.forEach((user) => {
    const li = document.createElement('li');
    li.innerText = user.username;
    userList.appendChild(li);
  });
}

// Prompt the user before leaving the chat room
document.getElementById('leave-btn').addEventListener('click', () => {
  const leaveRoom = confirm('Are you sure you want to leave this chatroom?');
  if (leaveRoom) {
    window.location = '../index.html';
  }
});
// Function to handle file uploads
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const fileData = {
        name: file.name,
        type: file.type,
        data: e.target.result, // Base64-encoded file data
      };
      socket.emit('fileMessage', fileData); // Send file to the server
    };
    reader.readAsDataURL(file); // Read file as base64
  }
});
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('File size must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
      const fileData = {
        name: file.name,
        type: file.type,
        data: e.target.result,
      };
      socket.emit('fileMessage', fileData);
    };
    reader.readAsDataURL(file);
  }
});