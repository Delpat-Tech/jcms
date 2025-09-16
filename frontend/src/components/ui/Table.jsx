import React from "react";

function Table({ columns = [], data = [], getRowKey }) {
	return (
		<div className="overflow-hidden rounded-lg border">
			<table className="min-w-full divide-y divide-gray-200">
				<thead className="bg-gray-50">
					<tr>
						{columns.map((col) => (
							<th key={col.key || col.label} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
								{col.label}
							</th>
						))}
					</tr>
				</thead>
				<tbody className="divide-y divide-gray-200 bg-white">
					{data.map((row, i) => (
						<tr key={getRowKey ? getRowKey(row, i) : row._id || i} className="hover:bg-gray-50">
							{columns.map((col) => (
								<td key={col.key || col.label} className="px-4 py-3 text-sm text-gray-700">
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
