import type { ReactElement, ReactNode } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export function createWrapper(client?: QueryClient) {
  const queryClient = client ?? createTestQueryClient();
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { Wrapper, queryClient };
}

export function renderWithClient(ui: ReactElement, client?: QueryClient) {
  const { Wrapper, queryClient } = createWrapper(client);
  return { ...render(ui, { wrapper: Wrapper }), queryClient };
}
