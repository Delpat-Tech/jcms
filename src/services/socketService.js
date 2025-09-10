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

  // Optional authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        // Allow connection without authentication but mark as guest
        socket.userId = 'guest';
        socket.userRole = 'guest';
        socket.username = 'Guest User';
        logger.debug('WebSocket: Guest connection allowed');
        return next();
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.user.id).populate('role');
        
        if (!user) {
          // Fallback to guest if user not found
          socket.userId = 'guest';
          socket.userRole = 'guest';
          socket.username = 'Guest User';
          logger.warn('WebSocket: User not found, falling back to guest');
          return next();
        }

        socket.userId = user._id.toString();
        socket.userRole = user.role.name;
        socket.username = user.username;
        
        logger.debug('WebSocket: Authenticated user connected', {
          userId: socket.userId,
          username: socket.username,
          role: socket.userRole
        });
        
        next();
      } catch (jwtError) {
        // Invalid token, fallback to guest
        socket.userId = 'guest';
        socket.userRole = 'guest';
        socket.username = 'Guest User';
        logger.warn('WebSocket: Invalid token, falling back to guest', { error: jwtError.message });
        next();
      }
    } catch (err) {
      logger.error('WebSocket authentication error', { error: err.message });
      // Still allow connection as guest
      socket.userId = 'guest';
      socket.userRole = 'guest';
      socket.username = 'Guest User';
      next();
    }
  });

  io.on('connection', (socket) => {
    logger.info('WebSocket connection established', { 
      username: socket.username, 
      userRole: socket.userRole, 
      userId: socket.userId,
      socketId: socket.id
    });
    
    // Join appropriate rooms based on user role
    if (['admin', 'superadmin'].includes(socket.userRole)) {
      socket.join('admins');
      logger.info('User joined admin room', { 
        username: socket.username, 
        userRole: socket.userRole,
        socketId: socket.id 
      });
    } else if (socket.userRole === 'guest') {
      socket.join('guests');
      logger.debug('Guest user connected', { socketId: socket.id });
    } else {
      socket.join('users');
      logger.debug('Regular user connected', { 
        username: socket.username, 
        userRole: socket.userRole,
        socketId: socket.id 
      });
    }

    socket.on('disconnect', () => {
      logger.debug('WebSocket disconnected', { 
        username: socket.username, 
        userRole: socket.userRole,
        socketId: socket.id
      });
    });
    
    // Send a welcome message to confirm connection
    socket.emit('connection_confirmed', {
      message: 'WebSocket connected successfully',
      userRole: socket.userRole,
      username: socket.username,
      timestamp: new Date().toISOString()
    });
  });

  return io;
};

const notifyAdmins = async (action, data) => {
  const callId = Math.random().toString(36).substring(7);
  
  logger.info('🔵 SOCKET SERVICE: notifyAdmins called', {
    callId,
    action,
    userId: data.userId,
    username: data.username
  });
  
  // Add to aggregator for activity tracking and real-time notifications
  const aggregator = require('./notificationAggregator');
  const notification = {
    action,
    data: {
      ...data,
      userId: data.userId || data.user
    },
    timestamp: new Date().toISOString()
  };
  
  logger.info('🔵 SOCKET SERVICE: Calling aggregator.addNotification', {
    callId,
    action
  });
  
  await aggregator.addNotification(notification);
  
  logger.info('🔵 SOCKET SERVICE: aggregator.addNotification completed', {
    callId,
    action
  });
  
  // 2. Only send email for high-priority or threshold-exceeded activities
  // Regular CRUD operations are just logged silently
};

module.exports = {
  initializeSocket,
  notifyAdmins
};