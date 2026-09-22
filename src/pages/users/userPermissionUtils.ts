import type { PermissionRow, UserPermissionEntity } from "./userPermission.types";

export const transformPermissions = (
  data: UserPermissionEntity[]
): PermissionRow[] => {
  return data.map((entity) => {
    const rolesMap: PermissionRow["rolesMap"] = {};

    (entity.userRoles ?? []).forEach((r) => {
        rolesMap[r.roleId] = {
            allow: r.allow,
            userEntityRoleId: r.userEntityRoleId,
            roleName: r.roleName,
        };
    });

    return {
      entityId: entity.entityId,
      entityName: entity.entityName ?? "-",
      entityType: entity.entityType,

      /** ⭐ DIRECT NOW */
      cuserEntityXrefId: entity.cuserEntityXrefId,

      rolesMap,
    };
  });
};




export const extractRoles = (data: UserPermissionEntity[]) => {
  const roleMap = new Map<number, string>();

  data.forEach((entity) => {
    entity.userRoles.forEach((r) => {
      if (!roleMap.has(r.roleId)) {
        roleMap.set(r.roleId, r.roleName);
      }
    });
  });

  return Array.from(roleMap.entries()).map(([roleId, roleName]) => ({
    roleId,
    roleName,
  }));
};
