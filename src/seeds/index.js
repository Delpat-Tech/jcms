// src/seeds/index.js
const seedCore = require('./seedCore');
const seedMain = require('./seedMain');
const seedEmpty = require('./seedEmpty');
const seedRolesAndPermissions = require('./seedRolesAndPermissions');

module.exports = {
  seedCore,
  seedMain,
  seedEmpty,
  seedRolesAndPermissions
};