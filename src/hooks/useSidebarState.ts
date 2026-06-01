import { useState, useEffect } from 'react';

const STORAGE_KEY = 'finfamily-sidebar-collapsed';

export function useSidebarState(): { collapsed: boolean; toggle: () => void } {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      // ignore storage errors (private browsing)
    }
  }, [collapsed]);

  const toggle = () => setCollapsed(prev => !prev);

  return { collapsed, toggle };
}
