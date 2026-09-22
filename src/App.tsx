// src/App.tsx
import './App.css';
import { useEffect } from 'react';
import { AppRouter } from './router';
import GlobalSpinner from "./design-system/GlobalSpinner";
import SessionManager from './components/session/SessionManager';
import { getUserInfo } from './services/profile/profileApi';
import { tokenStore } from './services/auth/tokenStore';
import { flushAuditQueue } from './services/auth/audit';
import { useQueryClient } from '@tanstack/react-query';

function App() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Drain audit events buffered before the transport shipped (no-op today).
    void flushAuditQueue();
    if (tokenStore.getAccessToken()) {
      queryClient.prefetchQuery({
        queryKey: ["userInfo"],
        queryFn: getUserInfo,
      });
    }
  }, [queryClient]);

  return (
    <>
      <AppRouter />
      <SessionManager />
      <GlobalSpinner /> {/* one spinner for the whole portal */}
    </>
  );
}

export default App;
