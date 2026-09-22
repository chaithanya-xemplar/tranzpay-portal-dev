import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import useLogin from "./useLogin";
import { loginApi, type LoginResponse } from "../services/auth/auth";
import { getUserInfo } from "../services/profile/profileApi";
import { createWrapper } from "../test/renderWithClient";

vi.mock("../services/auth/auth", () => ({
  loginApi: vi.fn(),
}));

vi.mock("../services/profile/profileApi", () => ({
  getUserInfo: vi.fn(),
}));

const loginApiMock = vi.mocked(loginApi);
const getUserInfoMock = vi.mocked(getUserInfo);

const credentials = {
  userName: "user@example.com",
  password: "not-a-real-password",
};

const loginResponse: LoginResponse = {
  access_token: "fake-jwt-token",
  token_type: "bearer",
};

const userDetails = {
  userId: 1,
  userName: "user@example.com",
  name: "Test User",
  email: "user@example.com",
  role: "Admin",
  picture: "",
};

function renderUseLogin() {
  const { Wrapper, queryClient } = createWrapper();
  const rendered = renderHook(() => useLogin(), { wrapper: Wrapper });
  return { ...rendered, queryClient };
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useLogin", () => {
  it("calls loginApi with the payload and does NOT write to storage itself (loginApi owns persistence)", async () => {
    loginApiMock.mockResolvedValue(loginResponse);
    getUserInfoMock.mockResolvedValue(userDetails);

    const { result } = renderUseLogin();

    act(() => {
      result.current.mutate(credentials);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(loginApiMock).toHaveBeenCalledTimes(1);
    expect(loginApiMock).toHaveBeenCalledWith(credentials);
    // The token module is the single source of truth — the hook must not
    // touch localStorage directly (loginApi is mocked, so any write here
    // would have come from the hook).
    expect(localStorage.length).toBe(0);
  });

  it("prefetches ['userInfo'] into the query cache on success", async () => {
    loginApiMock.mockResolvedValue(loginResponse);
    getUserInfoMock.mockResolvedValue(userDetails);

    const { result, queryClient } = renderUseLogin();

    act(() => {
      result.current.mutate(credentials);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await waitFor(() =>
      expect(queryClient.getQueryData(["userInfo"])).toEqual(userDetails)
    );
    expect(getUserInfoMock).toHaveBeenCalledTimes(1);
  });

  it("exposes the login response as mutation data", async () => {
    loginApiMock.mockResolvedValue(loginResponse);
    getUserInfoMock.mockResolvedValue(userDetails);

    const { result } = renderUseLogin();

    act(() => {
      result.current.mutate(credentials);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(loginResponse);
  });

  it("leaves storage and cache untouched on failure", async () => {
    loginApiMock.mockRejectedValue(new Error("Invalid credentials"));

    const { result, queryClient } = renderUseLogin();

    act(() => {
      result.current.mutate(credentials);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(localStorage.length).toBe(0);
    expect(getUserInfoMock).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(["userInfo"])).toBeUndefined();
  });
});
