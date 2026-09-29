import { Link } from 'react-router-dom';

// Text color is inherited so the same logo works on light and dark bars.
export default function Logo({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
        E
      </span>
      <span className="text-lg font-semibold tracking-tight">Eventory</span>
    </Link>
  );
}
