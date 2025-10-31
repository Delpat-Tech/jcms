import React, { useEffect, useState } from 'react';
import { subscriptionApi } from '../api';
import Button from "../components/ui/Button.jsx";
import Layout from '../components/shared/Layout.jsx';

export default function SubscriptionPage() {
  const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user") || 'null';
  const user = JSON.parse(storedUser);

  const [status, setStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState('');

  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState('');

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [message, setMessage] = useState('');

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

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await subscriptionApi.getHistory();
        const data = await res.json();
        setHistory(data.success ? data.data : []);
      } catch (e) {
        console.error('Failed to load history:', e);
      } finally {
        setHistoryLoading(false);
      }
    };
    loadHistory();
  }, []);

  const handleChoose = (planName) => {
    window.location.href = `/subscribe?plan=${encodeURIComponent(planName)}`;
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription?')) return;
    try {
      const res = await subscriptionApi.cancel();
      const data = await res.json();
      if (data.success) {
        setMessage('Subscription canceled successfully');
        setStatus({ ...status, active: false });
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (e) {
      setMessage('Failed to cancel subscription: ' + e.message);
    }
  };

  const viewInvoice = async (invoiceId) => {
    try {
      const res = await subscriptionApi.getInvoice(invoiceId);
      const data = await res.json();
      if (data.success) {
        alert(JSON.stringify(data.data, null, 2));
      }
    } catch (e) {
      alert('Failed to load invoice');
    }
  };

  return (
    <Layout title="Subscription" user={user}>
      <div className="p-0 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Subscription</h1>

        {message && (
          <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded">{message}</div>
        )}

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
              {status.active && status.plan !== 'free' && (
                <div className="mt-4">
                  <Button onClick={handleCancel} className="bg-red-600 hover:bg-red-700 text-white">Cancel Subscription</Button>
                </div>
              )}
            </div>
          ) : (
            <div>No subscription information found.</div>
          )}
        </section>

        {/* Available Plans */}
        <section className="mb-10">
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

        {/* Payment History */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Payment History</h2>
          {historyLoading ? (
            <div>Loading payment history...</div>
          ) : history.length === 0 ? (
            <div className="text-gray-600">No payment history found.</div>
          ) : (
            <div className="bg-white border rounded-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Invoice</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Plan</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Amount</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Date</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((inv) => (
                    <tr key={inv._id} className="border-t">
                      <td className="px-4 py-2 text-sm">{inv.invoiceNumber}</td>
                      <td className="px-4 py-2 text-sm capitalize">{inv.plan}</td>
                      <td className="px-4 py-2 text-sm">${(inv.amount / 100).toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          inv.status === 'paid' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm">{new Date(inv.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-2 text-sm">
                        <button onClick={() => viewInvoice(inv._id)} className="text-blue-600 hover:underline">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
