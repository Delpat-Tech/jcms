// src/seeds/seedCore.js
const mongoose = require('mongoose');
const User = require('../models/user');
const seedRolesAndPermissions = require('./seedRolesAndPermissions');
require('dotenv').config();

const seedCore = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🌱 Starting Core Seeding...");
    
    // Seed roles and get system tenant
    const { systemTenant } = await seedRolesAndPermissions();
    
    // Create SuperAdmin
    console.log("👑 Seeding SuperAdmin User...");
    const superAdminLoginId = process.env.SUPER_ADMIN_LOGIN_ID;
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
    const superAdminPhone = process.env.SUPER_ADMIN_PHONE || null;
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || null;
    const superAdminUsername = process.env.SUPER_ADMIN_USERNAME || 'superadmin';

    if (!superAdminLoginId || !superAdminPassword) {
      console.warn("⚠️ SUPER_ADMIN_LOGIN_ID or SUPER_ADMIN_PASSWORD not set in .env. SuperAdmin password login will not be possible.");
      if (!superAdminPhone) {
        console.error("❌ CRITICAL: Neither Login ID/Password nor Phone is set for SuperAdmin. Cannot seed Super Admin user.");
        throw new Error("SuperAdmin credentials not configured");
      }
    }

    let saUser = null;
    if (superAdminLoginId) {
      saUser = await User.findOne({ username: superAdminLoginId, tenant: systemTenant._id });
    }
    if (!saUser && superAdminPhone) {
      saUser = await User.findOne({ phone: superAdminPhone, tenant: systemTenant._id });
    }
    if (!saUser && superAdminEmail) {
      saUser = await User.findOne({ email: superAdminEmail, tenant: systemTenant._id });
    }

    if (!saUser) {
      console.log(`Creating SuperAdmin user (Login ID: ${superAdminLoginId || "N/A"}, Phone: ${superAdminPhone || "N/A"})...`);
      saUser = await User.create({
        username: superAdminLoginId || superAdminUsername,
        email: superAdminEmail,
        phone: superAdminPhone,
        password: superAdminPassword,
        role: 'admin',
        tenant: systemTenant._id,
        isVerified: true
      });
      console.log(`✅ SuperAdmin user created with ID: ${saUser._id}`);
    } else {
      let updated = false;
      if (saUser.role !== 'admin') {
        saUser.role = 'admin';
        updated = true;
      }
      if (superAdminLoginId && saUser.username !== superAdminLoginId) {
        saUser.username = superAdminLoginId;
        updated = true;
      }
      if (superAdminPhone && saUser.phone !== superAdminPhone) {
        saUser.phone = superAdminPhone;
        updated = true;
      }
      if (superAdminEmail && saUser.email !== superAdminEmail) {
        saUser.email = superAdminEmail;
        updated = true;
      }
      if (!saUser.isVerified) {
        saUser.isVerified = true;
        updated = true;
      }
      if (superAdminLoginId && superAdminPassword && saUser.username === superAdminLoginId) {
        saUser.password = superAdminPassword;
        updated = true;
      }

      if (updated) {
        await saUser.save();
        console.log(`✅ Updated existing SuperAdmin user (${saUser.username || saUser.email || saUser.phone})`);
      } else {
        console.log(`ℹ️ SuperAdmin user (${saUser.username || saUser.email || saUser.phone}) already exists and is configured`);
      }
    }

    console.log("🎉 Core seeding completed!");
    console.log(`👤 Login ID: ${superAdminLoginId || "N/A"}`);
    console.log(`📧 Email: ${superAdminEmail || "N/A"}`);
    console.log(`📱 Phone: ${superAdminPhone || "N/A"}`);
    console.log(`🔑 Password: ${superAdminPassword}`);
    console.log(`🏢 Tenant ID: ${systemTenant._id}`);
    
    return { systemTenant, superAdminUser: saUser };
    
  } catch (error) {
    console.error('❌ Core seeding error:', error.message);
    throw error;
  }
};

module.exports = seedCore;