import React, { useEffect, useState } from 'react';
import { subscriptionApi } from '../api';
import Button from "../components/ui/Button.jsx";

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const handleChoose = (planName) => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Save redirect target and go to login
      sessionStorage.setItem('postLoginRedirect', `/subscribe?plan=${encodeURIComponent(planName)}`);
      window.location.href = '/';
      return;
    }
    window.location.href = `/subscribe?plan=${encodeURIComponent(planName)}`;
  };

  if (loading) return <div className="p-6">Loading plans...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Choose Your Plan</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div key={p.name} className="border rounded-lg p-4 shadow-sm bg-white">
            <h2 className="text-xl font-semibold mb-2">{p.displayName}</h2>
            <div className="text-2xl font-bold mb-2">{p.priceCents === 0 ? 'Free' : `$${(p.priceCents/100).toFixed(2)}/${p.durationDays || 30}d`}</div>
            <ul className="text-sm text-gray-700 mb-4 list-disc pl-5">
              {Array.isArray(p.features) && p.features.map((f, idx) => (
                <li key={idx}>{f}</li>
              ))}
            </ul>
            <Button onClick={() => handleChoose(p.name)}>Choose {p.displayName}</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
