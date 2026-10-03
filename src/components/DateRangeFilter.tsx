interface DateRangeFilterProps {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}

export default function DateRangeFilter({ from, to, onFromChange, onToChange }: DateRangeFilterProps) {
  const inputClass =
    'rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500';

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <input
        type="date"
        value={from}
        onChange={(event) => onFromChange(event.target.value)}
        aria-label="From date"
        className={inputClass}
      />
      <span className="text-slate-400">–</span>
      <input
        type="date"
        value={to}
        onChange={(event) => onToChange(event.target.value)}
        aria-label="To date"
        className={inputClass}
      />
    </div>
  );
}
