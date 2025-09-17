import React from 'react';
import AdminLayout from '../layout.tsx';

export default function AdminUsersPage() {
  return (
    <AdminLayout title="User Management">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">User Management</h1>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600">User management functionality for admin users.</p>
        </div>
      </div>
    </AdminLayout>
  );
}
