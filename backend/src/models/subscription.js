const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  subscriptionType: {
    type: String,
    enum: ['Monthly', 'Yearly'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isExpired: {
    type: Boolean,
    default: false
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Pre-save middleware to check expiry
subscriptionSchema.pre('save', function(next) {
  const currentDate = new Date();
  if (this.endDate < currentDate) {
    this.isExpired = true;
    this.isActive = false;
  }
  next();
});

// Pre-find middleware to update expired subscriptions
subscriptionSchema.pre(/^find/, async function(next) {
  try {
    const currentDate = new Date();
    await this.model.updateMany(
      { endDate: { $lt: currentDate }, isExpired: false },
      { $set: { isExpired: true, isActive: false } }
    );
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);