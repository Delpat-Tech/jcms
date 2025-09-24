import React, { useEffect, useState } from 'react';
import { subscriptionApi } from '../api';

export default function SubscriptionDashboard() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await subscriptionApi.getStatus();
        const data = await res.json();
        setStatus(data);
      } catch (e) {
        setError(e.message || 'Failed to load subscription status');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Subscription</h1>
      {status ? (
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

      <div className="mt-4">
        <a href="/plans" className="text-blue-600 hover:text-blue-800 underline">Change plan</a>
      </div>
    </div>
  );
}
