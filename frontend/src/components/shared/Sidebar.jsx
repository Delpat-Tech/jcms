import React from "react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
	{ label: "Dashboard", to: "/dashboard" },
	{ label: "Content", to: "/dashboard/content" },
	{ label: "Media", to: "/dashboard/media" },
	{ label: "Users", to: "/dashboard/users" },
];

function Sidebar() {
	const location = useLocation();

	return (
		<aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-white/70 p-4 backdrop-blur supports-[backdrop-filter]:bg-white/60 md:block">
			<div className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Navigation</div>
			<nav className="space-y-1">
				{navItems.map((item) => {
					const active = location.pathname.startsWith(item.to);
					return (
						<Link
							key={item.to}
							to={item.to}
							className={
								"flex items-center justify-between rounded-md px-3 py-2 text-sm " +
								(active ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50")
							}
						>
							<span>{item.label}</span>
							{active ? <span className="h-2 w-2 rounded-full bg-indigo-600" /> : null}
						</Link>
					);
				})}
			</nav>
		</aside>
	);
}

export default Sidebar;
