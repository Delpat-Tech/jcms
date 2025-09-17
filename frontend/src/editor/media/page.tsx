import React from 'react';
import UserLayout from '../layout.tsx';
import MediaPage from '../../pages/MediaPage.jsx';

export default function UserMediaPage() {
  return (
    <UserLayout title="Media Management">
      <MediaPage />
    </UserLayout>
  );
}