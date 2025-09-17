import React from 'react';
import Layout from '../components/shared/Layout';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function SuperAdminLayout({ children, title = "Super Admin" }: SuperAdminLayoutProps) {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  return (
    <Layout title={title} user={user}>
      {children}
    </Layout>
  );
}
