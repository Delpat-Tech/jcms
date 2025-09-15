// models/role.js
const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true 
  },
  description: { 
    type: String, 
    required: true,
    trim: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);