import React, { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

function Layout({ children, title, user }) {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const handleOpenMenu = () => setSidebarOpen(true);
	const handleCloseMenu = () => setSidebarOpen(false);

	const role = user?.role?.toLowerCase();
	let menuItems = [];
	if (role === "superadmin") {
		menuItems = [
			{ href: "/superadmin/overview", label: "Overview" },
			{ href: "/superadmin/users", label: "Users" },
			{ href: "/superadmin/media", label: "Media" },
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
			{ href: "/user/overview", label: "Dashboard" },
			{ href: "/user/content", label: "Content" },
			{ href: "/user/media", label: "Media" },
			{ href: "/user/profile", label: "Profile" },
			{ href: "/user/help", label: "Help" },
		];
	} else {
		menuItems = [
			{ href: "/dashboard", label: "Dashboard" },
		];
	}
	return (
		<div className="min-h-screen" style={{ backgroundColor: 'var(--bg-color, #F9FAFB)', color: 'var(--text-color, #111827)' }}>
			<Header title={title} user={user} onMenuClick={handleOpenMenu} />
			<div className="flex">
				<Sidebar title={title} menuItems={menuItems} user={user} isOpen={sidebarOpen} onClose={handleCloseMenu} onLinkClick={handleCloseMenu} />
				<main className="flex-1 min-h-[calc(100vh-56px-56px)] px-4 py-6" style={{ marginLeft: 'var(--sidebar-width, 200px)' }}>{children}</main>
			</div>
			<Footer />
		</div>
	);
}

export default Layout;
