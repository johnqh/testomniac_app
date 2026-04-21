/* eslint-disable react-hooks/incompatible-library */
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  pageSize?: number;
  isLoading?: boolean;
}

export function DataTable<T>({ data, columns, pageSize = 20, isLoading }: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  if (isLoading) {
    return <div className="py-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>;
  }

  if (data.length === 0) {
    return <div className="py-8 text-center text-gray-500 dark:text-gray-400">No data</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id} className="border-b border-gray-200 dark:border-gray-700">
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() === 'asc'
                    ? ' ↑'
                    : header.column.getIsSorted() === 'desc'
                      ? ' ↓'
                      : ''}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr
              key={row.id}
              className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="px-3 py-2 text-gray-900 dark:text-gray-100">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-500">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
