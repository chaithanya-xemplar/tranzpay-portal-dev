import { useQuery, useMutation, keepPreviousData , useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { portalClient } from "../axios";
export interface GetUserPermissionsRequest {
  id: number;
  pageSize: number;
  currentPage: number;
  searchWord?: string;
  entityTypeFilter?: string;
  sortColumn?: string;
  sortOrder?: "asc" | "desc";
}

/* =========================================================
   GET USER PERMISSIONS
========================================================= */

import type {
  AddUpdateUserRoleRequestDto,
  GetUserPermissionsRequestDto,
  GetUserPermissionsResponseDto,
} from "../../pages/users/userPermissions.api.types";

export const getUserPermissions = async (
  payload: GetUserPermissionsRequestDto
): Promise<GetUserPermissionsResponseDto> => {
  const response = await portalClient.post(
    "/api/v1/GetUser",
    payload
  );

  return response.data;
};

/* =========================================================
   ADD UPDATE USER PERMISSIONS
========================================================= */

export const addUpdateUserRole = async (
  payload: AddUpdateUserRoleRequestDto
) => {
  const response = await portalClient.post(
    "/api/v1/AddUpdateUserRole",
    payload
  );

  return response.data;
};

/* =========================================================
   HOOKS
========================================================= */

/** GET Hook */
export const useUserPermissions = (
  params: GetUserPermissionsRequestDto
): UseQueryResult<GetUserPermissionsResponseDto, Error> => {
  return useQuery<GetUserPermissionsResponseDto, Error>({
    queryKey: [
      "userPermissions",
      params.id,
      params.currentPage,
      params.pageSize,
      params.searchWord ?? "",
      params.entityTypeFilter ?? "All",
      params.sortColumn ?? "",
      params.sortOrder ?? "",
    ],
    queryFn: () => getUserPermissions(params),
    placeholderData: keepPreviousData,
    retry: 1,
  });
};

export const useAddUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddUpdateUserRoleRequestDto) =>
      addUpdateUserRole(payload),

    onSuccess: () => {
      // ✅ refetch current table using same params
      queryClient.invalidateQueries({
        queryKey: ["userPermissions"],
      });
    },
  });
};