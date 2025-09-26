import Link from "next/link";
import { notFound } from "next/navigation";
import AddFriendButton from "@/components/AddFriendButton";
import { getSessionUserId } from "@/lib/auth-core";
import { getPublicUserSummary } from "@/lib/user-summary";

export const revalidate = 0;

type PageProps = {
  params: { id: string };
};

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("es-CL", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border rounded-2xl p-5 shadow-sm">
      <p className="text-sm text-[color:var(--fg-subtle)]">{label}</p>
      <p className="text-2xl font-semibold text-[color:var(--fg)] mt-1">{value}</p>
    </div>
  );
}

export default async function UserProfilePage({ params }: PageProps) {  const { id: targetId } = await params;
  if (!targetId) {
    notFound();
  }

  const viewerId = await getSessionUserId();
  const summary = await getPublicUserSummary(targetId, viewerId);
  if (!summary) {
    notFound();
  }

  const { user, stats, friendship, recentOrganized, recentPlayed } = summary;

  return (
    <div className="min-h-screen bg-[color:var(--bg)]">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        <header className="bg-white border rounded-2xl shadow-sm p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[color:var(--fg)]">{user.name}</h1>
            <p className="text-[color:var(--fg-muted)] text-sm">Perfil público de jugador</p>
          </div>
          <AddFriendButton
            targetId={user.id}
            targetName={user.name}
            initialStatus={friendship.status}
            initialFriendId={friendship.friendId ?? null}
          />
        </header>

        <section>
          <h2 className="text-lg font-semibold text-[color:var(--fg)] mb-4">Estadísticas</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard label="Partidos organizados" value={stats.matchesOrganized} />
            <StatCard label="Partidos próximos" value={stats.matchesUpcoming} />
            <StatCard label="Partidos jugados" value={stats.matchesPlayed} />
            <StatCard label="Amigos" value={stats.friendsCount} />
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="bg-white border rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-[color:var(--fg)] mb-3">Organizados recientemente</h3>
            {recentOrganized.length === 0 ? (
              <p className="text-sm text-[color:var(--fg-subtle)]">Aun no organiza partidos.</p>
            ) : (
              <ul className="space-y-3">
                {recentOrganized.map((match) => (
                  <li key={match.id} className="flex flex-col border-b last:border-b-0 pb-3 last:pb-0">
                    <Link href={`/match/${match.id}`} className="text-sm font-medium text-[color:var(--fg)] hover:underline underline-offset-4">
                      {match.title}
                    </Link>
                    <span className="text-xs text-[color:var(--fg-subtle)]">{formatDate(match.startsAt)}</span>
                    {match.venueName && <span className="text-xs text-[color:var(--fg-subtle)]">{match.venueName}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white border rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-[color:var(--fg)] mb-3">Jugados recientemente</h3>
            {recentPlayed.length === 0 ? (
              <p className="text-sm text-[color:var(--fg-subtle)]">Aun no participa en partidos.</p>
            ) : (
              <ul className="space-y-3">
                {recentPlayed.map((match) => (
                  <li key={match.id} className="flex flex-col border-b last:border-b-0 pb-3 last:pb-0">
                    <Link href={`/match/${match.id}`} className="text-sm font-medium text-[color:var(--fg)] hover:underline underline-offset-4">
                      {match.title}
                    </Link>
                    <span className="text-xs text-[color:var(--fg-subtle)]">{formatDate(match.startsAt)}</span>
                    {match.venueName && <span className="text-xs text-[color:var(--fg-subtle)]">{match.venueName}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}