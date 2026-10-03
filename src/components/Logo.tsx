import { Link } from 'react-router-dom';
import LogoMark from './LogoMark';

// Text color is inherited so the same logo works on light and dark surfaces;
// the mark defaults to the signal green and can be overridden (e.g. a lighter
// green on the dark auth panels so it stays noticeable).
export default function Logo({
  className = '',
  markClassName = 'text-brand-600',
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <LogoMark className={`h-8 w-8 shrink-0 ${markClassName}`} />
      <span className="text-lg font-semibold tracking-tight">Eventory</span>
    </Link>
  );
}
