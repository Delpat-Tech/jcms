// pages/ContentPage.jsx
import React from 'react';
import Layout from '../components/shared/Layout.jsx';
import ImageCollectionManager from '../components/ImageCollectionManager.jsx';

export default function ContentPage() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  return (
    <Layout title="Content Management" user={user}>
      <div className="min-h-screen bg-gray-50">
        <ImageCollectionManager />
      </div>
    </Layout>
  );
}
