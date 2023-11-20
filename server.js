const http = require('http');
const express = require('express');
const WebSocket = require('ws');

class RoomServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });

    this.rooms = {
      room1: { players: 0, sockets: {} },
      room2: { players: 0, sockets: {} }
    };

    this.updateInterval = setInterval(() => this.broadcastRoomInfo(), 1000);

    this.wss.on('connection', (socket) => this.handleConnection(socket));
  }

  broadcastRoomInfo() {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'roomInfo', room1: this.rooms.room1.players, room2: this.rooms.room2.players }));
      }
    });
  }

  async handleConnection(socket) {
    console.log('Client connected');

    socket.on('message', async (message) => {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'joinRoom':
          try {
            await this.handleJoinRoom(data, socket);
          } catch (error) {
            console.error(error);
          }
          break;

        case 'message':
          try {
            await this.handleMessage(data);
          } catch (error) {
            console.error(error);
          }
          break;

        case 'disconnect':
          try {
            await this.handleDisconnect(data);
          } catch (error) {
            console.error(error);
          }
          break;

        case 'initialization':
          try {
            await this.handleInitialization(data, socket);
          } catch (error) {
            console.error(error);
          }
          break;

        case 'reload':
          try {
            await this.handleReload(data);
          } catch (error) {
            console.error(error);
          }
          break;
      }
    });
  }

  async handleJoinRoom(data, socket) {
    if (this.rooms[data.room].players < 2) {
      this.rooms[data.room].players++;
      socket.send(JSON.stringify({ type: 'joinedRoom', room: data.room }));
    } else {
      socket.send(JSON.stringify({ type: 'roomFull' }));
    }
  }

  async handleMessage(data) {
    await new Promise((resolve) => {
      setTimeout(() => {
        Object.entries(this.rooms[data.room].sockets).forEach(([key, clientSocket]) => {
          if (key !== data.client_id && clientSocket.readyState === WebSocket.OPEN) {
            clientSocket.send(JSON.stringify({
              type: 'message',
              message: data.message,
              client_id: data.client_id,
            }));
          }
        });
        resolve();
      }, 0);
    });
  }

  async handleDisconnect(data) {
    this.rooms[data.room].players--;
    await new Promise((resolve) => {
      setTimeout(() => {
        Object.entries(this.rooms[data.room].sockets).forEach(([key, clientSocket]) => {
          if (key !== data.client_id && clientSocket.readyState === WebSocket.OPEN) {
            clientSocket.send(JSON.stringify({
              type: 'disconnect',
              client_id: data.client_id,
            }));
          }
        });
        resolve();
      }, 0);
    });
    delete this.rooms[data.room].sockets[data.client_id];
  }

  async handleInitialization(data, socket) {
    this.rooms[data.room].sockets[data.client_id] = socket;
  }

  async handleReload(data) {
    delete this.rooms[data.room].sockets[data.client_id];
  }

  startServer() {
    this.server.on('close', () => {
      clearInterval(this.updateInterval);
    });

    this.server.listen(8080, () => {
      console.log('Server is running on port 8080');
    });
  }
}

const roomServer = new RoomServer();
roomServer.startServer();