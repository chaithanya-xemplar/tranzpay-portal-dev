import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { useBreadcrumbs } from "./useBreadcrumbs";

const {
  useGetMerchantMock,
  useGetCorpMock,
  useGetProducerMock,
  useProcessorDetailsMock,
  useGetMerchantProcessorMock,
} = vi.hoisted(() => ({
  useGetMerchantMock: vi.fn(),
  useGetCorpMock: vi.fn(),
  useGetProducerMock: vi.fn(),
  useProcessorDetailsMock: vi.fn(),
  useGetMerchantProcessorMock: vi.fn(),
}));

vi.mock("../services/merchants/merchantApi", () => ({
  useGetMerchant: useGetMerchantMock,
}));
vi.mock("../services/corps/corpApi", () => ({
  useGetCorp: useGetCorpMock,
}));
vi.mock("../services/producers/producerApi", () => ({
  useGetProducer: useGetProducerMock,
}));
vi.mock("../services/processors/processorsApi", () => ({
  useProcessorDetails: useProcessorDetailsMock,
}));
vi.mock("../pages/merchants/processors/merchantProcessor.api", () => ({
  useGetMerchantProcessor: useGetMerchantProcessorMock,
}));

function renderBreadcrumbs(entry: string | { pathname: string; state?: unknown }) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[entry]}>{children}</MemoryRouter>
  );
  return renderHook(() => useBreadcrumbs(), { wrapper });
}

beforeEach(() => {
  vi.clearAllMocks();
  for (const mock of [
    useGetMerchantMock,
    useGetCorpMock,
    useGetProducerMock,
    useProcessorDetailsMock,
    useGetMerchantProcessorMock,
  ]) {
    mock.mockReturnValue({ data: undefined });
  }
});

describe("useBreadcrumbs", () => {
  it("returns null on the dashboard and unknown paths", () => {
    expect(renderBreadcrumbs("/").result.current).toBeNull();
    expect(renderBreadcrumbs("/no/such/path").result.current).toBeNull();
  });

  it("builds a static trail with the Dashboard root", () => {
    const { result } = renderBreadcrumbs("/corps/create");
    expect(result.current).toEqual([
      { label: "Dashboard", to: "/" },
      { label: "Corps", to: "/corps" },
      { label: "New Corp", to: undefined },
    ]);
  });

  it("resolves the merchant name and interpolates links on tab routes", () => {
    useGetMerchantMock.mockReturnValue({ data: { companyName: "Acme" } });

    const { result } = renderBreadcrumbs("/merchants/42/producers");

    expect(useGetMerchantMock).toHaveBeenCalledWith(42);
    expect(result.current).toEqual([
      { label: "Dashboard", to: "/" },
      { label: "Merchants", to: "/merchants" },
      { label: "Acme", to: "/merchants/42" },
      { label: "Associated Producers", to: undefined },
    ]);
  });

  it("shows a loading placeholder until the entity query resolves", () => {
    const { result } = renderBreadcrumbs("/merchants/42");
    expect(result.current?.at(-1)?.label).toBe("…");
  });

  it("disables entity queries not present in the trail (NaN ids)", () => {
    renderBreadcrumbs("/corps/7");
    expect(useGetCorpMock).toHaveBeenCalledWith(7);
    expect(useGetMerchantMock).toHaveBeenCalledWith(NaN);
    expect(useGetProducerMock).toHaveBeenCalledWith(NaN);
    expect(useProcessorDetailsMock).toHaveBeenCalledWith(NaN);
    expect(useGetMerchantProcessorMock).toHaveBeenCalledWith(NaN, NaN);
  });

  it("uses the processor identifier with a static fallback on the merchant-processor leaf", () => {
    useGetMerchantProcessorMock.mockReturnValue({
      data: { data: [{ identifier: "TSYS-ACH" }] },
    });

    const { result } = renderBreadcrumbs("/merchants/42/processors/9");
    expect(useGetMerchantProcessorMock).toHaveBeenCalledWith(42, 9);
    expect(result.current?.at(-1)?.label).toBe("TSYS-ACH");

    useGetMerchantProcessorMock.mockReturnValue({ data: undefined });
    const fallback = renderBreadcrumbs("/merchants/42/processors/9");
    expect(fallback.result.current?.at(-1)?.label).toBe("Processor");
  });

  it("reads the user name from location.state with an id fallback", () => {
    const withState = renderBreadcrumbs({
      pathname: "/users/9/permissions",
      state: { userName: "Jane Doe" },
    });
    expect(withState.result.current?.[2]?.label).toBe("Jane Doe");

    const withoutState = renderBreadcrumbs("/users/9/permissions");
    expect(withoutState.result.current?.[2]?.label).toBe("User 9");
  });
});
