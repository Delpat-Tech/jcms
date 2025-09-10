// models/user.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  phone: { type: String, sparse: true, trim: true }, // sparse allows multiple null values
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    default: null // null for superadmin
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Create compound sparse index for phone and tenant
userSchema.index({ phone: 1, tenant: 1 }, { sparse: true });

// Hash password before saving the user
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('User', userSchema);