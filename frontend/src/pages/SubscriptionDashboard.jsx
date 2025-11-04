import React, { useEffect, useState } from 'react';
import { subscriptionApi } from '../api';
import Button from "../components/ui/Button.jsx";
import Layout from '../components/shared/Layout.jsx';

export default function SubscriptionPage() {
  // Get user for Layout
  const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user") || 'null';
  const user = JSON.parse(storedUser);

  // Current subscription status
  const [status, setStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState('');



  useEffect(() => {
    const loadStatus = async () => {
      try {
        const res = await subscriptionApi.getStatus();
        const data = await res.json();
        if (data.success) {
          setStatus(data.data);
        } else {
          setStatusError(data.message || 'Failed to load subscription status');
        }
      } catch (e) {
        setStatusError(e.message || 'Failed to load subscription status');
      } finally {
        setStatusLoading(false);
      }
    };
    loadStatus();
  }, []);





  return (
    <Layout title="Subscription" user={user}>
      <div className="p-0 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Subscription</h1>

        {/* Current Subscription */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">Current Subscription</h2>
          {statusLoading ? (
            <div>Loading current subscription...</div>
          ) : statusError ? (
            <div className="text-red-600">{statusError}</div>
          ) : status ? (
            <div className="bg-white border rounded-md p-4 shadow-sm">
              {status.hasActiveSubscription && status.subscription ? (
                <>
                  <div className="mb-2"><span className="font-semibold">Plan:</span> {status.subscription.subscriptionType}</div>
                  <div className="mb-2"><span className="font-semibold">Active:</span> {String(status.subscription.isActive && !status.subscription.isExpired)}</div>
                  <div className="mb-2"><span className="font-semibold">Amount:</span> ₹{status.subscription.amount}</div>
                  <div className="mb-2"><span className="font-semibold">Start Date:</span> {new Date(status.subscription.startDate).toLocaleDateString('en-GB')}</div>
                  <div className="mb-2"><span className="font-semibold">End Date:</span> {new Date(status.subscription.endDate).toLocaleDateString('en-GB')}</div>
                  {status.subscription.paymentStatus && (
                    <div className="mb-2"><span className="font-semibold">Payment:</span> {status.subscription.paymentStatus}</div>
                  )}
                </>
              ) : (
                <div className="text-gray-600">No active subscription</div>
              )}
            </div>
          ) : (
            <div>No subscription information found.</div>
          )}
        </section>

        {/* View Plans */}
        <section>
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">Subscription Plans</h2>
            <Button onClick={() => window.location.href = '/subscribe'}>View Plans</Button>
          </div>
        </section>
      </div>
    </Layout>
  );
}
