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
  initialSorting?: SortingState;
  emptyMessage?: string;
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
}

function SkeletonRows({ columnCount }: { columnCount: number }) {
  const widths = ['w-3/4', 'w-1/2', 'w-2/3', 'w-5/6'];
  return (
    <>
      {Array.from({ length: 5 }).map((_, rowIdx) => (
        <tr
          key={rowIdx}
          className={`border-b border-gray-100 dark:border-gray-800 ${rowIdx % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-800/20' : ''}`}
        >
          {Array.from({ length: columnCount }).map((_, colIdx) => (
            <td key={colIdx} className="px-3 py-2.5">
              <div
                className={`h-4 ${widths[(rowIdx + colIdx) % widths.length]} rounded bg-gray-200 dark:bg-gray-700 animate-pulse`}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
      <svg
        className="mb-3 h-10 w-10"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 11.625l2.25-2.25M12 11.625l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
        />
      </svg>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export function DataTable<T>({
  data,
  columns,
  pageSize = 20,
  isLoading,
  initialSorting,
  emptyMessage = 'No data found',
  globalFilter: externalFilter,
  onGlobalFilterChange: onExternalFilterChange,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting ?? []);
  const [internalFilter, setInternalFilter] = useState('');

  const globalFilter = externalFilter ?? internalFilter;
  const setGlobalFilter = onExternalFilterChange ?? setInternalFilter;

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  const totalRows = table.getFilteredRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const currentPageSize = table.getState().pagination.pageSize;
  const startRow = totalRows === 0 ? 0 : pageIndex * currentPageSize + 1;
  const endRow = Math.min((pageIndex + 1) * currentPageSize, totalRows);
  const pageCount = table.getPageCount();

  return (
    <div className="overflow-x-auto">
      {/* Toolbar: pagination info + search */}
      {!isLoading && data.length > 0 && (
        <div className="flex items-center justify-between px-3 py-2 mb-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Showing {startRow}&ndash;{endRow} of {totalRows}
          </span>
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              type="text"
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              placeholder="Filter..."
              className="h-7 w-48 rounded border border-gray-300 bg-white pl-8 pr-2 text-xs text-gray-700 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500"
            />
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && data.length === 0 && <EmptyState message={emptyMessage} />}

      {/* Table */}
      {(isLoading || data.length > 0) && (
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="border-b border-gray-200 dark:border-gray-700">
                {headerGroup.headers.map(header => {
                  const isSorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer select-none ${
                        isSorted
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <span className="inline-flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {isSorted === 'asc' ? (
                          <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path
                              fillRule="evenodd"
                              d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : isSorted === 'desc' ? (
                          <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path
                              fillRule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : null}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              <SkeletonRows columnCount={columns.length} />
            ) : (
              table.getRowModel().rows.map(row => (
                <tr
                  key={row.id}
                  className="border-b border-gray-100 dark:border-gray-800 even:bg-gray-50 dark:even:bg-gray-800/30 hover:bg-gray-100/70 dark:hover:bg-gray-800/50 transition-colors"
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-3 py-2.5 text-gray-900 dark:text-gray-100">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      {!isLoading && pageCount > 1 && (
        <div className="flex items-center justify-between px-3 py-2.5 border-t border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Showing {startRow}&ndash;{endRow} of {totalRows}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="First page"
            >
              &laquo;
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Previous page"
            >
              &lsaquo;
            </button>

            {/* Page numbers */}
            {Array.from({ length: pageCount }).map((_, i) => {
              // Show first, last, current, and neighbors
              const show = i === 0 || i === pageCount - 1 || Math.abs(i - pageIndex) <= 1;
              const showEllipsis =
                !show && (i === 1 || i === pageCount - 2) && Math.abs(i - pageIndex) > 1;

              if (showEllipsis) {
                return (
                  <span key={i} className="px-1 text-xs text-gray-400 dark:text-gray-500">
                    ...
                  </span>
                );
              }
              if (!show) return null;

              return (
                <button
                  key={i}
                  onClick={() => table.setPageIndex(i)}
                  className={`min-w-[28px] px-2 py-1 text-xs rounded border transition-colors ${
                    i === pageIndex
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}

            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Next page"
            >
              &rsaquo;
            </button>
            <button
              onClick={() => table.setPageIndex(pageCount - 1)}
              disabled={!table.getCanNextPage()}
              className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Last page"
            >
              &raquo;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
