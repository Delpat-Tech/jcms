const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  plan: { type: String, enum: ['free', 'standard', 'premium'], required: true },
  startDate: { type: Date, required: true, default: Date.now },
  expiryDate: { type: Date, required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  paymentReference: { type: String },
  status: { type: String, enum: ['active', 'expired', 'canceled'], default: 'active' }
}, { timestamps: true });

SubscriptionSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Subscription', SubscriptionSchema);
