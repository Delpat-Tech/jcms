import React from 'react';
import Layout from '../components/shared/Layout';

interface UserLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function UserLayout({ children, title = "Editor" }: UserLayoutProps) {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  return (
    <Layout title={title} user={user}>
      {children}
    </Layout>
  );
}
