import React, { useEffect, useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

function Layout({ children, title, user }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobileView, setIsMobileView] = useState(false);
    const handleOpenMenu = () => setSidebarOpen((prev) => !prev);
    const handleCloseMenu = () => setSidebarOpen(false);

    useEffect(() => {
        const check = () => setIsMobileView(window.innerWidth < 1024);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

	const role = user?.role?.toLowerCase();
	let menuItems = [];
	if (role === "superadmin") {
		menuItems = [
			{ href: "/superadmin/overview", label: "Dashboard" },
			{ href: "/superadmin/users", label: "Users" },
			{ href: "/content", label: "Content" },
			{ href: "/superadmin/media", label: "Media" },
			{ href: "/superadmin/roles", label: "Roles" },
			{ href: "/superadmin/settings", label: "System Settings" },
			{ href: "/superadmin/analytics", label: "Analytics" },
			{ href: "/superadmin/tenants", label: "Tenants" },
			{ href: "/superadmin/profile", label: "Profile" },
		];
	} else if (role === "admin") {
		menuItems = [
			{ href: "/admin/overview", label: "Dashboard" },
			{ href: "/content", label: "Content" },
			{ href: "/admin/media", label: "Media" },
			{ href: "/admin/galleries", label: "Galleries" },
			{ href: "/admin/users", label: "Users" },
			{ href: "/admin/analytics", label: "Analytics" },
			{ href: "/subscription", label: "Subscription" },
			{ href: "/admin/profile", label: "Profile" },
		];
	} else if (role === "editor") {
		menuItems = [
			{ href: "/user/overview", label: "Dashboard" },
			{ href: "/content", label: "Content" },
			{ href: "/user/media", label: "Media" },
			{ href: "/user/galleries", label: "Galleries" },
			{ href: "/subscription", label: "Subscription" },
			{ href: "/user/profile", label: "Profile" },
			{ href: "/user/help", label: "Help" },
		];
	} else {
		menuItems = [
			{ href: "/dashboard", label: "Dashboard" },
			{ href: "/subscription", label: "Subscription" },
		];
	}
    const contentMarginLeft = isMobileView ? 0 : 'var(--sidebar-width, 200px)';

    return (
        <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: 'var(--bg-color, #F9FAFB)', color: 'var(--text-color, #111827)' }}>
			<Header title={title} user={user} onMenuClick={handleOpenMenu} />
            <div className="flex w-full overflow-x-hidden lg:pt-14">
				<Sidebar title={title} menuItems={menuItems} user={user} isOpen={sidebarOpen} onClose={handleCloseMenu} onLinkClick={handleCloseMenu} />
                <main className="flex-1 min-h-[calc(100vh-56px-56px)] px-4 py-6 w-full" style={{ marginLeft: contentMarginLeft }}>{children}</main>
			</div>
			<Footer />
		</div>
	);
}

export default Layout;
