import React from 'react';
import AdminLayout from '../layout.tsx';

export default function AdminAnalyticsPage() {
  return (
    <AdminLayout title="Analytics">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Analytics</h1>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600">Analytics overview</p>
        </div>
      </div>
    </AdminLayout>
  );
}
