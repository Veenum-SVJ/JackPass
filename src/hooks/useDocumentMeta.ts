import { useEffect } from 'react';

/**
 * Set a unique <title> (and optional meta description) per page.
 * Keeps every route crawlable and identifiable in the browser tab
 * without adding a router/SEO dependency.
 */
export function useDocumentMeta(title: string, description?: string): void {
  useEffect(() => {
    document.title = title;
    if (description) {
      let meta = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'description';
        document.head.appendChild(meta);
      }
      meta.content = description;
    }
  }, [title, description]);
}
