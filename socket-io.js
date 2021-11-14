let io;

module.exports = {
  init: httpServer => {
    io = require('socket.io')(httpServer);
    return io; // creating io connection
  },
  getIO: () => { // getting io connection
    if (!io) {
      throw new Error('Socket connection not initialized');
    }
    return io;
  }
}
