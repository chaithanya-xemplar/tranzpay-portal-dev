import type { UserPermissionEntity } from "../../pages/users/userPermission.types";


export interface GetUserPermissionsRequestDto {
  id: number;
  searchWord?: string;
  entityTypeFilter?: string;
  sortColumn?: string;
  sortOrder?: "asc" | "desc";
  pageSize: number;
  currentPage: number;
}

export interface GetUserPermissionsResponseDto {
  success: boolean;
  data: UserPermissionEntity[];
  count: number;
  request: GetUserPermissionsRequestDto;
}

export interface AddUpdateUserRoleItemDto {
  roleId: number;
  roleName: string;
  userEntityRoleId: number;
  cuserEntityXrefId: number;
  allow: boolean;
}

export interface AddUpdateUserRoleRequestDto {
  userId: number;
  permissions: AddUpdateUserRoleItemDto[];
}

