import { useEffect, useState, type ReactNode } from 'react';
import Card from './Card';
import TablePagination from './TablePagination';

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
  // Rows per page; pagination appears automatically when there is more than
  // one page. Set to 0 to disable pagination entirely.
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 10;

// Generic table: a full-width table on md+ screens and stacked cards on
// mobile, with automatic pagination, so pages can drop it anywhere. Cell
// text always wraps, so long names never force horizontal scrolling.
export default function Table<T>({
  columns,
  rows,
  rowKey,
  emptyMessage,
  pageSize = DEFAULT_PAGE_SIZE,
}: TableProps<T>) {
  const empty = emptyMessage ?? 'No records found.';
  const paginated = pageSize > 0;
  const pageCount = paginated ? Math.max(1, Math.ceil(rows.length / pageSize)) : 1;
  const [page, setPage] = useState(1);

  // Keep the current page valid when rows shrink (filtering, deletions).
  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  const safePage = Math.min(page, pageCount);
  const start = paginated ? (safePage - 1) * pageSize : 0;
  const visibleRows = paginated ? rows.slice(start, start + pageSize) : rows;

  const [titleColumn, ...restColumns] = columns;
  const fieldColumns = restColumns.filter(
    (column) => column.header !== 'Actions' && column.header !== 'Action',
  );
  const actionColumns = restColumns.filter(
    (column) => column.header === 'Actions' || column.header === 'Action',
  );

  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-slate-500">
                  {empty}
                </td>
              </tr>
            ) : (
              visibleRows.map((row) => (
                <tr key={rowKey(row)} className="hover:bg-slate-50">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="break-words px-4 py-3 text-sm text-slate-700"
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {visibleRows.length === 0 ? (
          <Card>
            <p className="py-4 text-center text-sm text-slate-500">{empty}</p>
          </Card>
        ) : (
          visibleRows.map((row) => (
            <Card key={rowKey(row)}>
              {titleColumn && (
                <div className="break-words text-sm font-semibold text-slate-900">
                  {titleColumn.render(row)}
                </div>
              )}
              {fieldColumns.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                  {fieldColumns.map((column) => (
                    <div key={column.key} className="flex items-start justify-between gap-3">
                      <span className="shrink-0 text-xs font-medium uppercase tracking-wider text-slate-500">
                        {column.header}
                      </span>
                      <div className="min-w-0 text-right text-sm text-slate-700">
                        {column.render(row)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {actionColumns.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  {actionColumns.map((column) => (
                    <div key={column.key} className="flex flex-wrap gap-2">
                      {column.render(row)}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {paginated && (
        <TablePagination
          page={safePage}
          pageCount={pageCount}
          start={start + 1}
          end={Math.min(start + pageSize, rows.length)}
          total={rows.length}
          onChange={setPage}
        />
      )}
    </>
  );
}
