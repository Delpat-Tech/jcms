// @ts-nocheck
import React, { useMemo, useState } from 'react';
import UserLayout from '../layout.tsx';
import Button from '../../components/ui/Button.jsx';
import { profileApi } from '../../api';

export default function UserProfilePage() {
  const [profile, setProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  });
  const [name, setName] = useState(profile?.name || profile?.username || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [strength, setStrength] = useState(0);
  const [hint, setHint] = useState('');

  const apiBase = useMemo(() => (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) ? process.env.REACT_APP_API_URL : '', []);
  const authHeaders = () => ({ 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });

  const handleUpdateProfile = async () => {
    setSaving(true); setMessage(''); setError('');
    try {
      const res = await profileApi.update({ name, email, username });
      const data = await res.json();
      if (data && data.success !== false) {
        setMessage('Profile updated');
        const updated = { ...(profile || {}), name, email, username };
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
    if (!newPassword || newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    // frontend policy mirror
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
        setMessage('Password changed');
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      } else {
        setError(data?.message || 'Failed to change password');
      }
    } catch (e) {
      setError('Failed to change password');
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

  return (
    <UserLayout title="Profile">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Profile Settings</h1>
        </div>

        {message && <div className="text-sm text-green-600">{message}</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border space-y-3">
            <div className="text-sm font-medium text-gray-900">Personal Info</div>
            <label className="text-xs text-gray-600">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="border rounded px-3 py-2 text-sm" />
            <label className="text-xs text-gray-600">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="border rounded px-3 py-2 text-sm" />
            <div className="flex justify-end">
              <Button onClick={handleUpdateProfile} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border space-y-3">
            <div className="text-sm font-medium text-gray-900">Account</div>
            <label className="text-xs text-gray-600">Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="border rounded px-3 py-2 text-sm" />
            <div className="flex justify-end">
              <Button variant="secondary" onClick={handleChangeUsername} disabled={saving}>Change Username</Button>
            </div>
            <div className="h-px bg-gray-200 my-2" />
            <label className="text-xs text-gray-600">Current Password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="border rounded px-3 py-2 text-sm" />
            <label className="text-xs text-gray-600">New Password</label>
            <input type="password" value={newPassword} onChange={(e) => {
              const v = e.target.value; setNewPassword(v);
              let s = 0; if (v.length >= 8) s++; if (/[A-Z]/.test(v)) s++; if (/[a-z]/.test(v)) s++; if (/[0-9]/.test(v)) s++; if (/[^A-Za-z0-9]/.test(v)) s++; setStrength(s);
              const m = []; if (v && v.length < 8) m.push('8+ chars'); if (v && !/[A-Z]/.test(v)) m.push('uppercase'); if (v && !/[a-z]/.test(v)) m.push('lowercase'); if (v && !/[0-9]/.test(v)) m.push('number'); if (v && !/[^A-Za-z0-9]/.test(v)) m.push('special'); setHint(m.length?`Missing: ${m.join(', ')}`:'Looks good');
            }} className="border rounded px-3 py-2 text-sm" />
            <div className="h-2 bg-gray-200 rounded mt-1"><div className={`h-2 rounded ${strength<=2?'bg-red-500':strength===3?'bg-yellow-500':strength===4?'bg-blue-500':'bg-green-600'}`} style={{width: `${(strength/5)*100}%`}} /></div>
            {newPassword && <div className="text-xs text-gray-600">{hint}</div>}
            <label className="text-xs text-gray-600">Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="border rounded px-3 py-2 text-sm" />
            <div className="flex justify-end">
              <Button variant="destructive" onClick={handleChangePassword} disabled={saving}>Change Password</Button>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
