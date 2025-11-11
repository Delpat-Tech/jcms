import React from "react";

function Footer() {
    return (
        <footer className="border-t bg-white dark:bg-[#1C1C1E] backdrop-blur">
            <div className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-gray-500 dark:text-gray-400">
                © {new Date().getFullYear()} JCMS. All rights reserved.
            </div>
        </footer>
    );
}

export default Footer;
