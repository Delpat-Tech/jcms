import React from "react";

class ErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError() {
		return { hasError: true };
	}

	componentDidCatch(error, info) {
		if (process.env.NODE_ENV !== "production") {
			// eslint-disable-next-line no-console
			console.error("ErrorBoundary caught", error, info);
		}
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="mx-auto max-w-md rounded-md border bg-white p-6 text-center shadow">
					<h2 className="mb-2 text-base font-semibold text-gray-900">Something went wrong</h2>
					<p className="text-sm text-gray-600">Please refresh the page or try again later.</p>
				</div>
			);
		}
		return this.props.children;
	}
}

export default ErrorBoundary;
