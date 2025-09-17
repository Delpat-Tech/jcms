import React from 'react';
import Layout from '../components/shared/Layout';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AdminLayout({ children, title = "Admin" }: AdminLayoutProps) {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  return (
    <Layout title={title} user={user}>
      {children}
    </Layout>
  );
}
