import { useEffect, useState } from 'react';
import Layout from "../components/shared/Layout";
import Button from "../components/ui/Button";

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
    <Layout title="Super Admin" user={user}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Controls</h2>
          <Button variant="secondary" onClick={handleLogout}>Logout</Button>
        </div>
        <ul className="grid gap-3 md:grid-cols-3">
          <li className="rounded-md border bg-white p-4 shadow-sm">Manage Users</li>
          <li className="rounded-md border bg-white p-4 shadow-sm">Manage Roles</li>
          <li className="rounded-md border bg-white p-4 shadow-sm">System Settings</li>
          <li className="rounded-md border bg-white p-4 shadow-sm">Analytics</li>
          <li className="rounded-md border bg-white p-4 shadow-sm">Content Management</li>
        </ul>
      </div>
    </Layout>
  );
}
