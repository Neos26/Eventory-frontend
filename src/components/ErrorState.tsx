import Button from './Button';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

// Shown when an API request fails outright (list/detail could not load).
export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50 py-12 text-center">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-red-100 text-red-600">
        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v4.5a.75.75 0 0 0 1.5 0v-4.5Zm0 6a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z"
            clipRule="evenodd"
          />
        </svg>
      </span>
      <h3 className="text-sm font-semibold text-red-800">Something went wrong</h3>
      <p className="max-w-sm text-sm text-red-700">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
