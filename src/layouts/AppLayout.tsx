import { Outlet } from 'react-router-dom';
import { useDirection } from '@/hooks/useDirection';

// S-002: pass-through Outlet only
// Full Sidebar + Header added in S-003
// Auth guard added in S-004 — do NOT add auth logic here
export default function AppLayout() {
  const { direction } = useDirection();
  return (
    <div className="min-h-screen bg-background" dir={direction}>
      <Outlet />
    </div>
  );
}
