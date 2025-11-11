import React from "react";

function Table({ columns = [], data = [], getRowKey }) {
	return (
		<div className="overflow-hidden rounded-lg border dark:border-gray-700">
			<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
				<thead className="bg-gray-50 dark:bg-gray-800">
					<tr>
						{columns.map((col) => (
							<th key={col.key || col.label} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
								{col.label}
							</th>
						))}
					</tr>
				</thead>
				<tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-[#2C2C2E]">
					{data.map((row, i) => (
						<tr key={getRowKey ? getRowKey(row, i) : row._id || i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
							{columns.map((col) => (
								<td key={col.key || col.label} className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
									{col.render ? col.render(row) : row[col.key]}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

export default Table;
