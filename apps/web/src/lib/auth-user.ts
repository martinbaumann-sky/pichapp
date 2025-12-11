export type AuthUserSource = {
  id: string;
  email: string | null;
  emailVerifiedAt: Date | string | null;
  isAdmin: boolean | null;
  role: string | null;
  profile?: {
    name: string | null;
    comuna: string | null;
    position: string | null;
    skillLevel?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
  } | null;
};

export function toAuthUser(u: AuthUserSource) {
  let role = u.role ? String(u.role).toLowerCase() : "";
  if (!role) {
    role = u.isAdmin ? "superadmin" : "player";
  }
  return {
    id: u.id,
    email: u.email ?? "",
    emailVerified: !!u.emailVerifiedAt,
    isAdmin: !!u.isAdmin,
    role,
    name: u.profile?.name ?? null,
    comuna: u.profile?.comuna ?? null,
    position: u.profile?.position ?? null,
    skillLevel: (u.profile?.skillLevel ?? null) as string | null,
    bio: u.profile?.bio ?? null,
    avatarUrl: u.profile?.avatarUrl ?? null,
  };
}
