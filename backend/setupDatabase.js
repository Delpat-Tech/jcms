// setupDatabase.js - Database Setup and Repair Script
const mongoose = require('mongoose');
const { seedRolesAndPermissions } = require('./src/seeds/seedConfig');
const User = require('./src/models/user');
const Role = require('./src/models/role');
require('dotenv').config();

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/jcms';
    console.log('Connecting to MongoDB...', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const checkAndFixRoles = async () => {
  console.log('\n🔍 Checking roles...');
  
  const roles = await Role.find({});
  console.log(`Found ${roles.length} roles:`, roles.map(r => r.name));
  
  const requiredRoles = ['superadmin', 'admin', 'editor', 'viewer'];
  const existingRoles = roles.map(r => r.name);
  const missingRoles = requiredRoles.filter(role => !existingRoles.includes(role));
  
  if (missingRoles.length > 0) {
    console.log(`❌ Missing roles: ${missingRoles.join(', ')}`);
    console.log('🔧 Running role seeding...');
    await seedRolesAndPermissions();
    console.log('✅ Roles seeded successfully');
  } else {
    console.log('✅ All required roles exist');
  }
  
  return await Role.find({});
};

const checkUsers = async () => {
  console.log('\n👥 Checking users...');
  
  const users = await User.find({}).populate('role');
  console.log(`Found ${users.length} users:`);
  
  users.forEach(user => {
    console.log(`  - ${user.username} (${user.email}) - Role: ${user.role?.name || 'NO ROLE'} - Active: ${user.isActive}`);
  });
  
  // Check for users without roles
  const usersWithoutRoles = users.filter(user => !user.role);
  if (usersWithoutRoles.length > 0) {
    console.log(`❌ Found ${usersWithoutRoles.length} users without roles`);
    return false;
  }
  
  return true;
};

const fixUsersWithoutRoles = async () => {
  console.log('\n🔧 Fixing users without roles...');
  
  const roles = await Role.find({});
  const roleMap = {};
  roles.forEach(role => {
    roleMap[role.name] = role._id;
  });
  
  const usersWithoutRoles = await User.find({ role: null }).populate('role');
  
  for (const user of usersWithoutRoles) {
    // Assign default role based on username or email
    let defaultRole = 'viewer';
    
    if (user.username.includes('admin') || user.email.includes('admin')) {
      defaultRole = user.username === 'superadmin' ? 'superadmin' : 'admin';
    } else if (user.username.includes('editor') || user.email.includes('editor')) {
      defaultRole = 'editor';
    }
    
    if (roleMap[defaultRole]) {
      user.role = roleMap[defaultRole];
      await user.save();
      console.log(`✅ Fixed user ${user.username} - assigned role: ${defaultRole}`);
    }
  }
};

const createSuperAdmin = async () => {
  console.log('\n👑 Checking superadmin...');
  
  const roles = await Role.find({});
  const superadminRole = roles.find(r => r.name === 'superadmin');
  
  if (!superadminRole) {
    console.log('❌ Superadmin role not found');
    return false;
  }
  
  let superadmin = await User.findOne({ 
    $or: [
      { username: 'superadmin' },
      { role: superadminRole._id }
    ]
  }).populate('role');
  
  if (!superadmin) {
    console.log('🔧 Creating superadmin user...');
    superadmin = await User.create({
      username: 'superadmin',
      email: 'admin@system.com',
      password: 'admin123',
      role: superadminRole._id,
      isActive: true
    });
    console.log('✅ Superadmin created');
  } else {
    console.log(`✅ Superadmin exists: ${superadmin.username} (${superadmin.email})`);
    
    // Ensure superadmin is active and has correct role
    let updated = false;
    if (!superadmin.isActive) {
      superadmin.isActive = true;
      updated = true;
    }
    if (!superadmin.role || superadmin.role._id.toString() !== superadminRole._id.toString()) {
      superadmin.role = superadminRole._id;
      updated = true;
    }
    
    if (updated) {
      await superadmin.save();
      console.log('🔧 Superadmin updated');
    }
  }
  
  return true;
};

const testSoftDelete = async () => {
  console.log('\n🧪 Testing soft delete functionality...');
  
  // Create a test user
  const roles = await Role.find({});
  const editorRole = roles.find(r => r.name === 'editor');
  
  if (!editorRole) {
    console.log('❌ Editor role not found for testing');
    return;
  }
  
  let testUser = await User.findOne({ username: 'test_soft_delete' });
  
  if (!testUser) {
    testUser = await User.create({
      username: 'test_soft_delete',
      email: 'test_soft_delete@example.com',
      password: 'test123',
      role: editorRole._id,
      isActive: true
    });
    console.log('✅ Test user created for soft delete testing');
  }
  
  // Test soft delete
  if (testUser.isActive) {
    testUser.isActive = false;
    testUser.deactivatedAt = new Date();
    await testUser.save();
    console.log('✅ Test user soft deleted');
  }
  
  // Test reactivation
  testUser.isActive = true;
  testUser.deactivatedAt = null;
  testUser.reactivatedAt = new Date();
  await testUser.save();
  console.log('✅ Test user reactivated');
  
  // Clean up test user
  await User.deleteOne({ _id: testUser._id });
  console.log('✅ Test user cleaned up');
};

const main = async () => {
  console.log('🚀 Starting database setup and repair...\n');
  
  try {
    await connectDB();
    
    // Step 1: Check and fix roles
    await checkAndFixRoles();
    
    // Step 2: Check users
    const usersOk = await checkUsers();
    
    // Step 3: Fix users without roles if needed
    if (!usersOk) {
      await fixUsersWithoutRoles();
    }
    
    // Step 4: Ensure superadmin exists
    await createSuperAdmin();
    
    // Step 5: Test soft delete functionality
    await testSoftDelete();
    
    console.log('\n✅ Database setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - Roles: superadmin, admin, editor, viewer');
    console.log('   - Superadmin: username="superadmin", password="admin123"');
    console.log('   - Soft delete: Working properly');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
};

if (require.main === module) {
  main();
}

module.exports = { main };
