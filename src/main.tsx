import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './design-system/toast/ToastProvider.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,                // ❌ do not retry when API fails
      refetchOnWindowFocus: false, // ❌ do not refetch when switching tabs
      refetchOnReconnect: true,   //  refetch when internet reconnects
      refetchOnMount: true,       // ❌ do not refetch when component mounts again
      staleTime: 5 * 60 * 1000,    // refresh after some time
    },
    mutations: {
      retry: false, // ❌ do not retry mutations
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>,
)
