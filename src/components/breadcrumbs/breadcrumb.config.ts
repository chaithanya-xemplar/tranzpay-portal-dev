import { matchPath, type Params } from "react-router-dom";

export type CrumbEntity =
  | "corp"
  | "merchant"
  | "producer"
  | "processor"
  | "merchantProcessor"
  | "user";

export interface CrumbSpec {
  /** Static label. Mutually exclusive with entity. */
  label?: string;
  /** Dynamic label resolved by useBreadcrumbs from the matching entity query. */
  entity?: CrumbEntity;
  /** Link target; may contain :params interpolated from the matched route. Omit on the last crumb. */
  to?: string;
}

interface BreadcrumbRouteConfig {
  pattern: string;
  /** Full trail for the route, excluding the implicit "Dashboard" root. */
  crumbs: CrumbSpec[];
}

export const BREADCRUMB_ROUTES: BreadcrumbRouteConfig[] = [
  { pattern: "/profile", crumbs: [{ label: "Profile" }] },

  { pattern: "/corps", crumbs: [{ label: "Companies" }] },
  {
    pattern: "/corps/create",
    crumbs: [{ label: "Companies", to: "/corps" }, { label: "New Company" }],
  },
  {
    pattern: "/corps/:id",
    crumbs: [{ label: "Companies", to: "/corps" }, { entity: "corp" }],
  },

  { pattern: "/merchants", crumbs: [{ label: "Merchants" }] },
  {
    pattern: "/merchants/create",
    crumbs: [{ label: "Merchants", to: "/merchants" }, { label: "New Merchant" }],
  },
  {
    pattern: "/merchants/:id",
    crumbs: [{ label: "Merchants", to: "/merchants" }, { entity: "merchant" }],
  },
  {
    pattern: "/merchants/:id/producers",
    crumbs: [
      { label: "Merchants", to: "/merchants" },
      { entity: "merchant", to: "/merchants/:id" },
      { label: "Associated Processing Profiles" },
    ],
  },
  {
    pattern: "/merchants/:id/processors",
    crumbs: [
      { label: "Merchants", to: "/merchants" },
      { entity: "merchant", to: "/merchants/:id" },
      { label: "Processors" },
    ],
  },
  {
    pattern: "/merchants/:id/processors/create",
    crumbs: [
      { label: "Merchants", to: "/merchants" },
      { entity: "merchant", to: "/merchants/:id" },
      { label: "Processors", to: "/merchants/:id/processors" },
      { label: "New Processor" },
    ],
  },
  {
    pattern: "/merchants/:id/processors/:processorId",
    crumbs: [
      { label: "Merchants", to: "/merchants" },
      { entity: "merchant", to: "/merchants/:id" },
      { label: "Processors", to: "/merchants/:id/processors" },
      { entity: "merchantProcessor" },
    ],
  },

  { pattern: "/producers", crumbs: [{ label: "Processing Profiles" }] },
  {
    pattern: "/producers/create",
    crumbs: [{ label: "Processing Profiles", to: "/producers" }, { label: "New Processing Profile" }],
  },
  {
    pattern: "/producers/:id",
    crumbs: [{ label: "Processing Profiles", to: "/producers" }, { entity: "producer" }],
  },

  { pattern: "/users", crumbs: [{ label: "Users" }] },
  {
    pattern: "/users/:userId/permissions",
    crumbs: [
      { label: "Users", to: "/users" },
      { entity: "user" },
      { label: "Permissions" },
    ],
  },

  { pattern: "/processors", crumbs: [{ label: "Processors" }] },
  {
    pattern: "/processors/create",
    crumbs: [{ label: "Processors", to: "/processors" }, { label: "New Processor" }],
  },
  {
    pattern: "/processors/:id",
    crumbs: [{ label: "Processors", to: "/processors" }, { entity: "processor" }],
  },

  { pattern: "/onboarding", crumbs: [{ label: "Onboarding" }] },
  { pattern: "/api-logs", crumbs: [{ label: "API Logs" }] },
  {
    pattern: "/blacklisted-accounts",
    crumbs: [{ label: "Blacklisted Bank Accounts" }],
  },
  { pattern: "/ivr", crumbs: [{ label: "IVR" }] },
  { pattern: "/design-system", crumbs: [{ label: "Design System" }] },
];

export interface ResolvedTrail {
  specs: CrumbSpec[];
  params: Params<string>;
}

export function resolveBreadcrumbTrail(pathname: string): ResolvedTrail | null {
  for (const route of BREADCRUMB_ROUTES) {
    const match = matchPath({ path: route.pattern, end: true }, pathname);
    if (match) return { specs: route.crumbs, params: match.params };
  }
  return null;
}

export function interpolatePath(to: string, params: Params<string>): string {
  return to.replace(/:(\w+)/g, (_, key: string) => params[key] ?? "");
}
