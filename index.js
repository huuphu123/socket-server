const express = require('express');
const app = express();
const path = require('path');

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    // Trang chính hiển thị thông tin về các room
    res.sendFile(__dirname + '/client/index.html');
  });
  
  app.get('/room', (req, res) => {
    // Trang riêng cho từng room
    res.sendFile(__dirname + '/client/room.html');
  });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});