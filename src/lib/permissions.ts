export type AppRole = "SUPER_ADMIN" | "ADMIN" | "STAFF" | "IT" | "COACH" | "TEACHER";

export function isAdminLike(role?: string | null) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function canSeeHQ(role?: string | null) {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function canSeeTransformation(role?: string | null) {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "IT";
}

export function canSeeExecutiveReport(role?: string | null) {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "IT";
}

export function canManageGovernance(role?: string | null) {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function canManagePackAdoptions(role?: string | null) {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "IT";
}

export function canManageToolRecommendations(role?: string | null) {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "IT";
}

export function canResetTraining(role?: string | null) {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function canManagePartnerOps(role?: string | null) {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "IT";
}

export function canManageGrowth(role?: string | null) {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function canSeeGrowth(role?: string | null) {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "COACH" || role === "TEACHER" || role === "STAFF";
}

export function canSeeSettings(role?: string | null) {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function canManageUsers(role?: string | null) {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function canManageSchoolProfile(role?: string | null) {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function isTeacherLike(role?: string | null) {
  return role === "TEACHER" || role === "COACH";
}
