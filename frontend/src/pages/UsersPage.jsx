import React from "react";
import Layout from "../components/shared/Layout";
import Table from "../components/ui/Table";

const columns = [
	{ header: "Name", accessor: "name" },
	{ header: "Email", accessor: "email" },
	{ header: "Role", accessor: "role" },
];

const data = [
	{ name: "Alice", email: "alice@example.com", role: "Editor" },
	{ name: "Bob", email: "bob@example.com", role: "Admin" },
];

export default function UsersPage() {
	const user = JSON.parse(localStorage.getItem("user") || "null");
	return (
		<Layout title="Users" user={user}>
			<Table columns={columns} data={data} />
		</Layout>
	);
}
