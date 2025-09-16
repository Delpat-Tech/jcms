import React from "react";
import { Link } from "react-router-dom";

function Nav() {
	return (
		<nav className="hidden gap-4 md:flex">
			<Link className="text-sm text-gray-600 hover:text-gray-900" to="/dashboard">Home</Link>
			<Link className="text-sm text-gray-600 hover:text-gray-900" to="/dashboard/content">Content</Link>
			<Link className="text-sm text-gray-600 hover:text-gray-900" to="/dashboard/media">Media</Link>
			<Link className="text-sm text-gray-600 hover:text-gray-900" to="/dashboard/users">Users</Link>
		</nav>
	);
}

export default Nav;
