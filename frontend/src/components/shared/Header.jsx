import React, { useState, useEffect, useRef } from "react";

function Header({ title = "JCMS", user }) {
	const [showDropdown, setShowDropdown] = useState(false);
	const dropdownRef = useRef(null);

	useEffect(() => {
		function handleClickOutside(event) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setShowDropdown(false);
			}
		}

		if (showDropdown) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showDropdown]);

	const handleLogout = () => {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		window.location.href = '/';
	};

	const username = user?.username || user?.name || "Guest";

	return (
		<header className="sticky top-0 z-40 w-full border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
			<div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
				<div className="flex items-center gap-3">
					<div className="h-8 w-8 rounded bg-indigo-600" />
					<h1 className="text-sm font-semibold text-gray-900">{title}</h1>
				</div>
				<div className="relative flex items-center gap-3" ref={dropdownRef}>
					<button 
						onClick={() => setShowDropdown(!showDropdown)}
						className="flex items-center gap-2 hover:bg-gray-50 rounded-md px-2 py-1"
					>
						<span className="hidden text-sm text-gray-600 sm:inline">{username}</span>
						<img
							alt="avatar"
							src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}`}
							className="h-8 w-8 rounded-full border"
						/>
					</button>
					{showDropdown && (
						<div className="absolute right-0 top-full mt-1 w-48 bg-white border rounded-md shadow-lg z-50">
							<div className="py-1">
								<div className="px-4 py-2 text-sm text-gray-700 border-b">
									<div className="font-medium">{username}</div>
									<div className="text-gray-500">{user?.email}</div>
								</div>
								<button
									onClick={handleLogout}
									className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
								>
									Logout
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</header>
	);
}

export default Header;
