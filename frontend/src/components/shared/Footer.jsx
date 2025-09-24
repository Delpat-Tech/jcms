import React from "react";

function Footer() {
    return (
        <footer className="border-t border-gray-200/70 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/75">
            <div className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-gray-500">
                © {new Date().getFullYear()} JCMS. All rights reserved.
            </div>
        </footer>
    );
}

export default Footer;
