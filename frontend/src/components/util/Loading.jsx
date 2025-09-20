import React from "react";
import TrioLoader from '../ui/TrioLoader';

function Loading({ label = "Loading..." }) {
	return (
		<div className="flex items-center gap-3 text-sm text-gray-600">
			<TrioLoader size="20" color="#4f46e5" />
			<span>{label}</span>
		</div>
	);
}

export default Loading;
