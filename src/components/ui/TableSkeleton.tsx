import { Skeleton } from '@/components/ui/skeleton';

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

export default function TableSkeleton({ rows = 5, cols = 4 }: TableSkeletonProps) {
  return (
    <div className="w-full space-y-2">
      <div className="flex gap-3 mb-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 py-2 border-b border-[#F1F5F9]">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
