import React from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

function Layout({ children, title, user }) {
	return (
		<div className="min-h-screen bg-gray-50">
			<Header title={title} user={user} />
			<div className="flex">
				<Sidebar />
				<main className="flex-1 min-h-[calc(100vh-56px-56px)] px-4 py-6 md:ml-64">{children}</main>
			</div>
			<Footer />
		</div>
	);
}

export default Layout;
