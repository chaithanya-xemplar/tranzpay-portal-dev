import { useEffect, useMemo, useRef, useState } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";

import type {
  PermissionRow,
} from "./userPermission.types";

import { transformPermissions } from "./userPermissionUtils";
// import { extractRoles } from "./userPermissionUtils"; // Dynamic Roles
import { MASTER_ROLES } from "../../constants/constants";

import Button from "../../design-system/Button";
import Checkbox from "../../design-system/Checkbox";
import { useToast } from "../../design-system/toast/ToastContext";
import { useAddUpdateUserRole, useUserPermissions } from "../../services/user-permissions/userPermissionsApi";
import type { AddUpdateUserRoleItemDto, AddUpdateUserRoleRequestDto, GetUserPermissionsRequestDto } from "./userPermissions.api.types";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import Select from "../../design-system/select/Select";
import { ENTITY_TYPE_OPTIONS } from "../../constants/constants";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/Icon/Icon";
import AddPermissionDialog from "./AddPermissionDialog";


type PermissionColumnMeta = {
  width?: number | string;
  align?: "left" | "center" | "right";
};

interface Props {
  userId: number;
  userName?: string;
}

const UserPermissionsTable = ({ userId, userName }: Props) => {

const [pageIndex, setPageIndex] = useState(0);
const [pageSize, setPageSize] = useState(10);
const [sorting, setSorting] = useState<SortingState>([]);
const [search, setSearch] = useState("");
const [entityType, setEntityType] = useState<string>("All");

const debouncedSearch = useDebouncedValue(search, 400);
const requestPayload: GetUserPermissionsRequestDto = useMemo(() => {
  const sort = sorting[0];

  return {
    id: userId,
    pageSize,
    currentPage: pageIndex + 1,
    searchWord: debouncedSearch ? debouncedSearch : undefined,
    entityTypeFilter: entityType === "All" ? undefined : entityType,
    sortColumn: sort?.id,
    sortOrder: sort
      ? (sort.desc ? "desc" : "asc") as "asc" | "desc"
      : undefined,
  };
}, [userId, pageIndex, pageSize, debouncedSearch, sorting, entityType]);

const { data } = useUserPermissions(requestPayload);
const addUpdateMutation = useAddUpdateUserRole();

// const rawData: UserPermissionEntity[] = samplePermissions;

/** -----------------------------
 * Extract Roles (Dynamic Columns)
 ------------------------------*/
const rolesList = MASTER_ROLES;

/** -----------------------------
 * Transform Table Data
 ------------------------------*/
const transformed = useMemo(() => {
  if (!data?.data) return [];
  return transformPermissions(data.data);
}, [data]);

useEffect(() => {
  setTableData(transformed);
  originalRef.current = transformed;
  setChangedMap({});
}, [transformed]);

/** -----------------------------
 * Original Data Reference (Dirty Check Later)
 ------------------------------*/
const originalRef = useRef<PermissionRow[]>(transformed);

/** -----------------------------
 * Editable Table State
 ------------------------------*/
const [tableData, setTableData] = useState<PermissionRow[]>(transformed);

const [changedMap, setChangedMap] = useState<Record<string, boolean>>({});

/** -----------------------------
 * Edit Mode
 ------------------------------*/
const [isEditMode, setIsEditMode] = useState(false);

const [isAddPermissionOpen, setIsAddPermissionOpen] =
  useState(false);

/** -----------------------------
 * Dirty State
 ------------------------------*/
const isDirty = Object.keys(changedMap).length > 0;

const { toast } = useToast();
const navigate = useNavigate();

useEffect(() => {
  setPageIndex(0);
}, [sorting, debouncedSearch]);

const handleCheckboxChange = (
  entityId: number,
  roleId: number,
  checked: boolean
) => {

  setTableData((prev) =>
    prev.map((row) => {
      if (row.entityId !== entityId) return row;

      const existingRole = row.rolesMap[roleId];

      return {
        ...row,
        rolesMap: {
          ...row.rolesMap,
          [roleId]: {
            allow: checked,
            userEntityRoleId: existingRole?.userEntityRoleId, // undefined for new
            roleName: existingRole?.roleName ?? `role-${roleId}`
          },
        },
      };
    })
  );

  /** Dirty Tracking Must Still Work */
  const key = `${entityId}-${roleId}`;

  setChangedMap((prev) => {
    const copy = { ...prev };

    const originalRow = originalRef.current.find(
        (r) => r.entityId === entityId
    );

    const originalRole = originalRow?.rolesMap?.[roleId];

    const originalValue = originalRole ? originalRole.allow : false;

    if (checked === originalValue) {
        delete copy[key];
    } else {
        copy[key] = true;
    }

    return copy;
    });

};

const handleCancelEdit = () => {
  setTableData(originalRef.current);
  setChangedMap({});
  setIsEditMode(false);
};

const buildPermissionsArray = (): AddUpdateUserRoleItemDto[] => {

  const permissions: AddUpdateUserRoleItemDto[] = [];

  Object.keys(changedMap).forEach((key) => {

    const [entityIdStr, roleIdStr] = key.split("-");

    const entityId = Number(entityIdStr);
    const roleId = Number(roleIdStr);

    const row = tableData.find((r) => r.entityId === entityId);
    if (!row) return;

    const roleData = row.rolesMap[roleId];
    if (!roleData) return;

    /** ⭐ ALWAYS SEND XREF */
    const cuserEntityXrefId = row.cuserEntityXrefId ?? 0;

    const permissionItem: AddUpdateUserRoleItemDto = {
      roleId,
      roleName: roleData.roleName,
      userEntityRoleId: roleData.userEntityRoleId ?? 0,
      cuserEntityXrefId,
      allow: roleData.allow,
    };

    if (roleData.userEntityRoleId != null) {
      permissionItem.userEntityRoleId = roleData.userEntityRoleId;
    }

    permissions.push(permissionItem);

  });

  return permissions;
};

const columns = useMemo<ColumnDef<PermissionRow>[]>(
    () => [
        /** Entity Name */
        {
        accessorKey: "entityName",
        header: "Entity Name",
        cell: (info) => info.getValue(),
        meta: { width: '160' },
        enableSorting: true,
        },

        /** Entity Type */
        {
        accessorKey: "entityType",
        header: "Entity Type",
        cell: (info) => info.getValue(),
        meta: { width: '80' },
        enableSorting: true,
        },

        /** Dynamic Role Columns */
        ...rolesList.map<ColumnDef<PermissionRow>>((role) => ({
        id: `role-${role.roleId}`,
        header: role.roleName,
        meta: { width: '80' , align: "center" },

        cell: ({ row }) => {
            const rowData = row.original;

            const roleData = rowData.rolesMap[role.roleId];

            const checked = roleData?.allow ?? false;

            return (
              <div className="flex items-center justify-center w-full">
                <Checkbox
                  checked={checked}
                  disabled={!isEditMode}
                  onChange={(val) =>
                    handleCheckboxChange(
                      rowData.entityId,
                      role.roleId,
                      val
                    )
                  }
                />
              </div>
            );
        },
        }))

    ],
    [rolesList, isEditMode]
);

const totalRecords = data?.count ?? 0;
const totalPages = Math.ceil(totalRecords / pageSize);
const showNoResults = !data || totalRecords === 0;

const table = useReactTable({
  data: tableData,
  columns,
  state: {
    pagination: { pageIndex, pageSize },
    sorting,
  },

  manualPagination: true,
  manualSorting: true,

  // ✅ IMPORTANT — must use backend count
  pageCount: totalPages,

  onPaginationChange: (updater) => {
    const next =
      typeof updater === "function"
        ? updater({ pageIndex, pageSize })
        : updater;

    setPageIndex(next.pageIndex);
    setPageSize(next.pageSize);
  },

  onSortingChange: setSorting,
  getCoreRowModel: getCoreRowModel(),
  enableMultiSort: false,
});

const handleSave = async () => {
  try {
    const permissions = buildPermissionsArray();

    const payload: AddUpdateUserRoleRequestDto= {
      userId,
      permissions,
    };
    /** API CALL */
    await addUpdateMutation.mutateAsync(payload);

    /** ✅ SUCCESS TOAST */
    toast({
      variant: "success",
      title: "Permissions Updated",
      description:
        // res?.message || "User permissions updated successfully",
        "User permissions updated successfully",
    });

    /** Reset UI */
    originalRef.current = tableData;
    setChangedMap({});
    setIsEditMode(false);

  } catch (error: unknown) {

    /** ❌ ERROR TOAST */
    toast({
      variant: "error",
      title: "Update Failed",
      description:
        // error?.response?.data?.message ||
        "Failed to update user permissions",
    });

    console.error(error);
  }
};



  return (
    <div >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex justify-center text-lg font-bold pl-1 text-dark-grey">
          <button className="mr-2 cursor-pointer" onClick={() => navigate("/users")}>
            <Icon name="arrow-left" size={24} />
          </button>
          <span>
            {userName? userName : "User Permission"}
          </span>
          </div>
        <div>
          <Button
            variant="primary"
            className="cursor-pointer border text-sm font-semibold ml-3"
            onClick={() => setIsAddPermissionOpen(true)}
          >
            Add Permission
          </Button>
          <Button
            variant="outline"
            className="cursor-pointer border text-sm font-semibold"
            icon={isEditMode ? "x" : "edit"}
            iconPosition="left"
            onClick={() => {
              if (isEditMode) {
                  handleCancelEdit();
              } else {
                  setIsEditMode(true);
              }
            }}
          >
              {isEditMode ? "Cancel" : "Edit Permissions"}
          </Button>
          { isEditMode &&
          <Button
            disabled={!isDirty}
            variant="primary"
            className={`font-semibold text-sm border cursor-pointer ml-3 ${!isDirty ? 'opacity-30' : ''}`}
            icon="save"
            iconPosition="left"
            
            onClick={handleSave}
            > 
            Save
          </Button>
          }
        </div>
      </div>

      <div className="bg-white rounded shadow">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-3">
          <div className="text-base font-bold text-dark-grey">{'User Permissions'}</div>

          <div className="flex items-center justify-end gap-3">
            {/* Search box */}
            <div className="flex justify-between items-center border border-divider rounded-lg w-56 px-3 py-1 h-9">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPageIndex(0); // reset page when searching
                }}
                placeholder="Search"
                className="outline-none border-none text-xs text-grey-700"
              />
              <span className="flex items-center">
                <Icon name="search" />
              </span>
            </div>

            <div className="flex items-center  ">
            <span className="text-xs text-medium-grey mr-2">Entity Type</span>

            <Select
              name="entityType"
              value={entityType}
              options={ENTITY_TYPE_OPTIONS}
              onChange={(val) => setEntityType(val)}
              className="min-w-[140px]"
              selectClassName=""
            />
          </div>

          </div>
        </div>
        <div className="w-full overflow-x-auto">
          <div className="min-w-full">
            <table className="w-full table-fixed border-collapse">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="bg-primary_light2">
                    {hg.headers.map((h) => {
                      const meta = h.column.columnDef.meta as PermissionColumnMeta | undefined;

                      return (
                        <th
                          key={h.id}
                          className={`
                            px-3 py-3 text-xs text-secondary font-semibold
                            border-t border-b border-primary_light1
                            align-top break-words relative
                            ${
                              meta?.align === "center"
                                ? "text-center"
                                : meta?.align === "right"
                                ? "text-right"
                                : "text-left"
                            }
                          `}
                          style={{
                            width: meta?.width ? `${meta.width}px` : undefined,
                            maxWidth: meta?.width ? `${meta.width}px` : "220px",
                            minWidth: meta?.width ? `${meta.width}px` : "120px",
                            userSelect: "none",
                            cursor: h.column.getCanSort() ? "pointer" : "default",
                            whiteSpace: "normal",
                            wordWrap: "break-word",
                          }}
                          onClick={h.column.getToggleSortingHandler()}
                        >
                          {!h.isPlaceholder && (
                            <div
                              className={`
                                flex w-full gap-2
                                ${
                                  meta?.align === "center"
                                    ? "items-center justify-center"
                                    : "items-start justify-between"
                                }
                              `}
                            >
                              {/* Header Text */}
                              <span className="block leading-snug break-words">
                                {flexRender(h.column.columnDef.header, h.getContext())}
                              </span>

                              {/* Sort Icon — only for sortable columns */}
                              {h.column.getCanSort() && meta?.align !== "center" && (
                                <span className="flex-shrink-0 ml-auto pl-1">
                                  {h.column.getIsSorted() === "asc" ? (
                                    <Icon name="arrow-up" size={16} />
                                  ) : h.column.getIsSorted() === "desc" ? (
                                    <Icon name="arrow-down" size={16} />
                                  ) : (
                                    <Icon name="arrow-up" size={16} className="opacity-70" />
                                  )}
                                </span>
                              )}
                            </div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>

              <tbody>
                {showNoResults ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="text-center py-10 text-sm text-medium-grey"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="font-semibold text-dark-grey">
                          No results found
                        </span>

                        <span className="text-xs text-medium-grey">
                          {entityType !== "All"
                            ? `No records available for "${entityType}" entity type`
                            : "No data available"}
                        </span>
                        <Button
                          variant="primary"
                          className="cursor-pointer"
                          onClick={() => setIsAddPermissionOpen(true)}
                        >
                          Add Permission
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-dotted border-divider"
                    >
                      {row.getVisibleCells().map((cell) => {
                        const meta =
                          cell.column.columnDef.meta as PermissionColumnMeta | undefined;

                        return (
                          <td
                            key={cell.id}
                            className={`px-3 py-3 text-xs text-medium-grey truncate
                              ${meta?.align === "center" ? "text-center" : "text-left"}
                            `}
                            style={{
                              width: meta?.width ? `${meta.width}px` : undefined,
                              minWidth: meta?.width ? `${meta.width}px` : undefined,
                              maxWidth: meta?.width ? `${meta.width}px` : undefined,
                            }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="p-[10px] flex items-center justify-between border-t border-divider">
              <div className="flex text-xs text-medium-grey items-center">
                <span>Show row </span>

                <div>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      const s = Number(e.target.value);
                      table.setPageSize(s); // triggers API automatically
                    }}
                    className="border border-divider px-2 py-1 rounded ml-2"
                  >
                    {[10, 20, 50, 100].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <span className="px-3">
                  Page {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount()} • {totalRecords} records
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Previous */}
                <button
                  className="flex items-center px-2.5 py-2 text-xs text-medium-grey border rounded border-divider disabled:opacity-30 h-7"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </button>

                {/* Page Numbers */}
                {(() => {
                  const totalPages = table.getPageCount();
                  const currentPage = table.getState().pagination.pageIndex;
                  const pages: (number | "ellipsis")[] = [];

                  if (totalPages <= 7) {
                    for (let i = 0; i < totalPages; i++) pages.push(i);
                  } else {
                    pages.push(0);
                    if (currentPage > 2) pages.push("ellipsis");

                    const windowStart = Math.max(1, currentPage - 1);
                    const windowEnd = Math.min(totalPages - 2, currentPage + 1);

                    for (let i = windowStart; i <= windowEnd; i++) pages.push(i);

                    if (currentPage < totalPages - 3) pages.push("ellipsis");
                    pages.push(totalPages - 1);
                  }

                  return pages.map((p, idx) =>
                    p === "ellipsis" ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">
                        …
                      </span>
                    ) : (
                      <button
                        key={`page-${p}`}
                        onClick={() => table.setPageIndex(p)}
                        className={`flex items-center px-2.5 py-2 text-xs border rounded border-divider h-7 ${
                          currentPage === p
                            ? "bg-primary text-white border-primary"
                            : "hover:bg-gray-100 text-medium-grey"
                        }`}
                      >
                        {p + 1}
                      </button>
                    )
                  );
                })()}

                {/* Next */}
                <button
                  className="flex items-center px-2.5 py-2 text-xs text-medium-grey border rounded border-divider disabled:opacity-30 h-7"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddPermissionDialog
        open={isAddPermissionOpen}
        onClose={() => setIsAddPermissionOpen(false)}
        onSave={(data) => {
          console.log("save permission", data);

          // Call AddUpdateUserRole API here

          setIsAddPermissionOpen(false);
        }}
      />

    </div>
  );
};

export default UserPermissionsTable;
