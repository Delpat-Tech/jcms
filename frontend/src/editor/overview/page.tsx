import React, { useEffect, useState } from 'react';
import UserLayout from '../layout.tsx';
import Button from "../../components/ui/Button.jsx";

export default function UserOverview() {
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
    <UserLayout title="Editor Dashboard">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Your Tasks</h2>
          <Button variant="secondary" onClick={handleLogout}>Logout</Button>
        </div>
        <ul className="grid gap-3 md:grid-cols-3">
          <li className="rounded-md border bg-white p-4 shadow-sm">Create Articles</li>
          <li className="rounded-md border bg-white p-4 shadow-sm">Edit Articles</li>
          <li className="rounded-md border bg-white p-4 shadow-sm">Publish Articles</li>
        </ul>
      </div>
    </UserLayout>
  );
}
