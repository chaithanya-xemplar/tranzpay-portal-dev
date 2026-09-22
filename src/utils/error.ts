import { AxiosError } from "axios";
import type { ApiError } from "../services/http/clients";

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const axiosError = error as AxiosError<ApiError>;

    return (
      axiosError.response?.data?.detail ||
      axiosError.response?.data?.title ||
      axiosError.message
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}

export function getTraceId(error: unknown): string | undefined {
  if (error instanceof AxiosError) {
    const axiosError = error as AxiosError<ApiError>;
    return axiosError.response?.data?.traceId;
  }
}