import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  ChevronDown,
  Search,
  RefreshCw,
  Download,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export type SortDirection = 'asc' | 'desc' | null;

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  // Pagination
  totalItems?: number;
  page?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  // Sorting
  sortField?: string | null;
  sortDirection?: SortDirection;
  onSort?: (field: string, direction: SortDirection) => void;
  // Search
  searchable?: boolean;
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  // Export
  exportable?: boolean;
  onExport?: () => void;
  // UI
  loading?: boolean;
  emptyMessage?: string;
  rowKey?: keyof T | ((row: T) => string);
  onRowClick?: (row: T) => void;
  selectedRowId?: string | null;
  className?: string;
  // Header slot
  headerActions?: React.ReactNode;
}

export function DataTable<T extends object>({
  data,
  columns,
  totalItems,
  page = 1,
  pageSize = 20,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
  sortField,
  sortDirection,
  onSort,
  searchable = false,
  searchValue = '',
  searchPlaceholder = 'Search...',
  onSearchChange,
  exportable = false,
  onExport,
  loading = false,
  emptyMessage = 'No data available',
  rowKey = 'id' as keyof T,
  onRowClick,
  selectedRowId,
  className,
  headerActions,
}: DataTableProps<T>) {
  // Local sort state if not controlled
  const [localSortField, setLocalSortField] = useState<string | null>(null);
  const [localSortDirection, setLocalSortDirection] = useState<SortDirection>(null);

  const effectiveSortField = sortField ?? localSortField;
  const effectiveSortDirection = sortDirection ?? localSortDirection;

  const total = totalItems ?? data.length;
  const totalPages = Math.ceil(total / pageSize);
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  // Sort data locally if no onSort handler
  const sortedData = useMemo(() => {
    if (onSort || !effectiveSortField || !effectiveSortDirection) {
      return data;
    }
    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[effectiveSortField];
      const bVal = (b as Record<string, unknown>)[effectiveSortField];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return effectiveSortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return effectiveSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }, [data, effectiveSortField, effectiveSortDirection, onSort]);

  const handleSort = (field: string) => {
    let newDirection: SortDirection;
    if (effectiveSortField === field) {
      if (effectiveSortDirection === 'asc') newDirection = 'desc';
      else if (effectiveSortDirection === 'desc') newDirection = null;
      else newDirection = 'asc';
    } else {
      newDirection = 'asc';
    }

    if (onSort) {
      onSort(field, newDirection);
    } else {
      setLocalSortField(newDirection ? field : null);
      setLocalSortDirection(newDirection);
    }
  };

  const getRowKey = (row: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(row);
    }
    const key = row[rowKey];
    return key !== undefined && key !== null ? String(key) : `row-${index}`;
  };

  const renderSortIcon = (field: string) => {
    if (effectiveSortField !== field) {
      return (
        <span className="ml-1 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500">
          <ChevronUp className="w-3 h-3 -mb-1" />
          <ChevronDown className="w-3 h-3 -mt-1" />
        </span>
      );
    }
    if (effectiveSortDirection === 'asc') {
      return <ChevronUp className="w-4 h-4 ml-1 text-primary-600" />;
    }
    if (effectiveSortDirection === 'desc') {
      return <ChevronDown className="w-4 h-4 ml-1 text-primary-600" />;
    }
    return null;
  };

  const renderPagination = () => {
    if (!onPageChange || totalPages <= 1) return null;

    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('ellipsis');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }

    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="First page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                'min-w-[32px] h-8 px-2 rounded text-sm font-medium transition-colors',
                page === p
                  ? 'bg-primary-600 dark:bg-primary-500 text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg', className)}>
      {/* Header with search and actions */}
      {(searchable || exportable || headerActions) && (
        <div className="flex items-center justify-between gap-4 mb-4">
          {searchable && onSearchChange ? (
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            {headerActions}
            {exportable && onExport && (
              <button
                onClick={onExport}
                className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border dark:border-gray-700 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 font-medium text-gray-600 dark:text-gray-400',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    col.align !== 'center' && col.align !== 'right' && 'text-left',
                    col.sortable && 'cursor-pointer select-none group',
                    col.headerClassName
                  )}
                  style={{ width: col.width }}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <div
                    className={cn(
                      'inline-flex items-center',
                      col.align === 'right' && 'flex-row-reverse'
                    )}
                  >
                    {col.header}
                    {col.sortable && renderSortIcon(col.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
                  <p className="text-gray-500 mt-2">Loading...</p>
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIndex) => {
                const key = getRowKey(row, rowIndex);
                const isSelected = selectedRowId === key;
                return (
                  <tr
                    key={key}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
                      onRowClick && 'cursor-pointer',
                      isSelected && 'bg-primary-50 dark:bg-primary-900/20'
                    )}
                  >
                    {columns.map((col) => {
                      const value = (row as Record<string, unknown>)[col.key];
                      return (
                        <td
                          key={col.key}
                          className={cn(
                            'px-4 py-3',
                            col.align === 'center' && 'text-center',
                            col.align === 'right' && 'text-right',
                            col.className
                          )}
                        >
                          {col.render
                            ? col.render(value, row, rowIndex)
                            : value !== null && value !== undefined
                              ? String(value)
                              : '-'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with pagination */}
      {(onPageChange || onPageSizeChange) && total > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <div className="flex items-center gap-4 text-gray-500">
            <span>
              Showing {startItem} - {endItem} of {total.toLocaleString()}
            </span>
            {onPageSizeChange && (
              <div className="flex items-center gap-2">
                <span>Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="px-2 py-1 border dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                >
                  {pageSizeOptions.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {renderPagination()}
        </div>
      )}
    </div>
  );
}
