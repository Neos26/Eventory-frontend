import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';

interface FilterPanelProps {
  search: ReactNode;
  activeCount?: number;
  children: ReactNode;
}

export default function FilterPanel({ search, activeCount = 0, children }: FilterPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {search}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filters
          {activeCount > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1.5 text-xs font-semibold text-white">
              {activeCount}
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>
      {open && (
        <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">{children}</div>
      )}
    </div>
  );
}
