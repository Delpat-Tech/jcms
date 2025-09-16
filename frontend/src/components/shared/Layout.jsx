import React from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

function Layout({ children, title, user }) {
	const role = user?.role?.toLowerCase();
	let menuItems = [];
	if (role === "superadmin") {
		menuItems = [
			{ href: "/dashboard", label: "Dashboard" },
			{ href: "/dashboard/users", label: "Users" },
			{ href: "/dashboard/roles", label: "Roles" },
			{ href: "/dashboard/settings", label: "System Settings" },
			{ href: "/dashboard/analytics", label: "Analytics" },
			{ href: "/dashboard/content", label: "Content Management" },
		];
	} else if (role === "admin") {
		menuItems = [
			{ href: "/dashboard", label: "Dashboard" },
			{ href: "/dashboard/content", label: "Content" },
			{ href: "/dashboard/media", label: "Media" },
			{ href: "/dashboard/users", label: "Users" },
			{ href: "/dashboard/analytics", label: "Analytics" },
		];
	} else if (role === "editor") {
		menuItems = [
			{ href: "/dashboard", label: "Dashboard" },
			{ href: "/dashboard/content", label: "Content" },
			{ href: "/dashboard/media", label: "Media" },
		];
	} else {
		menuItems = [
			{ href: "/dashboard", label: "Dashboard" },
		];
	}
	return (
		<div className="min-h-screen bg-gray-50">
			<Header title={title} user={user} />
			<div className="flex">
				<Sidebar title={title} menuItems={menuItems} user={user} />
				<main className="flex-1 min-h-[calc(100vh-56px-56px)] px-4 py-6 md:ml-64">{children}</main>
			</div>
			<Footer />
		</div>
	);
}

export default Layout;
