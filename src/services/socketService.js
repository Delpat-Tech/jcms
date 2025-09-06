// services/socketService.js
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const logger = require('../config/logger');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.user.id).populate('role');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role.name;
      socket.username = user.username;
      
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    logger.debug('User connected to WebSocket', { username: socket.username, userRole: socket.userRole, userId: socket.userId });
    
    // Join admin room if user is admin or superadmin
    if (['admin', 'superadmin'].includes(socket.userRole)) {
      socket.join('admins');
      logger.debug('User joined admin room', { username: socket.username, userRole: socket.userRole });
    }

    socket.on('disconnect', () => {
      logger.debug('User disconnected from WebSocket', { username: socket.username, userRole: socket.userRole });
    });
  });

  return io;
};

const notifyAdmins = async (action, data) => {
  // 1. Send real-time WebSocket notification
  if (io) {
    const notification = {
      action,
      data,
      timestamp: new Date().toISOString()
    };
    logger.debug('Sending WebSocket notification to admins', { action, timestamp: notification.timestamp });
    io.to('admins').emit('admin_notification', notification);
  }
  
  // 2. Send comprehensive notifications (email + database)
  const { notifyAdmins: comprehensiveNotify } = require('./notificationService');
  await comprehensiveNotify(data);
};

module.exports = {
  initializeSocket,
  notifyAdmins
};