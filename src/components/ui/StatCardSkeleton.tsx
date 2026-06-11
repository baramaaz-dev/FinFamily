import { Skeleton } from '@/components/ui/skeleton';

interface StatCardSkeletonProps {
  lines?: number;
}

export default function StatCardSkeleton({ lines = 3 }: StatCardSkeletonProps) {
  const extraLines = Math.max(0, lines - 2);
  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      {Array.from({ length: extraLines }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-1/2" />
      ))}
    </div>
  );
}
