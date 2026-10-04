import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

interface TablePaginationProps {
  page: number; // 1-based, already clamped by the caller
  pageCount: number;
  start: number; // first visible row number
  end: number; // last visible row number
  total: number;
  onChange: (page: number) => void;
}

// Prev/Next controls shared by every paginated list. Hidden when there is
// only one page (or nothing to show).
export default function TablePagination({
  page,
  pageCount,
  start,
  end,
  total,
  onChange,
}: TablePaginationProps) {
  if (pageCount <= 1 || total === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-slate-500">
        Showing <span className="font-medium text-slate-700">{start}–{end}</span> of{' '}
        <span className="font-medium text-slate-700">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Prev
        </Button>
        <span className="text-xs text-slate-600">
          Page {page} of {pageCount}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onChange(page + 1)}
          disabled={page >= pageCount}
          aria-label="Next page"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
