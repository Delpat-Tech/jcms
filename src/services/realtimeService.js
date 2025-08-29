// services/realtimeService.js
class RealtimeService {
  constructor(io) {
    this.io = io;
  }

  // Emit to specific tenant
  emitToTenant(tenantId, event, data) {
    this.io.to(`tenant-${tenantId}`).emit(event, {
      timestamp: new Date(),
      ...data
    });
  }

  // Emit to all connected clients
  emitToAll(event, data) {
    this.io.emit(event, {
      timestamp: new Date(),
      ...data
    });
  }

  // Image events
  imageUploaded(tenantId, imageData, userData) {
    this.emitToTenant(tenantId, 'image:uploaded', {
      type: 'IMAGE_UPLOADED',
      image: imageData,
      user: userData,
      message: `${userData.username} uploaded "${imageData.title}"`
    });
  }

  imageUpdated(tenantId, imageData, userData) {
    this.emitToTenant(tenantId, 'image:updated', {
      type: 'IMAGE_UPDATED',
      image: imageData,
      user: userData,
      message: `${userData.username} updated "${imageData.title}"`
    });
  }

  imageDeleted(tenantId, imageData, userData) {
    this.emitToTenant(tenantId, 'image:deleted', {
      type: 'IMAGE_DELETED',
      imageId: imageData.id,
      user: userData,
      message: `${userData.username} deleted "${imageData.title}"`
    });
  }

  // User events
  userRegistered(tenantId, userData) {
    this.emitToTenant(tenantId, 'user:registered', {
      type: 'USER_REGISTERED',
      user: userData,
      message: `New user ${userData.username} joined`
    });
  }

  // Analytics events
  analyticsUpdate(data) {
    this.emitToAll('analytics:update', {
      type: 'ANALYTICS_UPDATE',
      data: data
    });
  }

  // System events
  systemAlert(message, level = 'info') {
    this.emitToAll('system:alert', {
      type: 'SYSTEM_ALERT',
      message,
      level
    });
  }
}

module.exports = RealtimeService;