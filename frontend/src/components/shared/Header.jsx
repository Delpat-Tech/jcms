import React from "react";

function Header({ title = "JCMS", user }) {
	return (
		<header className="sticky top-0 z-40 w-full border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
			<div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
				<div className="flex items-center gap-3">
					<div className="h-8 w-8 rounded bg-indigo-600" />
					<h1 className="text-sm font-semibold text-gray-900">{title}</h1>
				</div>
				<div className="flex items-center gap-3">
					<span className="hidden text-sm text-gray-600 sm:inline">{user?.name || "Guest"}</span>
					<img
						alt="avatar"
						src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "G")}`}
						className="h-8 w-8 rounded-full border"
					/>
				</div>
			</div>
		</header>
	);
}

export default Header;
