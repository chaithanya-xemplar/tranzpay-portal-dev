// src/services/user-permissions/userPermissionsApi.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { portalClient } from "../axios";
import type {
  AddUpdateUserRoleRequestDto,
  GetUserPermissionsRequestDto,
} from "../../pages/users/userPermissions.api.types";
import { getUserPermissions, addUpdateUserRole } from "./userPermissionsApi";

vi.mock("../axios", () => ({
  portalClient: {
    post: vi.fn(),
  },
}));

describe("userPermissionsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getUserPermissions POSTs the payload to GetUser and returns response.data", async () => {
    const payload: GetUserPermissionsRequestDto = {
      id: 5,
      pageSize: 10,
      currentPage: 1,
      searchWord: "demo",
      entityTypeFilter: "All",
      sortColumn: "roleName",
      sortOrder: "asc",
    };
    const response = { success: true, data: [], count: 0, request: payload };

    vi.mocked(portalClient.post).mockResolvedValue({ data: response } as never);

    const result = await getUserPermissions(payload);

    expect(portalClient.post).toHaveBeenCalledWith("/api/v1/GetUser", payload);
    expect(result).toEqual(response);
  });

  it("addUpdateUserRole POSTs the payload to AddUpdateUserRole and returns response.data", async () => {
    const payload: AddUpdateUserRoleRequestDto = {
      userId: 5,
      permissions: [
        {
          roleId: 2,
          roleName: "Viewer",
          userEntityRoleId: 11,
          cuserEntityXrefId: 22,
          allow: true,
        },
      ],
    };
    const response = { success: true };

    vi.mocked(portalClient.post).mockResolvedValue({ data: response } as never);

    const result = await addUpdateUserRole(payload);

    expect(portalClient.post).toHaveBeenCalledWith(
      "/api/v1/AddUpdateUserRole",
      payload
    );
    expect(result).toEqual(response);
  });
});
