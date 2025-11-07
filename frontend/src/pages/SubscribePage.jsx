import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/shared/Layout.jsx';

const SubscribePage = () => {
  const navigate = useNavigate();
  // Remove hard-coded defaults; values will be provided by the controller via API
  const [prices, setPrices] = useState({});
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
      return;
    }

    setLoading(true);
    
    try {
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
        setLoading(false);
        return;
      }

      const options = {
        key: orderData.data.keyId,
        amount: orderData.data.order.amount,
        currency: orderData.data.currency,
        name: 'JCMS Subscription',
        description: `${subtype} Subscription`,
        order_id: orderData.data.order.id,
        handler: async function (response) {
          try {
            const verifyResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/subscription/verify-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                subtype: subtype
              })
            });

            const verifyData = await verifyResponse.json();
            
            if (verifyData.success) {
              const userRole = user.role?.toLowerCase();
              if (userRole === 'superadmin') {
                navigate('/superadmin/profile');
              } else if (userRole === 'admin') {
                navigate('/admin/profile');
              } else {
                navigate('/user/profile');
              }
            }
          } catch (error) {
            console.error('Error verifying payment:', error);
          } finally {
            setLoading(false);
          }
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
      
      rzp.on('payment.failed', function (response) {
        setLoading(false);
      });
      
      // Handle modal dismiss
      rzp.on('payment.cancel', function() {
        setLoading(false);
      });
      
    } catch (error) {
      console.error('Subscription error:', error);
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



          {subscriptionStatus?.hasActiveSubscription && subscriptionStatus?.subscription && (
            <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Current Plan</h3>
              <p className="text-blue-700">
                You are currently subscribed to the <strong>{subscriptionStatus.subscription.subscriptionType}</strong> plan.
                {subscriptionStatus.subscription.endDate && (
                  <span> Valid until {new Date(subscriptionStatus.subscription.endDate).toLocaleDateString('en-GB')}</span>
                )}
              </p>
            </div>
          )}

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
                  <span className="text-4xl font-bold text-blue-600">₹{prices.Monthly ?? '-'}</span>
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
                  {loading ? 'Processing...' : subscriptionStatus?.subscription?.subscriptionType === 'Monthly' ? 'Renew Monthly' : 'Subscribe Monthly'}
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
                  <span className="text-4xl font-bold text-green-600">₹{prices.Yearly ?? '-'}</span>
                  <span className="text-gray-600">/year</span>
                  <div className="text-sm text-green-600 font-medium">
                    Save ₹{((prices.Monthly ?? 0) * 12) - (prices.Yearly ?? 0)} per year!
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
                  {loading ? 'Processing...' : subscriptionStatus?.subscription?.subscriptionType === 'Yearly' ? 'Renew Yearly' : 'Subscribe Yearly'}
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