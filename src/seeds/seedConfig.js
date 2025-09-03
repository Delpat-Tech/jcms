// src/seeds/seedConfig.js
const seedConfig = {
  // Default credentials for different environments
  credentials: {
    superadmin: {
      username: 'superadmin',
      email: 'admin@system.com',
      password: 'admin123'
    },
    development: {
      adminPassword: 'dev123',
      userPassword: 'test123',
      demoPassword: 'demo123'
    },
    production: {
      // Production should use environment variables
      adminPassword: process.env.ADMIN_PASSWORD || 'changeMe123!',
      userPassword: process.env.USER_PASSWORD || 'changeMe123!'
    }
  },

  // Permission categories for better organization
  permissionCategories: {
    user: ['create', 'read', 'update', 'delete', 'activate', 'profile'],
    role: ['create', 'read', 'update', 'delete', 'assign'],
    permission: ['read', 'assign'],
    content: ['create', 'read', 'update', 'delete', 'publish', 'moderate'],
    image: ['create', 'read', 'update', 'delete', 'bulk'],
    analytics: ['view'],
    reports: ['generate', 'export'],
    system: ['settings', 'logs', 'backup', 'maintenance'],
    tenant: ['create', 'read', 'update', 'delete', 'manage'],
    api: ['read', 'write', 'admin']
  },

  // Role definitions with permission mappings
  roleDefinitions: {
    superadmin: {
      description: 'Super Administrator - Full system access',
      permissions: 'ALL'
    },
    admin: {
      description: 'Administrator - Tenant level management',
      permissions: [
        'user.*', 'role.read', 'role.assign', 'permission.read',
        'content.*', 'image.*', 'analytics.*', 'reports.*',
        'system.settings', 'system.logs', 'api.read', 'api.write'
      ]
    },
    editor: {
      description: 'Content Editor - Create and manage content',
      permissions: [
        'content.create', 'content.read', 'content.update', 'content.publish',
        'image.create', 'image.read', 'image.update', 'image.delete',
        'user.profile', 'user.read', 'analytics.view',
        'api.read', 'api.write'
      ]
    },
    contributor: {
      description: 'Content Contributor - Create content for review',
      permissions: [
        'content.create', 'content.read', 'content.update',
        'image.create', 'image.read', 'user.profile', 'api.read'
      ]
    },
    viewer: {
      description: 'Content Viewer - Read-only access',
      permissions: [
        'content.read', 'image.read', 'user.profile',
        'analytics.view', 'api.read'
      ]
    },
    guest: {
      description: 'Guest User - Limited access',
      permissions: ['content.read', 'user.profile']
    }
  },

  // Sample data templates
  sampleData: {
    users: {
      admin: { username: 'john_admin', email: 'john@example.com' },
      editor: { username: 'jane_editor', email: 'jane@example.com' },
      contributor: { username: 'mike_contributor', email: 'mike@example.com' },
      viewer: { username: 'bob_viewer', email: 'bob@example.com' },
      guest: { username: 'guest_user', email: 'guest@example.com' }
    },
    devUsers: [
      { username: 'dev_admin', email: 'dev.admin@test.com', role: 'admin' },
      { username: 'test_editor1', email: 'editor1@test.com', role: 'editor' },
      { username: 'test_editor2', email: 'editor2@test.com', role: 'editor' },
      { username: 'content_writer', email: 'writer@test.com', role: 'contributor' },
      { username: 'qa_tester', email: 'qa@test.com', role: 'viewer' },
      { username: 'demo_user', email: 'demo@test.com', role: 'guest' }
    ]
  },

  // Seed options
  options: {
    dropExisting: false, // Whether to drop existing data before seeding
    skipIfExists: true,  // Skip creation if data already exists
    verbose: true,       // Detailed logging
    createIndexes: true  // Create database indexes
  }
};

module.exports = seedConfig;