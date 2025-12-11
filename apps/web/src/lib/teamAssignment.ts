export type TeamAssignmentInput = {
  preferredTeam?: string | null;
  existingTeam?: string | null;
};

export function sanitizePosition(position: string | null | undefined) {
  if (!position) return null;
  return String(position).trim().toUpperCase() || null;
}

export function resolveTeamForUser(input: TeamAssignmentInput) {
  if (input.preferredTeam) return input.preferredTeam;
  if (input.existingTeam) return input.existingTeam;
  return null;
}
