interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
      >
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <span className="text-sm font-semibold text-slate-800 lg:hidden">Eventory</span>

      <div className="ml-auto flex items-center gap-3">
        <input
          type="search"
          placeholder="Search"
          disabled
          className="hidden w-56 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 placeholder-slate-400 focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed md:block"
        />
        <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
          U
        </span>
      </div>
    </header>
  );
}
