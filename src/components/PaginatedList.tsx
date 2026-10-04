import { Fragment, useEffect, useState, type ReactNode } from 'react';
import TablePagination from './TablePagination';

interface PaginatedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  // Stable key per item; index is the absolute position in `items`.
  itemKey: (item: T, index: number) => string;
  // Rows per page; pagination appears automatically when there is more than
  // one page. Hidden entirely for lists that fit on a single page.
  pageSize?: number;
  // Class for the wrapper holding the visible items (grid, space-y, etc).
  className?: string;
  // Wrapper element: use "ul" when children are <li>, "div" otherwise.
  as?: 'div' | 'ul';
}

const DEFAULT_PAGE_SIZE = 10;

// Generic paginated list for custom renderings (cards, rows, bars) that do
// not use the shared Table. Renders the current page of items followed by
// the shared Prev/Next controls, which hide themselves on a single page.
export default function PaginatedList<T>({
  items,
  renderItem,
  itemKey,
  pageSize = DEFAULT_PAGE_SIZE,
  className,
  as = 'div',
}: PaginatedListProps<T>) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const [page, setPage] = useState(1);

  // Keep the current page valid when items shrink (filtering, deletions).
  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  const visible = pageItems.map((item, offset) => {
    const index = start + offset;
    return <Fragment key={itemKey(item, index)}>{renderItem(item, index)}</Fragment>;
  });

  return (
    <>
      {as === 'ul' ? (
        <ul className={className}>{visible}</ul>
      ) : (
        <div className={className}>{visible}</div>
      )}
      <TablePagination
        page={safePage}
        pageCount={pageCount}
        start={start + 1}
        end={Math.min(start + pageSize, items.length)}
        total={items.length}
        onChange={setPage}
      />
    </>
  );
}
