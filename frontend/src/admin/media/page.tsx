import React from "react";
import Layout from "../../components/shared/Layout.jsx";
import MediaPage from "../../pages/MediaPage.jsx";

export default function AdminMediaPage() {
	const user = JSON.parse(localStorage.getItem("user") || "null");

	return (
		<Layout title="Media Management" user={user}>
			<MediaPage />
		</Layout>
	);
}
