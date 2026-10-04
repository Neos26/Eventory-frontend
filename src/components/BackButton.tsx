import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { To } from 'react-router-dom';

interface BackButtonProps {
  // Destination; omit to fall back to browser history (navigate(-1)).
  to?: To;
  label?: string;
}

// Lightweight back link shown directly above the page header on detail and
// sub-pages, so every screen has a visible way out.
export default function BackButton({ to, label = 'Back' }: BackButtonProps) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => (to === undefined ? navigate(-1) : navigate(to))}
      className="mb-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg text-sm font-medium text-slate-500 transition-colors hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}
