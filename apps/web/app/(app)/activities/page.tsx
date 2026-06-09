import { Suspense } from 'react';
import ActivitiesPageClient from './page-client';

export default function ActivitiesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading activities...</div>}>
      <ActivitiesPageClient />
    </Suspense>
  );
}
