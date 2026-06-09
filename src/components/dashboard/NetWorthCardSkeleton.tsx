export default function NetWorthCardSkeleton() {
  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
      <div className="h-4 w-40 animate-pulse rounded bg-[#F1F5F9]" />
      <div className="mt-1 h-3 w-56 animate-pulse rounded bg-[#F1F5F9]" />
      <div className="mt-4 h-9 w-48 animate-pulse rounded bg-[#F1F5F9]" />
      <div className="mb-3 mt-4 border-t border-[#E2E8F0]" />
      <div className="flex">
        <div className="h-4 w-32 animate-pulse rounded bg-[#F1F5F9]" />
        <div className="ms-4 h-4 w-32 animate-pulse rounded bg-[#F1F5F9]" />
      </div>
      <div className="mt-3 h-3 w-48 animate-pulse rounded bg-[#F1F5F9]" />
    </div>
  );
}
