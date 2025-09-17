import React from 'react';
import SuperAdminLayout from '../layout.tsx';

export default function TenantsPage() {
  return (
    <SuperAdminLayout title="Tenant Management">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Tenant Management</h1>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600">Tenant management functionality will be implemented here.</p>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
