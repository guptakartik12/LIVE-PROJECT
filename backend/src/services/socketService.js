let ioInstance = null;

const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`Socket.IO client connected: ${socket.id}`);

    socket.on('join_user_room', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
        console.log(`Socket ${socket.id} joined user_${userId}`);
      }
    });

    socket.on('join_location_room', (locationName) => {
      if (locationName) {
        socket.join(`loc_${locationName}`);
        console.log(`Socket ${socket.id} joined loc_${locationName}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket.IO client disconnected: ${socket.id}`);
    });
  });
};

const getIO = () => {
  return ioInstance;
};

const emitSlotUpdate = (data) => {
  if (ioInstance) {
    ioInstance.emit('slot_updated', data);
    console.log('Emitted slot_updated via Socket.IO');
  }
};

const emitBookingUpdate = (data) => {
  if (ioInstance) {
    ioInstance.emit('booking_updated', data);
    if (data.userId) {
      ioInstance.to(`user_${data.userId}`).emit('user_booking_event', data);
    }
  }
};

const emitGateEvent = (data) => {
  if (ioInstance) {
    ioInstance.emit('gate_event', data);
  }
};

const emitNotification = (userId, notification) => {
  if (ioInstance && userId) {
    ioInstance.to(`user_${userId}`).emit('new_notification', notification);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitSlotUpdate,
  emitBookingUpdate,
  emitGateEvent,
  emitNotification
};
