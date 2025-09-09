const mongoose = require('mongoose');
const User = require('./src/models/user');
const Role = require('./src/models/role');
require('dotenv').config();

const quickSetup = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔗 Connected to MongoDB');

    // Create basic roles
    const roles = [
      { name: 'superadmin', description: 'Super Administrator' },
      { name: 'admin', description: 'Administrator' },
      { name: 'editor', description: 'Editor' },
      { name: 'viewer', description: 'Viewer' }
    ];

    for (const roleData of roles) {
      let role = await Role.findOne({ name: roleData.name });
      if (!role) {
        role = await Role.create(roleData);
        console.log(`✅ Role created: ${roleData.name}`);
      }
    }

    // Create superadmin user
    const superadminRole = await Role.findOne({ name: 'superadmin' });
    let superadmin = await User.findOne({ email: 'admin@system.com' });
    if (!superadmin) {
      superadmin = await User.create({
        username: 'superadmin',
        email: 'admin@system.com',
        password: 'admin123',
        role: superadminRole._id
      });
      console.log('✅ Superadmin created');
    }

    // Create test users
    const testUsers = [
      { username: 'dev_admin', email: 'dev.admin@test.com', password: 'dev123', role: 'admin' },
      { username: 'test_editor', email: 'editor@test.com', password: 'test123', role: 'editor' },
      { username: 'qa_tester', email: 'qa@test.com', password: 'test123', role: 'viewer' }
    ];

    for (const userData of testUsers) {
      let user = await User.findOne({ email: userData.email });
      if (!user) {
        const role = await Role.findOne({ name: userData.role });
        user = await User.create({
          username: userData.username,
          email: userData.email,
          password: userData.password,
          role: role._id
        });
        console.log(`✅ Test user created: ${userData.username}`);
      }
    }

    console.log('\n🎉 Setup completed!');
    console.log('\n🔑 Login Credentials:');
    console.log('- SuperAdmin: admin@system.com / admin123');
    console.log('- Admin: dev.admin@test.com / dev123');
    console.log('- Editor: editor@test.com / test123');
    console.log('- Viewer: qa@test.com / test123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
};

quickSetup();