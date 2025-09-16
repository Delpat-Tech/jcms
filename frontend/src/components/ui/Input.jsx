import React from "react";

function Input({ className = "", ...props }) {
	return (
		<input
			className={`block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${className}`}
			{...props}
		/>
	);
}

export default Input;
