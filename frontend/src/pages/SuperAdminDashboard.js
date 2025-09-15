import { useEffect, useState } from 'react';

export default function SuperAdminDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Super Admin Dashboard</h1>
        <div>
          {user && <span>Welcome, {user.username}</span>}
          <button onClick={handleLogout} style={{ marginLeft: '10px' }}>Logout</button>
        </div>
      </div>
      <ul>
        <li>Manage Users</li>
        <li>Manage Roles</li>
        <li>System Settings</li>
        <li>Analytics</li>
        <li>Content Management</li>
      </ul>
    </div>
  );
}
