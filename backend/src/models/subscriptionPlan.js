const mongoose = require('mongoose');

const SubscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, enum: ['free', 'standard', 'premium'], required: true, unique: true },
  displayName: { type: String, required: true },
  priceCents: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD' },
  durationDays: { type: Number, default: 30 },
  features: [{ type: String }],
  limits: {
    maxArticles: { type: Number, default: 5 },
    premiumMedia: { type: Boolean, default: false }
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);
