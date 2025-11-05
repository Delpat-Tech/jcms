# JCMS Subscription Setup Guide

## Overview
This guide will help you set up Razorpay subscription system for JCMS tenants.

## Prerequisites
1. Razorpay account (sign up at https://razorpay.com)
2. JCMS backend and frontend running
3. MongoDB connection established

## Setup Steps

### 1. Install Dependencies
```bash
cd backend
npm install razorpay crypto validator
```

### 2. Get Razorpay Credentials
1. Login to your Razorpay Dashboard
2. Go to Settings → API Keys
3. Generate/Copy your Key ID and Key Secret

### 3. Configure Environment Variables
Add to your `backend/.env` file:
```env
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
```

### 4. Test the Integration
1. Start your backend: `npm run dev`
2. Start your frontend: `npm start`
3. Login to JCMS
4. Visit: `http://localhost:3000/subscribe`

## API Endpoints

### Public Endpoints
- `GET /api/subscription/prices` - Get subscription prices
- `POST /api/subscription/verify-payment` - Webhook for payment verification

### Protected Endpoints (Require Authentication)
- `POST /api/subscription/create-order` - Create Razorpay order
- `GET /api/subscription/status` - Get current subscription status
- `DELETE /api/subscription/cancel` - Cancel subscription

## Subscription Prices
- **Monthly**: ₹10/month
- **Yearly**: ₹100/year (Save ₹20!)

## Payment Flow
1. User selects subscription plan
2. Frontend calls `/api/subscription/create-order`
3. Razorpay checkout opens
4. User completes payment
5. Razorpay sends webhook to `/api/subscription/verify-payment`
6. Backend creates/updates subscription record
7. User gets access to premium features

## Database Models

### Subscription Model
```javascript
{
  tenant: ObjectId,           // Reference to tenant
  subscriptionType: String,   // 'Monthly' or 'Yearly'
  startDate: Date,           // Subscription start date
  endDate: Date,             // Subscription end date
  isActive: Boolean,         // Is subscription active
  isExpired: Boolean,        // Is subscription expired
  razorpayOrderId: String,   // Razorpay order ID
  razorpayPaymentId: String, // Razorpay payment ID
  amount: Number,            // Amount paid
  currency: String,          // Currency (INR)
  paymentStatus: String      // 'pending', 'completed', 'failed'
}
```

## Testing

### Test Mode
1. Use Razorpay test credentials
2. Use test card numbers from Razorpay docs
3. Test card: 4111 1111 1111 1111, CVV: 123, Expiry: Any future date

### Production Mode
1. Switch to live Razorpay credentials
2. Complete KYC verification on Razorpay
3. Update webhook URLs to production domain

## Webhook Configuration
1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/subscription/verify-payment`
3. Select events: `payment.captured`
4. Set webhook secret (optional but recommended)

## Security Notes
1. Never expose Razorpay Key Secret in frontend
2. Always verify webhook signatures in production
3. Use HTTPS for webhook URLs
4. Store sensitive data securely

## Troubleshooting

### Common Issues
1. **Order creation fails**: Check Razorpay credentials
2. **Payment not updating**: Verify webhook URL and events
3. **CORS errors**: Ensure proper CORS configuration
4. **Authentication errors**: Check JWT token validity

### Debug Endpoints
- `GET /api/subscription/status` - Check current subscription
- Check browser console for Razorpay errors
- Check backend logs for webhook processing

## Next Steps
1. Add subscription-based feature restrictions
2. Implement subscription renewal notifications
3. Add subscription management dashboard
4. Set up automated billing reminders

## Support
For issues with this integration, check:
1. Razorpay documentation: https://razorpay.com/docs/
2. JCMS backend logs
3. Browser developer console