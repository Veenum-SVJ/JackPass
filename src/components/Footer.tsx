'use client';

import { UploadDialog } from '@/components/UploadDialog';

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-sm border-t">
      <div className="container mx-auto px-4 h-20 flex items-center justify-center">
        <UploadDialog />
      </div>
    </footer>
  );
}
