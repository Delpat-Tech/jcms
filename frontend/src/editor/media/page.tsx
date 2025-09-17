import React from 'react';
import UserLayout from '../layout.tsx';

export default function UserMediaPage() {
  return (
    <UserLayout title="Media Library">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Media Library</h1>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600">Media management for editor users.</p>
        </div>
      </div>
    </UserLayout>
  );
}