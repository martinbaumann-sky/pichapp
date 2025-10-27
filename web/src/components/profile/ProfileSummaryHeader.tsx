"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import ProfileCard from "@/components/profile/ProfileCard";
import AddFriendButton from "@/components/AddFriendButton";
import type { PublicUserSummary } from "@/lib/user-summary";

type Props = {
  summary: PublicUserSummary;
};

export default function ProfileSummaryHeader({ summary }: Props) {
  const { user, stats, friendship } = summary;
  const actionNodes: ReactNode[] = [];

  if (friendship.status === "SELF") {
    actionNodes.push(
      <Link
        key="edit"
        href="/perfil"
        className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
      >
        Editar mi perfil
      </Link>,
    );
  } else {
    actionNodes.push(
      <AddFriendButton
        key="friend"
        targetId={user.id}
        targetName={user.name}
        initialStatus={friendship.status}
        initialFriendId={friendship.friendId ?? null}
        size="sm"
      />,
    );
  }

  const statsList = [
    { label: "Organizados", value: stats.matchesOrganized },
    { label: "Próximos", value: stats.matchesUpcoming },
    { label: "Jugados", value: stats.matchesPlayed },
    { label: "Amigos", value: stats.friendsCount },
  ];

  return (
    <ProfileCard
      name={user.name}
      comuna={user.comuna}
      phoneDisplay={user.phoneDisplay}
      position={user.position}
      skillLevel={user.skillLevel}
      bio={user.bio}
      avatarUrl={user.avatarUrl}
      stats={statsList}
      actions={actionNodes}
      isOwnProfile={friendship.status === "SELF"}
      highlight="Perfil público"
    />
  );
}
