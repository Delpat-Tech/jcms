import React from "react";
import SuperAdminLayout from "../layout.tsx";
import MediaPage from "../../pages/MediaPage.jsx";

export default function SuperAdminMediaPage() {
  return (
    <SuperAdminLayout title="Media Management">
      <MediaPage />
    </SuperAdminLayout>
  );
}
