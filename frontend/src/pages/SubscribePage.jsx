import React, { useState, useEffect } from 'react';
import Layout from '../components/shared/Layout.jsx';

const SubscribePage = () => {
  const [prices, setPrices] = useState({ Monthly: 10, Yearly: 100 });
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchPrices();
    fetchSubscriptionStatus();
  }, []);

  const fetchPrices = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/subscription/prices`);
      const data = await response.json();
      if (data.success) {
        setPrices(data.data.prices);
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  };

  const fetchSubscriptionStatus = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/subscription/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setSubscriptionStatus(data.data);
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    }
  };

  const handleSubscribe = async (subtype) => {
    if (!token) {
      alert('Please login first');
      return;
    }

    setLoading(true);
    
    try {
      // Create Razorpay order
      const orderResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/subscription/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subtype })
      });

      const orderData = await orderResponse.json();
      
      if (!orderData.success) {
        throw new Error(orderData.message);
      }

      // Initialize Razorpay checkout
      const options = {
        key: orderData.data.keyId,
        amount: orderData.data.order.amount,
        currency: orderData.data.currency,
        name: 'JCMS Subscription',
        description: `${subtype} Subscription`,
        order_id: orderData.data.order.id,
        handler: function (response) {
          alert('Payment successful! Your subscription is now active.');
          fetchSubscriptionStatus();
        },
        prefill: {
          name: user.username || user.name,
          email: user.email
        },
        method: {
          netbanking: true,
          card: true,
          upi: true,
          wallet: true
        },
        theme: {
          color: '#667eea'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error creating order: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Subscription Plans" user={user}>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-gray-600">
              Unlock premium features with our affordable subscription plans
            </p>
          </div>

          {/* Current Subscription Status */}
          <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Current Subscription</h2>
            {subscriptionStatus?.hasActiveSubscription ? (
              <div className="text-green-600">
                <p className="font-medium">✅ Active Subscription</p>
                <p>Plan: {subscriptionStatus.subscription?.subscriptionType || 'N/A'}</p>
                <p>Active: {subscriptionStatus.subscription?.isActive ? 'Yes' : 'No'}</p>
                <p>Expires: {subscriptionStatus.subscription?.endDate ? new Date(subscriptionStatus.subscription.endDate).toLocaleDateString() : 'N/A'}</p>
              </div>
            ) : (
              <div className="text-red-600">
                <p className="font-medium">❌ No Active Subscription</p>
                <p>Plan: None</p>
                <p>Active: No</p>
                <p>Subscribe now to access premium features</p>
              </div>
            )}
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Available Plans</h2>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Monthly Plan */}
            <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-gray-200 hover:border-blue-500 transition-colors">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Monthly Plan</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-blue-600">₹{prices.Monthly}</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Full access to all features
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Unlimited image uploads
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Priority support
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Monthly billing
                  </li>
                </ul>
                <button
                  onClick={() => handleSubscribe('Monthly')}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Processing...' : 'Subscribe Monthly'}
                </button>
              </div>
            </div>

            {/* Yearly Plan */}
            <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-green-500 hover:border-green-600 transition-colors relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Best Value
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Yearly Plan</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-green-600">₹{prices.Yearly}</span>
                  <span className="text-gray-600">/year</span>
                  <div className="text-sm text-green-600 font-medium">
                    Save ₹{(prices.Monthly * 12) - prices.Yearly} per year!
                  </div>
                </div>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Full access to all features
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Unlimited image uploads
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Priority support
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Annual billing (save money!)
                  </li>
                </ul>
                <button
                  onClick={() => handleSubscribe('Yearly')}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Processing...' : 'Subscribe Yearly'}
                </button>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-16 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              What's Included
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6">
                <div className="text-4xl mb-4">🖼️</div>
                <h3 className="text-xl font-semibold mb-2">Image Management</h3>
                <p className="text-gray-600">Upload, organize, and manage your images with our powerful tools</p>
              </div>
              <div className="p-6">
                <div className="text-4xl mb-4">☁️</div>
                <h3 className="text-xl font-semibold mb-2">Cloud Storage</h3>
                <p className="text-gray-600">Secure cloud storage with automatic backups and sync</p>
              </div>
              <div className="p-6">
                <div className="text-4xl mb-4">🔒</div>
                <h3 className="text-xl font-semibold mb-2">Security</h3>
                <p className="text-gray-600">Enterprise-grade security with role-based access control</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Razorpay Script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    </Layout>
  );
};

export default SubscribePage;