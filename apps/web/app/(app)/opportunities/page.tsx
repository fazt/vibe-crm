import { Suspense } from 'react';
import OpportunitiesPage from './page-client';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading opportunities...</div>}>
      <OpportunitiesPage />
    </Suspense>
  );
}
