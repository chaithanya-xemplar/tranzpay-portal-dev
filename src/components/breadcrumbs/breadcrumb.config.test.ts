import { describe, it, expect } from "vitest";
import {
  BREADCRUMB_ROUTES,
  interpolatePath,
  resolveBreadcrumbTrail,
} from "./breadcrumb.config";

describe("resolveBreadcrumbTrail", () => {
  const cases: {
    path: string;
    labels: (string | undefined)[];
    tos: (string | undefined)[];
  }[] = [
    { path: "/profile", labels: ["Profile"], tos: [undefined] },
    { path: "/corps", labels: ["Corps"], tos: [undefined] },
    { path: "/corps/create", labels: ["Corps", "New Corp"], tos: ["/corps", undefined] },
    { path: "/corps/7", labels: ["Corps", undefined], tos: ["/corps", undefined] },
    { path: "/merchants", labels: ["Merchants"], tos: [undefined] },
    {
      path: "/merchants/create",
      labels: ["Merchants", "New Merchant"],
      tos: ["/merchants", undefined],
    },
    {
      path: "/merchants/42",
      labels: ["Merchants", undefined],
      tos: ["/merchants", undefined],
    },
    {
      path: "/merchants/42/producers",
      labels: ["Merchants", undefined, "Associated Producers"],
      tos: ["/merchants", "/merchants/:id", undefined],
    },
    {
      path: "/merchants/42/processors",
      labels: ["Merchants", undefined, "Processors"],
      tos: ["/merchants", "/merchants/:id", undefined],
    },
    {
      path: "/merchants/42/processors/create",
      labels: ["Merchants", undefined, "Processors", "New Processor"],
      tos: ["/merchants", "/merchants/:id", "/merchants/:id/processors", undefined],
    },
    {
      path: "/merchants/42/processors/9",
      labels: ["Merchants", undefined, "Processors", undefined],
      tos: ["/merchants", "/merchants/:id", "/merchants/:id/processors", undefined],
    },
    { path: "/producers", labels: ["Producers"], tos: [undefined] },
    {
      path: "/producers/create",
      labels: ["Producers", "New Producer"],
      tos: ["/producers", undefined],
    },
    {
      path: "/producers/3",
      labels: ["Producers", undefined],
      tos: ["/producers", undefined],
    },
    { path: "/users", labels: ["Users"], tos: [undefined] },
    {
      path: "/users/9/permissions",
      labels: ["Users", undefined, "Permissions"],
      tos: ["/users", undefined, undefined],
    },
    { path: "/processors", labels: ["Processors"], tos: [undefined] },
    {
      path: "/processors/create",
      labels: ["Processors", "New Processor"],
      tos: ["/processors", undefined],
    },
    {
      path: "/processors/5",
      labels: ["Processors", undefined],
      tos: ["/processors", undefined],
    },
    { path: "/onboarding", labels: ["Onboarding"], tos: [undefined] },
    { path: "/api-logs", labels: ["API Logs"], tos: [undefined] },
    {
      path: "/blacklisted-accounts",
      labels: ["Blacklisted Bank Accounts"],
      tos: [undefined],
    },
    { path: "/ivr", labels: ["IVR"], tos: [undefined] },
    { path: "/design-system", labels: ["Design System"], tos: [undefined] },
  ];

  it.each(cases)("$path resolves to expected trail", ({ path, labels, tos }) => {
    const trail = resolveBreadcrumbTrail(path);
    expect(trail).not.toBeNull();
    expect(trail!.specs.map((s) => s.label)).toEqual(labels);
    expect(trail!.specs.map((s) => s.to)).toEqual(tos);
  });

  it("captures route params", () => {
    expect(resolveBreadcrumbTrail("/merchants/42/processors/9")!.params).toEqual({
      id: "42",
      processorId: "9",
    });
  });

  it("does not confuse create with :id routes", () => {
    expect(
      resolveBreadcrumbTrail("/merchants/create")!.specs.at(-1)?.label
    ).toBe("New Merchant");
    expect(
      resolveBreadcrumbTrail("/merchants/5/processors/create")!.specs.at(-1)?.label
    ).toBe("New Processor");
  });

  it("returns null for the dashboard and unknown paths", () => {
    expect(resolveBreadcrumbTrail("/")).toBeNull();
    expect(resolveBreadcrumbTrail("/no/such/path")).toBeNull();
  });

  it("every config entry declares label xor entity per crumb", () => {
    for (const route of BREADCRUMB_ROUTES) {
      for (const crumb of route.crumbs) {
        expect(Boolean(crumb.label) !== Boolean(crumb.entity)).toBe(true);
      }
    }
  });

  it("last crumb of every route has no link", () => {
    for (const route of BREADCRUMB_ROUTES) {
      expect(route.crumbs.at(-1)?.to).toBeUndefined();
    }
  });
});

describe("interpolatePath", () => {
  it("replaces params", () => {
    expect(interpolatePath("/merchants/:id/processors", { id: "7" })).toBe(
      "/merchants/7/processors"
    );
  });

  it("leaves static paths untouched", () => {
    expect(interpolatePath("/corps", {})).toBe("/corps");
  });
});
