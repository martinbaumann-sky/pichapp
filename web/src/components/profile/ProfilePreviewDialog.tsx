"use client";

import { Dialog, Transition } from "@headlessui/react";
import Link from "next/link";
import { Fragment, ReactNode, useCallback, useState } from "react";
import AddFriendButton from "@/components/AddFriendButton";
import ProfileCard from "@/components/profile/ProfileCard";
import type { PublicUserSummary } from "@/lib/user-summary";

type FallbackProfile = {
  name: string;
  comuna?: string | null;
  position?: string | null;
  skillLevel?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  phoneDisplay?: string | null;
};

type ProfilePreviewDialogProps = {
  userId: string;
  trigger: (props: { open: () => void; loading: boolean }) => ReactNode;
  fallback?: FallbackProfile;
};

export default function ProfilePreviewDialog({ userId, trigger, fallback }: ProfilePreviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<PublicUserSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/users/${userId}/summary`, { cache: "no-store" });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "No se pudo cargar el perfil");
      }
      const data = (await response.json()) as PublicUserSummary;
      setSummary(data);
    } catch (err: any) {
      setError(err?.message || "No se pudo cargar el perfil");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleOpen = () => {
    setOpen(true);
    if (!summary) {
      fetchSummary();
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const profile = summary?.user ?? fallback ?? {
    name: "Jugador PichangApp",
    comuna: null,
    position: null,
    skillLevel: null,
    bio: null,
    avatarUrl: null,
    phoneDisplay: null,
  };

  const stats = summary
    ? [
        { label: "Organizados", value: summary.stats.matchesOrganized },
        { label: "Próximos", value: summary.stats.matchesUpcoming },
        { label: "Jugados", value: summary.stats.matchesPlayed },
        { label: "Amigos", value: summary.stats.friendsCount },
      ]
    : undefined;

  const actionNodes: ReactNode[] = [];
  if (summary) {
    if (summary.friendship.status === "SELF") {
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
          targetId={summary.user.id}
          targetName={summary.user.name}
          initialStatus={summary.friendship.status}
          initialFriendId={summary.friendship.friendId ?? null}
          size="sm"
        />,
      );
    }
    actionNodes.push(
      <Link
        key="public"
        href={`/usuarios/${summary.user.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow transition hover:bg-emerald-100"
      >
        Ver perfil completo
      </Link>,
    );
  } else if (fallback) {
    actionNodes.push(
      <Link
        key="public-fallback"
        href={`/usuarios/${userId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow transition hover:bg-emerald-100"
      >
        Ver perfil completo
      </Link>,
    );
  }

  const actions = actionNodes.length > 0 ? actionNodes : undefined;

  return (
    <>
      {trigger({ open: handleOpen, loading })}
      <Transition appear show={open} as={Fragment}>
        <Dialog as="div" className="relative z-[1000]" onClose={handleClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-xl space-y-4">
                  <ProfileCard
                    name={profile.name}
                    comuna={profile.comuna}
                    phoneDisplay={profile.phoneDisplay}
                    position={profile.position}
                    skillLevel={profile.skillLevel}
                    bio={profile.bio}
                    avatarUrl={profile.avatarUrl}
                    stats={stats}
                    actions={actions}
                    isOwnProfile={summary?.friendship.status === "SELF"}
                    highlight={loading ? "Cargando..." : null}
                  />
                  {error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  ) : null}
                  {summary && (summary.recentOrganized.length > 0 || summary.recentPlayed.length > 0) ? (
                    <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 text-slate-800 shadow-lg backdrop-blur">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
                        Actividad reciente
                      </h3>
                      <div className="mt-3 grid gap-4 sm:grid-cols-2">
                        <HistoryList title="Organizados" items={summary.recentOrganized} />
                        <HistoryList title="Jugados" items={summary.recentPlayed} />
                      </div>
                    </div>
                  ) : null}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}

type HistoryListProps = {
  title: string;
  items: Array<{ id: string; title: string; startsAt: string; venueName: string | null; comuna: string | null }>;
};

function HistoryList({ title, items }: HistoryListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-500 shadow-sm">
        Aún no hay registros.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-xs shadow-sm">
            <p className="font-semibold text-slate-800">{item.title}</p>
            <p className="text-slate-500">{formatDateLabel(item.startsAt)}</p>
            {item.venueName ? <p className="text-slate-500">{item.venueName}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatDateLabel(value: string) {
  try {
    return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}
