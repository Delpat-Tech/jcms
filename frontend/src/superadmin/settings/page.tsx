import React from 'react';
import SuperAdminLayout from '../layout.tsx';

export default function SettingsPage() {
  return (
    <SuperAdminLayout title="System Settings">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">System Settings</h1>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600">System settings functionality will be implemented here.</p>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
