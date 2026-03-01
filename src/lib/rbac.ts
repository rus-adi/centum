import { requireSession } from "@/lib/session";

export type Role = "SUPER_ADMIN" | "ADMIN" | "STAFF" | "IT" | "COACH" | "TEACHER";

export async function requireRole(roles: Role[]) {
  const session = await requireSession();
  const role = session.user.role as Role;

  if (role === "SUPER_ADMIN") return session; // global bypass
  if (!roles.includes(role)) {
    throw new Error("Forbidden");
  }
  return session;
}

// Small permission helpers (MVP defaults)
export function canManageUsers(role: Role) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function canManageToolsDirect(role: Role) {
  return role === "ADMIN" || role === "IT" || role === "SUPER_ADMIN";
}

export function canResolveRequests(role: Role) {
  return role === "ADMIN" || role === "IT" || role === "SUPER_ADMIN";
}

export function canDelete(role: Role) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}
