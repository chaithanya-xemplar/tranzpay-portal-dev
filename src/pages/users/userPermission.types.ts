export type userRoles = {
  roleId: number;
  roleName: string;
  userEntityRoleId: number;
  allow: boolean;
};

export type UserPermissionEntity = {
  userId: number;
  entityId: number;
  entityName: string | null;
  entityTypeId: number;
  entityType: string;
  cuserEntityXrefId?: number;
  userRoles: userRoles[];
};

export type PermissionRow = {
  entityId: number;
  entityName: string | null;
  entityType: string;
  cuserEntityXrefId?: number;

  rolesMap: Record<
    number,
    {
      allow: boolean;
      userEntityRoleId: number;
      roleName: string;
    }
  >;
};

export type UserPermissionSavePayloadItem = {
  entityId: number;
  roleId: number;
  userEntityRoleId: number;
  cuserEntityXrefId: number;
  allow: boolean;
};


