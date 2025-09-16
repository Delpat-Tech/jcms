import React from "react";

function Footer() {
	return (
		<footer className="border-t bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
			<div className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-gray-500">
				© {new Date().getFullYear()} JCMS. All rights reserved.
			</div>
		</footer>
	);
}

export default Footer;
