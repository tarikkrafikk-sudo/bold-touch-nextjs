import { cookies } from "next/headers";

export const ADMIN_COOKIE = "bt_admin";

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "boldtouch2026";
}

export function isAdminAuthed(): boolean {
  return cookies().get(ADMIN_COOKIE)?.value === "ok";
}
