export type FriendStatus = "SELF" | "NONE" | "PENDING_OUT" | "PENDING_IN" | "FRIENDS" | "BLOCKED";

export type FriendRecord = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "BLOCKED";
  requesterId: string;
  addresseeId: string;
};

export type FriendshipSnapshot = {
  status: FriendStatus;
  friendId?: string | null;
  isRequester?: boolean;
};

export function resolveFriendship(viewerId: string | null, targetId: string, record?: FriendRecord | null): FriendshipSnapshot {
  if (!viewerId) {
    return { status: "NONE" };
  }
  if (viewerId === targetId) {
    return { status: "SELF" };
  }
  if (!record) {
    return { status: "NONE" };
  }

  if (record.status === "ACCEPTED") {
    return { status: "FRIENDS", friendId: record.id };
  }
  if (record.status === "BLOCKED") {
    return { status: "BLOCKED", friendId: record.id };
  }
  if (record.status === "PENDING") {
    const viewerIsRequester = record.requesterId === viewerId;
    return {
      status: viewerIsRequester ? "PENDING_OUT" : "PENDING_IN",
      friendId: record.id,
      isRequester: viewerIsRequester,
    };
  }

  return { status: "NONE" };
}
