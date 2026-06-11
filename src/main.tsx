import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '@/i18n';
import './index.css';
import App from './App';
import { useAuthStore } from '@/store/authStore';

// Individual query/mutation call sites that already call toast.error() in their own
// onError callbacks will fire TWO toasts (their own + this global one) unless they
// opt out via meta: { suppressGlobalError: true }. Standardising all call sites to
// use the opt-out pattern is deferred to S-077.
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (_error, query) => {
      if (query.meta?.suppressGlobalError) return;
      toast.error(i18n.t('errors.query.generic'));
    },
  }),
  mutationCache: new MutationCache({
    onError: (_error, _variables, _context, mutation) => {
      if (mutation.meta?.suppressGlobalError) return;
      toast.error(i18n.t('errors.mutation.generic'));
    },
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
      gcTime: 10 * 60 * 1000,         // keep evicted data 10min (default: 5min)
      refetchOnWindowFocus: false,     // single-user app — no cross-tab changes
    },
  },
});

// Set initial document direction from persisted language preference
const savedLang = localStorage.getItem('finfamily-lang') ?? 'ar';
const initialDir = savedLang === 'en' ? 'ltr' : 'rtl';
document.documentElement.setAttribute('dir', initialDir);
document.documentElement.setAttribute('lang', savedLang);

// Fire-and-forget — ProtectedRoute handles the loading:true state while this resolves
useAuthStore.getState().init();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
