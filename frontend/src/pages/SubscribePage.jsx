import React, { useEffect, useMemo, useState } from 'react';
import { subscriptionApi } from '../api';
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";

function useQuery() {
  return useMemo(() => new URLSearchParams(window.location.search), []);
}

export default function SubscribePage() {
  const query = useQuery();
  const initialPlan = query.get('plan') || 'standard';

  const [plans, setPlans] = useState([]);
  const [plan, setPlan] = useState(initialPlan);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [card, setCard] = useState({ number: '', exp: '', cvc: '' });
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await subscriptionApi.getPlans();
        const data = await res.json();
        setPlans(data || []);
      } catch (e) {
        setError(e.message || 'Failed to load plans');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('Creating subscription...');
    try {
      const createRes = await subscriptionApi.create(plan);
      const createData = await createRes.json();
      if (!createRes.ok || !createData.success) {
        throw new Error(createData.message || 'Failed to create subscription');
      }

      // Find selected plan price to know whether to verify payment
      const p = plans.find((x) => x.name === plan);
      if (p && p.priceCents > 0) {
        setStatus('Processing payment (mock)...');
        const paymentReference = `mock_${Date.now()}`;
        const verifyRes = await subscriptionApi.verify(paymentReference);
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok || !verifyData.success) {
          throw new Error(verifyData.message || 'Payment failed');
        }
      }

      setStatus('Subscription active! Redirecting to dashboard...');
      setTimeout(() => {
        window.location.href = '/my/subscription';
      }, 1200);
    } catch (err) {
      setError(err.message || 'Subscription failed');
      setStatus(null);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Subscribe</h1>

      {error && <div className="mb-3 text-red-600">{error}</div>}
      {status && <div className="mb-3 text-green-700">{status}</div>}

      <form onSubmit={handleSubscribe} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {plans.map((p) => (
              <option key={p.name} value={p.name}>
                {p.displayName} {p.priceCents === 0 ? '(Free)' : `($${(p.priceCents/100).toFixed(2)}/${p.durationDays || 30}d)`}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Card number</label>
            <Input value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} placeholder="4242 4242 4242 4242" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
              <Input value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value })} placeholder="MM/YY" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
              <Input value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value })} placeholder="CVC" required />
            </div>
          </div>
        </div>

        <Button type="submit">Subscribe</Button>
      </form>
    </div>
  );
}
