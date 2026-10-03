import type { ReactNode } from 'react';
import Card from './Card';

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
  // Wrap cell text so the table never needs horizontal scrolling.
  wrap?: boolean;
}

// Generic table: a scrollable table on md+ screens and stacked cards on
// mobile, so pages can drop it anywhere.
export default function Table<T>({ columns, rows, rowKey, emptyMessage, wrap = false }: TableProps<T>) {
  const empty = emptyMessage ?? 'No records found.';
  const [titleColumn, ...restColumns] = columns;
  const fieldColumns = restColumns.filter(
    (column) => column.header !== 'Actions' && column.header !== 'Action',
  );
  const actionColumns = restColumns.filter(
    (column) => column.header === 'Actions' || column.header === 'Action',
  );

  return (
    <>
      <div
        className={`hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block ${
          wrap ? '' : 'overflow-x-auto'
        }`}
      >
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
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-slate-500">
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={rowKey(row)} className="hover:bg-slate-50">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-4 py-3 text-sm text-slate-700 ${
                        wrap ? 'break-words' : 'whitespace-nowrap'
                      }`}
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
        {rows.length === 0 ? (
          <Card>
            <p className="py-4 text-center text-sm text-slate-500">{empty}</p>
          </Card>
        ) : (
          rows.map((row) => (
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
    </>
  );
}
