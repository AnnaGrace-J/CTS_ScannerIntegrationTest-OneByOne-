import type { NavRoute, Role, Workstep } from "../types";
import { inwardRoutes, outwardRoutes, utilityRoutes } from "../data/seed";
import { canRoleAccessWorkstep } from "./workflow";

export type RouteAccess = {
  path: string;
  roles?: Role[];
  workstep?: Workstep;
};

export const routeAccess: RouteAccess[] = [
  { path: "/change-password", roles: ["MAKER", "CHECKER", "ADMIN"] },
  { path: "/outward/dashboard", roles: ["MAKER", "CHECKER", "ADMIN"] },
  { path: "/outward/scanning", workstep: "SCANNING_DATA_ENTRY" },
  { path: "/outward/authorization", workstep: "OUTWARD_AUTHORIZATION" },
  { path: "/outward/repair", workstep: "OUTWARD_REPAIR" },
  { path: "/outward/hold-for-icl-generation", workstep: "HOLD_FOR_ICL_GENERATION" },
  { path: "/outward/icl-generation", workstep: "ICL_FILE_GENERATION" },
  { path: "/outward/forward-upload-response", workstep: "FORWARD_UPLOAD_FILE_RESPONSE" },
  { path: "/outward/nak-repair", workstep: "OUTWARD_NAK_REPAIR" },
  { path: "/outward/wait-for-return", workstep: "WAIT_FOR_RETURN" },
  { path: "/outward/credit-posting", workstep: "CREDIT_POSTING" },
  { path: "/outward/reports", roles: ["MAKER", "CHECKER", "ADMIN"] },
  { path: "/inward/dashboard", roles: ["MAKER", "CHECKER", "ADMIN"] },
  { path: "/inward/upload-icl", workstep: "READ_UPLOAD_FORWARD_DOWNLOAD_ICL" },
  { path: "/inward/technical-verification", workstep: "TECHNICAL_VERIFICATION" },
  { path: "/inward/debit-posting", workstep: "DEBIT_POSTING" },
  { path: "/inward/referral", workstep: "REFERRAL" },
  { path: "/inward/manual-return-maker", workstep: "MANUAL_RETURN_MAKER" },
  { path: "/inward/manual-return-checker", workstep: "MANUAL_RETURN_CHECKER" },
  { path: "/inward/return-icl-generation", workstep: "RETURN_ICL_CREATION" },
  { path: "/inward/return-upload-response", workstep: "RETURN_UPLOAD_FILE_RESPONSE" },
  { path: "/inward/nak-repair", workstep: "INWARD_NAK_REPAIR" },
  { path: "/inward/charge-posting", workstep: "INWARD_CHARGE_POSTING" },
  { path: "/inward/reports", roles: ["MAKER", "CHECKER", "ADMIN"] },
  { path: "/search", roles: ["MAKER", "CHECKER", "ADMIN"] },
  { path: "/admin", roles: ["ADMIN"] },
  { path: "/admin/archive", roles: ["ADMIN"] },
  { path: "/architecture", roles: ["ADMIN"] }
];

export function canAccessRoute(role: Role | undefined, path: string): boolean {
  if (!role) return false;
  const access = routeAccess.find((item) => item.path === path);
  if (!access) return true;
  if (access.roles) return access.roles.includes(role);
  if (access.workstep) return canRoleAccessWorkstep(role, access.workstep);
  return true;
}

export function filterRoutesForRole(routes: NavRoute[], role: Role | undefined): NavRoute[] {
  return routes.filter((route) => canAccessRoute(role, route.path));
}

export function visibleNavGroups(role: Role | undefined) {
  return {
    outward: filterRoutesForRole(outwardRoutes, role),
    inward: filterRoutesForRole(inwardRoutes, role),
    options: filterRoutesForRole(utilityRoutes, role)
  };
}
