require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/user');
const Role = require('./src/models/role');

async function fixUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const user = await User.findOne({username: 'superadmin'}).populate('role');
    console.log('User found:', user ? 'Yes' : 'No');
    console.log('User role:', user?.role?.name || 'No role assigned');
    
    if (user && !user.role) {
      const superadminRole = await Role.findOne({name: 'superadmin'});
      console.log('SuperAdmin role found:', superadminRole ? 'Yes' : 'No');
      
      if (superadminRole) {
        user.role = superadminRole._id;
        await user.save();
        console.log('Role assigned successfully');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixUser();