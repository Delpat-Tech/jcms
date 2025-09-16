import React from "react";

function Button({ variant = "primary", size = "md", className = "", ...props }) {
	const base = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:pointer-events-none";
	const variants = {
		primary: "bg-indigo-600 text-white hover:bg-indigo-700",
		secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
		ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
		destructive: "bg-red-600 text-white hover:bg-red-700",
	};
	const sizes = {
		sm: "h-8 px-3 text-xs",
		md: "h-10 px-4 text-sm",
		lg: "h-12 px-6 text-base",
	};
	return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}

export default Button;
