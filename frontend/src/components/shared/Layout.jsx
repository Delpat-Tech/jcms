import React from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

function Layout({ children, title, user }) {
	const role = user?.role?.toLowerCase();
	let menuItems = [];
	if (role === "superadmin") {
		menuItems = [
			{ href: "/superadmin/overview", label: "Overview" },
			{ href: "/superadmin/users", label: "Users" },
			{ href: "/superadmin/roles", label: "Roles" },
			{ href: "/superadmin/settings", label: "System Settings" },
			{ href: "/superadmin/analytics", label: "Analytics" },
			{ href: "/superadmin/tenants", label: "Tenants" },
		];
	} else if (role === "admin") {
		menuItems = [
			{ href: "/admin/overview", label: "Overview" },
			{ href: "/admin/content", label: "Content" },
			{ href: "/admin/media", label: "Media" },
			{ href: "/admin/users", label: "Users" },
			{ href: "/admin/analytics", label: "Analytics" },
			{ href: "/admin/profile", label: "Profile" },
		];
	} else if (role === "editor") {
		menuItems = [
			{ href: "/user/overview", label: "Overview" },
			{ href: "/user/content", label: "Content" },
			{ href: "/user/media", label: "Media" },
			{ href: "/user/profile", label: "Profile" },
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
