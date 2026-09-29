import { useEffect } from 'react';

// Sets "<title> · Eventory" whenever the page title changes.
export default function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} · Eventory`;
  }, [title]);
}
