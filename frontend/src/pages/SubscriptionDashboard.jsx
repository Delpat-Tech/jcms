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

  // Available plans
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState('');

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const res = await subscriptionApi.getStatus();
        const data = await res.json();
        setStatus(data);
      } catch (e) {
        setStatusError(e.message || 'Failed to load subscription status');
      } finally {
        setStatusLoading(false);
      }
    };
    loadStatus();
  }, []);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const res = await subscriptionApi.getPlans();
        const data = await res.json();
        setPlans(data || []);
      } catch (e) {
        setPlansError(e.message || 'Failed to load plans');
      } finally {
        setPlansLoading(false);
      }
    };
    loadPlans();
  }, []);

  const handleChoose = (planName) => {
    window.location.href = `/subscribe?plan=${encodeURIComponent(planName)}`;
  };

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
              <div className="mb-2"><span className="font-semibold">Plan:</span> {status.plan}</div>
              <div className="mb-2"><span className="font-semibold">Active:</span> {String(status.active)}</div>
              {status.paymentStatus && (
                <div className="mb-2"><span className="font-semibold">Payment:</span> {status.paymentStatus}</div>
              )}
              {status.expiresAt && (
                <div className="mb-2"><span className="font-semibold">Expires:</span> {new Date(status.expiresAt).toLocaleString()}</div>
              )}
            </div>
          ) : (
            <div>No subscription information found.</div>
          )}
        </section>

        {/* Available Plans */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Available Plans</h2>
          {plansLoading ? (
            <div>Loading plans...</div>
          ) : plansError ? (
            <div className="text-red-600">{plansError}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {plans.map((p) => (
                <div key={p.name} className={`border rounded-lg p-4 shadow-sm bg-white ${status?.plan === p.name ? 'ring-2 ring-indigo-400' : ''}`}>
                  <h3 className="text-lg font-semibold mb-2">{p.displayName}</h3>
                  <div className="text-2xl font-bold mb-2">{p.priceCents === 0 ? 'Free' : `$${(p.priceCents/100).toFixed(2)}/${p.durationDays || 30}d`}</div>
                  <ul className="text-sm text-gray-700 mb-4 list-disc pl-5">
                    {Array.isArray(p.features) && p.features.map((f, idx) => (
                      <li key={idx}>{f}</li>
                    ))}
                  </ul>
                  {status?.plan === p.name ? (
                    <Button disabled>Current Plan</Button>
                  ) : (
                    <Button onClick={() => handleChoose(p.name)}>Choose {p.displayName}</Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
