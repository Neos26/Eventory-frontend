import useDocumentTitle from '../hooks/useDocumentTitle';
import PageHeader from './PageHeader';
import Card from './Card';

interface PagePlaceholderProps {
  title: string;
  description?: string;
  route?: string;
}

// Shared layout so every page stays visually consistent.
export default function PagePlaceholder({ title, description, route }: PagePlaceholderProps) {
  useDocumentTitle(title);

  return (
    <>
      <PageHeader title={title} description={description} />
      <Card>
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </span>
          <h2 className="text-lg font-semibold text-slate-900">Coming soon</h2>
          <p className="max-w-md text-sm text-slate-500">
            There is no content to show on this page right now.
          </p>
          {route && (
            <code className="mt-2 rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
              {route}
            </code>
          )}
        </div>
      </Card>
    </>
  );
}
