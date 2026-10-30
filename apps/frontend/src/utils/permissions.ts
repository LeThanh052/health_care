import { session, useAuthStore } from "./session";
import type { User } from "../types/auth";

export function getEffectiveUser(): User | null {
    return useAuthStore.getState().user ?? session.getUser();
}

/**
 * Checks if the user has permission to create, edit, or pre-screen residents.
 * Permitted for Admission Staff, DON (Director of Nursing), and System Admin.
 */
export function canManageResidents(user?: User | null): boolean {
    const target = user !== undefined ? user : getEffectiveUser();
    if (!target) return false;

    const rawRole = target.roleName ?? (target as any).role?.roleName ?? (target as any).role ?? "";
    const roleLower = String(rawRole).trim().toLowerCase();

    return (
        roleLower.includes("admission") ||
        roleLower.includes("admin") ||
        roleLower.includes("don") ||
        roleLower.includes("director")
    );
}
