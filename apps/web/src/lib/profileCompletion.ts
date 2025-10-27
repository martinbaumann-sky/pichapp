import { normalizeForStorage } from "@/lib/phone";

export const PROFILE_PLACEHOLDER_COMUNA = "Por definir";
export const PROFILE_PLACEHOLDER_PHONE = normalizeForStorage("+56 9 1234 5678") ?? "56900000000";
export const PROFILE_COMPLETION_REQUIRED_MESSAGE =
  "Completa tu perfil con tu comuna y celular antes de reservar un partido.";

export type ProfileLike = {
  phone?: string | null;
  comuna?: string | null;
} | null | undefined;

export function isProfileComplete(profile: ProfileLike): boolean {
  if (!profile) return false;
  const phone = profile.phone ? String(profile.phone).trim() : "";
  const comuna = profile.comuna ? String(profile.comuna).trim() : "";
  if (!phone || phone === PROFILE_PLACEHOLDER_PHONE) {
    return false;
  }
  if (!comuna || comuna === PROFILE_PLACEHOLDER_COMUNA) {
    return false;
  }
  return true;
}

export function isProfileIncomplete(profile: ProfileLike): boolean {
  return !isProfileComplete(profile);
}
