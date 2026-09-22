import type { AxiosResponse } from "axios";
import { useQuery } from "@tanstack/react-query";
import portalClient from "../axios";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export interface UserInfoResponse {
  name: string;
  details: {
    userId: number;
    userName: string;
    name: string;
    email: string;
    role: string;
    picture: string;
  };
}

/* ------------------------------------------------------------------ */
/* API Call                                                           */
/* ------------------------------------------------------------------ */

export const getUserInfo = async (): Promise<UserInfoResponse["details"]> => {
  const { data }: AxiosResponse<UserInfoResponse> =
    await portalClient.get("/api/v1/GetUserInfo");

  if (!data?.details) {
    throw new Error("Invalid response from GetUserInfo");
  }

  return data.details;
};

/* ------------------------------------------------------------------ */
/* React Query Hook                                                   */
/* ------------------------------------------------------------------ */

export const useUserInfo = () =>
  useQuery({
    queryKey: ["userInfo"],
    queryFn: getUserInfo,
    staleTime: 5 * 60 * 1000, // cache for 5 mins
  });