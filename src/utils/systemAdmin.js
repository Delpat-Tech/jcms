// utils/systemAdmin.js
const Tenant = require('../models/tenant');

let systemTenantId = null;

const getSystemTenantId = async () => {
  if (!systemTenantId) {
    const systemTenant = await Tenant.findOne({ subdomain: 'system' });
    systemTenantId = systemTenant?._id?.toString();
  }
  return systemTenantId;
};

const isSystemAdmin = async (user) => {
  if (!user || user.role !== 'admin') return false;
  const systemId = await getSystemTenantId();
  return user.tenant.toString() === systemId;
};

module.exports = { isSystemAdmin, getSystemTenantId };