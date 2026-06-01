import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@/i18n';
import './index.css';
import App from './App';
import { useAuthStore } from '@/store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
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
