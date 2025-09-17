import React from 'react';
import AdminLayout from '../layout.tsx';

export default function AdminProfilePage() {
  return (
    <AdminLayout title="Profile">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Profile Settings</h1>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600">Profile management for admin users.</p>
        </div>
      </div>
    </AdminLayout>
  );
}
