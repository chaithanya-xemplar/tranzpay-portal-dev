import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  loginApi,
  type LoginPayload,
  type LoginResponse,
} from "../services/auth/auth";
import { getUserInfo } from "../services/profile/profileApi";

const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation<LoginResponse, Error, LoginPayload>({
    mutationFn: loginApi,

    // loginApi already persists the session via tokenStore
    onSuccess: async () => {
      await queryClient.prefetchQuery({
        queryKey: ["userInfo"],
        queryFn: getUserInfo,
      });
    },
  });
};

export default useLogin;