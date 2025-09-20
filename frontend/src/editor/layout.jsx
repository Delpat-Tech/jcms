import React from 'react';
import Layout from '../components/shared/Layout';

export default function UserLayout({ children, title = "Editor" }) {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <Layout title={title} user={user}>
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </Layout>
    </div>
  );
}