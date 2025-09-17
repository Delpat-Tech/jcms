import React from 'react';
import UserLayout from '../layout.tsx';

export default function UserProfilePage() {
  return (
    <UserLayout title="Profile">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Profile Settings</h1>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600">Profile management for editor users.</p>
        </div>
      </div>
    </UserLayout>
  );
}
