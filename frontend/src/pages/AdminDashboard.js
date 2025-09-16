import { useEffect, useState } from 'react';
import Layout from "../components/shared/Layout";
import Button from "../components/ui/Button";

export default function AdminDashboard() {
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
    <Layout title="Admin" user={user}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Overview</h2>
          <Button variant="secondary" onClick={handleLogout}>Logout</Button>
        </div>
        <ul className="grid gap-3 md:grid-cols-3">
          <li className="rounded-md border bg-white p-4 shadow-sm">Manage Content</li>
          <li className="rounded-md border bg-white p-4 shadow-sm">View Analytics</li>
          <li className="rounded-md border bg-white p-4 shadow-sm">Manage Editors</li>
        </ul>
      </div>
    </Layout>
  );
}
