import React from "react";
import TrioLoader from '../ui/TrioLoader';

function Loading({ size = "20", color = "#4f46e5" }) {
	return (
		<div className="flex items-center justify-center">
			<TrioLoader size={size} color={color} />
		</div>
	);
}

export default Loading;
