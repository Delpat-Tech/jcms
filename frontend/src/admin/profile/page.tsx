import React, { useMemo, useState, useEffect } from 'react';
import AdminLayout from '../layout.tsx';
import Button from '../../components/ui/Button.jsx';
import { profileApi, subscriptionApi } from '../../api';

export default function AdminProfilePage() {
  const [profile, setProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  });
  const [username, setUsername] = useState(profile?.username || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [strength, setStrength] = useState(0);
  const [hint, setHint] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'password' | 'subscription'>('info');
  
  // Subscription state
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  const handleUpdateProfile = async () => {
    setSaving(true); setMessage(''); setError('');
    try {
      const res = await profileApi.update({ username });
      const data = await res.json();
      if (data && data.success !== false) {
        setMessage('Profile updated');
        const updated = { ...(profile || {}), username, email };
        setProfile(updated);
        localStorage.setItem('user', JSON.stringify(updated));
      } else {
        setError(data?.message || 'Failed to update profile');
      }
    } catch (e) {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) { setError('Current password is required'); return; }
    if (!newPassword) { setError('New password is required'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    const missing = [];
    if (newPassword.length < 8) missing.push('8+ chars');
    if (!/[A-Z]/.test(newPassword)) missing.push('uppercase');
    if (!/[a-z]/.test(newPassword)) missing.push('lowercase');
    if (!/[0-9]/.test(newPassword)) missing.push('number');
    if (!/[^A-Za-z0-9]/.test(newPassword)) missing.push('special');
    if (missing.length) { setError('Password requirements not met: ' + missing.join(', ')); return; }
    setSaving(true); setMessage(''); setError('');
    try {
      const res = await profileApi.changePassword({ currentPassword, newPassword });
      const data = await res.json();
      if (data && data.success !== false) {
        setMessage('Password changed successfully');
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        setStrength(0); setHint('');
      } else {
        setError(data?.message || 'Failed to change password');
      }
    } catch (e) {
      setError(e.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleChangeUsername = async () => {
    setSaving(true); setMessage(''); setError('');
    try {
      const res = await profileApi.changeUsername({ username });
      const data = await res.json();
      if (data && data.success !== false) {
        setMessage('Username changed');
        const updated = { ...(profile || {}), username };
        setProfile(updated);
        localStorage.setItem('user', JSON.stringify(updated));
      } else {
        setError(data?.message || 'Failed to change username');
      }
    } catch (e) {
      setError('Failed to change username');
    } finally {
      setSaving(false);
    }
  };

  const fetchSubscriptionStatus = async () => {
    setSubscriptionLoading(true);
    try {
      const res = await subscriptionApi.getStatus();
      const data = await res.json();
      if (data.success) {
        setSubscriptionStatus(data.data);
      }
    } catch (e) {
      console.error('Error fetching subscription:', e);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'subscription') {
      fetchSubscriptionStatus();
    }
  }, [activeTab]);

  return (
    <AdminLayout title="Profile">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Profile Settings</h1>
        </div>

        <div className="flex border-b mb-4">
          <button
            className={`px-4 py-2 -mb-px border-b-2 font-medium text-sm focus:outline-none ${activeTab === 'info' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => { setActiveTab('info'); setMessage(''); setError(''); }}
          >
            Personal Info
          </button>
          <button
            className={`px-4 py-2 -mb-px border-b-2 font-medium text-sm focus:outline-none ${activeTab === 'password' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => { setActiveTab('password'); setMessage(''); setError(''); }}
          >
            Change Password
          </button>
          <button
            className={`px-4 py-2 -mb-px border-b-2 font-medium text-sm focus:outline-none ${activeTab === 'subscription' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => { setActiveTab('subscription'); setMessage(''); setError(''); }}
          >
            Subscription
          </button>
        </div>

        {message && <div className="text-sm text-green-600">{message}</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}

        <div>
          {activeTab === 'info' && (
            <div className="bg-white p-4 rounded-lg border space-y-3 max-w-lg mx-auto">
              <div className="text-sm font-medium text-gray-900">Personal Info</div>
              <label className="text-xs text-gray-600">Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} className="border rounded px-3 py-2 text-sm w-full" />
              <label className="text-xs text-gray-600">Email</label>
              <input value={email} readOnly className="border rounded px-3 py-2 text-sm w-full bg-gray-100 cursor-not-allowed" />
              <div className="flex justify-end">
                <Button onClick={handleUpdateProfile} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="bg-white p-4 rounded-lg border space-y-3 max-w-lg mx-auto">
              <div className="text-sm font-medium text-gray-900">Change Password</div>
              <label className="text-xs text-gray-600">Current Password</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="border rounded px-3 py-2 text-sm w-full" />
              <label className="text-xs text-gray-600">New Password</label>
              <input type="password" value={newPassword} onChange={(e) => {
                const v = e.target.value; setNewPassword(v);
                let s = 0; if (v.length >= 8) s++; if (/[A-Z]/.test(v)) s++; if (/[a-z]/.test(v)) s++; if (/[0-9]/.test(v)) s++; if (/[^A-Za-z0-9]/.test(v)) s++; setStrength(s);
                const m = []; if (v && v.length < 8) m.push('8+ chars'); if (v && !/[A-Z]/.test(v)) m.push('uppercase'); if (v && !/[a-z]/.test(v)) m.push('lowercase'); if (v && !/[0-9]/.test(v)) m.push('number'); if (v && !/[^A-Za-z0-9]/.test(v)) m.push('special'); setHint(m.length?`Missing: ${m.join(', ')}`:'Looks good');
              }} className="border rounded px-3 py-2 text-sm w-full" />
              <div className="h-2 bg-gray-200 rounded mt-1"><div className={`h-2 rounded ${strength<=2?'bg-red-500':strength===3?'bg-yellow-500':strength===4?'bg-blue-500':'bg-green-600'}`} style={{width: `${(strength/5)*100}%`}} /></div>
              {newPassword && <div className="text-xs text-gray-600">{hint}</div>}
              <label className="text-xs text-gray-600">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="border rounded px-3 py-2 text-sm w-full" />
              <div className="flex justify-end">
                <Button variant="destructive" onClick={handleChangePassword} disabled={saving}>Change Password</Button>
              </div>
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="space-y-6">
              {/* Current Subscription */}
              <section>
                <h2 className="text-xl font-semibold mb-3">Current Subscription</h2>
                {subscriptionLoading ? (
                  <div>Loading subscription status...</div>
                ) : subscriptionStatus ? (
                  <div className="bg-white border rounded-md p-4 shadow-sm">
                    {subscriptionStatus.hasActiveSubscription && subscriptionStatus.subscription ? (
                      <>
                        <div className="mb-2"><span className="font-semibold">Plan:</span> {subscriptionStatus.subscription.subscriptionType}</div>
                        <div className="mb-2"><span className="font-semibold">Active:</span> {String(subscriptionStatus.subscription.isActive && !subscriptionStatus.subscription.isExpired)}</div>
                        <div className="mb-2"><span className="font-semibold">End Date:</span> {new Date(subscriptionStatus.subscription.endDate).toLocaleDateString('en-GB')}</div>
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
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
