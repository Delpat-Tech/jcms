import React, { useState, useEffect } from 'react';
import { User as UserIcon, CalendarDays, FileText, Eye, AlertTriangle, CheckCircle2, Lock, Save, BarChart3 } from 'lucide-react';
import UserLayout from '../layout.jsx';
import TrioLoader from '../../components/ui/TrioLoader';
import { profileApi } from '../../api';

export default function UserProfilePage() {
  const [profile, setProfile] = useState(() => {
    try { 
      return JSON.parse(localStorage.getItem('user') || 'null'); 
    } catch { 
      return null; 
    }
  });

  // Form states
  const [username, setUsername] = useState(profile?.username || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState(profile?.firstName || '');
  const [lastName, setLastName] = useState(profile?.lastName || '');
  const [bio, setBio] = useState(profile?.bio || '');

  // UI states
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [strength, setStrength] = useState(0);
  const [hint, setHint] = useState('');

  // Statistics
  const [stats, setStats] = useState({
    contentCreated: 0,
    drafts: 0,
    published: 0,
    scheduled: 0,
    totalViews: 0,
    joinDate: profile?.createdAt || new Date().toISOString()
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    // Load user statistics on component mount
    fetchUserStats();
    
    // Auto-clear messages after 3 seconds
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage('');
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  const fetchUserStats = async () => {
    setStatsLoading(true);
    try {
      const authHeaders = {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      };
      
      // Fetch content statistics
      const contentResponse = await fetch('http://localhost:5000/api/content', {
        headers: authHeaders
      });
      
      if (contentResponse.ok) {
        const contentData = await contentResponse.json();
        const content = contentData.data || [];
        
        // Calculate statistics from real data
        const drafts = content.filter(item => item.status === 'draft').length;
        const published = content.filter(item => item.status === 'published').length;
        const scheduled = content.filter(item => item.status === 'scheduled').length;
        const totalViews = content.reduce((sum, item) => sum + (item.views || 0), 0);
        
        setStats({
          contentCreated: content.length,
          drafts,
          published,
          scheduled,
          totalViews,
          joinDate: profile?.createdAt || new Date().toISOString()
        });
      } else {
        // Fallback to zero values if API fails
        setStats({
          contentCreated: 0,
          drafts: 0,
          published: 0,
          scheduled: 0,
          totalViews: 0,
          joinDate: profile?.createdAt || new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      // Fallback to zero values on error
      setStats({
        contentCreated: 0,
        drafts: 0,
        published: 0,
        scheduled: 0,
        totalViews: 0,
        joinDate: profile?.createdAt || new Date().toISOString()
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const showMessage = (msg, isError = false) => {
    if (isError) {
      setError(msg);
      setMessage('');
    } else {
      setMessage(msg);
      setError('');
    }
  };

  // ... existing functions (validatePassword, calculatePasswordStrength, etc.)
  const validatePassword = (password) => {
    const missing = [];
    if (password.length < 8) missing.push('8+ characters');
    if (!/[A-Z]/.test(password)) missing.push('uppercase letter');
    if (!/[a-z]/.test(password)) missing.push('lowercase letter');
    if (!/[0-9]/.test(password)) missing.push('number');
    if (!/[^A-Za-z0-9]/.test(password)) missing.push('special character');
    return missing;
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const handlePasswordChange = (value) => {
    setNewPassword(value);
    const strength = calculatePasswordStrength(value);
    setStrength(strength);
    
    if (value) {
      const missing = validatePassword(value);
      setHint(missing.length ? `Missing: ${missing.join(', ')}` : 'Strong password! ✓');
    } else {
      setHint('');
    }
  };

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      const profileData = { username, firstName, lastName, bio };
      const res = await profileApi.update(profileData);
      const data = await res.json();
      
      if (data && data.success !== false) {
        showMessage('Profile updated successfully! ✓');
        const updated = { ...profile, ...profileData };
        setProfile(updated);
        localStorage.setItem('user', JSON.stringify(updated));
        // Refresh stats after profile update
        fetchUserStats();
      } else {
        showMessage(data?.message || 'Failed to update profile', true);
      }
    } catch (error) {
      showMessage('Failed to update profile', true);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      showMessage('Please enter your current password', true);
      return;
    }
    
    if (!newPassword || newPassword !== confirmPassword) {
      showMessage('New passwords do not match', true);
      return;
    }

    const missing = validatePassword(newPassword);
    if (missing.length) {
      showMessage(`Password requirements not met: ${missing.join(', ')}`, true);
      return;
    }

    setSaving(true);
    try {
      const res = await profileApi.changePassword({ currentPassword, newPassword });
      const data = await res.json();
      
      if (data && data.success !== false) {
        showMessage('Password changed successfully! ✓');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setStrength(0);
        setHint('');
      } else {
        showMessage(data?.message || 'Failed to change password', true);
      }
    } catch (error) {
      showMessage('Failed to change password', true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <UserLayout>
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-8 rounded-xl shadow-lg mb-8">
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-4xl"><UserIcon className="w-10 h-10" /></div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">
              {firstName || lastName ? `${firstName} ${lastName}`.trim() : username || 'User Profile'}
            </h1>
            <p className="text-blue-100 mb-1">@{username}</p>
            <p className="text-blue-100">{email}</p>
            <div className="flex items-center space-x-4 mt-3 text-sm text-blue-100">
              <span className="inline-flex items-center gap-1"><CalendarDays className="w-4 h-4" /> Joined {new Date(stats.joinDate).toLocaleDateString()}</span>
              <span className="inline-flex items-center gap-1"><FileText className="w-4 h-4" /> {stats.contentCreated} Content</span>
              <span className="inline-flex items-center gap-1"><Eye className="w-4 h-4" /> {stats.totalViews.toLocaleString()} Views</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {(message || error) && (
        <div className={`mb-6 p-4 rounded-lg transition-all duration-300 ${
          error 
            ? 'bg-red-100 text-red-800 border border-red-200' 
            : 'bg-green-100 text-green-800 border border-green-200'
        }`}>
          <div className="flex items-center">
            <span className="mr-2">{error ? <AlertTriangle className="inline w-5 h-5" /> : <CheckCircle2 className="inline w-5 h-5" />}</span>
            {message || error}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'general', label: (<span className="inline-flex items-center gap-2"><UserIcon className="w-4 h-4" /> General</span>) },
          { id: 'security', label: (<span className="inline-flex items-center gap-2"><Lock className="w-4 h-4" /> Security</span>) }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white text-indigo-600 shadow-md scale-[1.02]'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center"><UserIcon className="w-4 h-4 mr-2" />Personal Information</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                      placeholder="Your first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                      placeholder="Your last name"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                    placeholder="Your username"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 bg-gray-100 cursor-not-allowed"
                    placeholder="Your email address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <button
                  onClick={handleUpdateProfile}
                  disabled={saving}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 hover:scale-[1.02] disabled:scale-100"
                >
                  {saving ? <TrioLoader size="16" color="white" /> : <span className="inline-flex items-center gap-2"><Save className="w-4 h-4" /> Save Changes</span>}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center"><BarChart3 className="w-4 h-4 mr-2" />Account Statistics</h3>
              
              <div className="space-y-4">
                {statsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <TrioLoader size="32" color="#6366f1" />
                    <span className="ml-3 text-gray-600">Loading statistics...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm text-gray-600">Total Content</span>
                      <span className="font-semibold text-blue-600">{stats.contentCreated}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-sm text-gray-600">Published Articles</span>
                      <span className="font-semibold text-green-600">{stats.published}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <span className="text-sm text-gray-600">Draft Articles</span>
                      <span className="font-semibold text-yellow-600">{stats.drafts}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm text-gray-600">Scheduled Posts</span>
                      <span className="font-semibold text-purple-600">{stats.scheduled}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                      <span className="text-sm text-gray-600">Total Views</span>
                      <span className="font-semibold text-indigo-600">{stats.totalViews.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Member Since</span>
                      <span className="font-semibold text-gray-600">{new Date(stats.joinDate).toLocaleDateString()}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center"><Lock className="w-4 h-4 mr-2" />Change Password</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                    placeholder="Enter your current password"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                    placeholder="Enter your new password"
                  />
                  
                  {newPassword && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Password Strength</span>
                        <span className={`text-xs font-medium ${
                          strength <= 2 ? 'text-red-600' : 
                          strength === 3 ? 'text-yellow-600' : 
                          strength === 4 ? 'text-blue-600' : 'text-green-600'
                        }`}>
                          {strength <= 2 ? 'Weak' : strength === 3 ? 'Fair' : strength === 4 ? 'Good' : 'Strong'}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            strength <= 2 ? 'bg-red-500' : 
                            strength === 3 ? 'bg-yellow-500' : 
                            strength === 4 ? 'bg-blue-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${(strength / 5) * 100}%` }}
                        />
                      </div>
                      {hint && (
                        <p className={`text-xs mt-1 ${hint.includes('Strong') ? 'text-green-600' : 'text-gray-600'}`}>
                          {hint}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                    placeholder="Confirm your new password"
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                  )}
                </div>

                <button
                  onClick={handleChangePassword}
                  disabled={saving || !currentPassword || !newPassword || newPassword !== confirmPassword}
                  className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 hover:scale-[1.02] disabled:scale-100"
                >
                  {saving ? <TrioLoader size="16" color="white" /> : <span className="inline-flex items-center gap-2"><Lock className="w-4 h-4" /> Change Password</span>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  );
}