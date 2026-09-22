import axios, { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { tokenStore } from "../auth/tokenStore";
import { attemptRefresh, endSession } from "../auth/session";

export type ApiError = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  traceId?: string;
};

// Base URLs from .env
const AUTH_BASE_URL = import.meta.env.VITE_API_AUTH_URL;     // e.g. https://api.dev.tranzpay.com
const PORTAL_BASE_URL = import.meta.env.VITE_API_PORTAL_URL; // e.g. https://portal.api.dev.tranzpay.com

// ---------- AUTH CLIENT (no bearer header) ----------
export const authClient = axios.create({
  baseURL: AUTH_BASE_URL,
  timeout: 20000,
  withCredentials: false,
});

// ---------- PORTAL CLIENT (auto attach bearer) ----------
export const portalClient = axios.create({
  baseURL: PORTAL_BASE_URL,
  timeout: 20000,
  withCredentials: false,
});

portalClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const authHeader = tokenStore.getAuthHeader();
  if (authHeader) {
    if (!(config.headers instanceof AxiosHeaders)) {
      config.headers = new AxiosHeaders(config.headers);
    }
    if (!config.headers.has("Authorization")) {
      config.headers.set("Authorization", authHeader);
    }
  }
  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

// Single 401 path, shaped for refresh tokens from day one:
// 401 → single-flight refresh attempt → retry the original request once →
// on failure, session-expired teardown. attemptRefresh is a stub resolving
// null until the refresh backend ships, so today every 401 ends the session.
portalClient.interceptors.response.use(
  (res) => res,
  async (err: AxiosError<ApiError>) => {
    const original = err.config as RetriableConfig | undefined;

    if (err.response?.status === 401 && original && !original._retried) {
      original._retried = true; // retry-once guard — prevents 401 loops
      const newToken = await attemptRefresh();
      if (newToken) {
        original.headers = AxiosHeaders.from(original.headers).set(
          "Authorization",
          `${tokenStore.getSession()?.tokenType ?? "Bearer"} ${newToken}`
        );
        return portalClient(original);
      }
      endSession("unauthorized"); // idempotent — concurrent 401s tear down once
    }

    // Sanitized only — never log headers, request bodies, or tokens.
    const apiError = err.response?.data;
    console.error("API Error:", {
      message: apiError?.detail || apiError?.title || err.message,
      status: err.response?.status,
      traceId: apiError?.traceId,
      url: err.config?.url,
    });

    return Promise.reject(err);
  }
);
