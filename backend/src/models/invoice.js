const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', required: true },
  plan: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: { type: String, enum: ['paid', 'pending'], default: 'pending' },
  paymentReference: { type: String },
  billingDetails: {
    name: String,
    email: String,
    address: String
  }
}, { timestamps: true });

InvoiceSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Invoice', InvoiceSchema);
