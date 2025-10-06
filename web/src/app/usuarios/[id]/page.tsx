import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUserId } from "@/lib/auth-core";
import { getPublicUserSummary } from "@/lib/user-summary";
import ProfileSummaryHeader from "@/components/profile/ProfileSummaryHeader";

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

export default async function UserProfilePage({ params }: PageProps) {  const { id: targetId } = await params;
  if (!targetId) {
    notFound();
  }

  const viewerId = await getSessionUserId();
  const summary = await getPublicUserSummary(targetId, viewerId);
  if (!summary) {
    notFound();
  }

  const { recentOrganized, recentPlayed } = summary;

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        <ProfileSummaryHeader summary={summary} />

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Organizados recientemente</h3>
            {recentOrganized.length === 0 ? (
              <p className="text-sm text-slate-500">Aún no organiza partidos.</p>
            ) : (
              <ul className="space-y-3">
                {recentOrganized.map((match) => (
                  <li key={match.id} className="flex flex-col border-b border-slate-200 pb-3 last:border-b-0 last:pb-0">
                    <Link href={`/match/${match.id}`} className="text-sm font-medium text-slate-900 hover:underline underline-offset-4">
                      {match.title}
                    </Link>
                    <span className="text-xs text-slate-500">{formatDate(match.startsAt)}</span>
                    {match.venueName && <span className="text-xs text-slate-500">{match.venueName}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Jugados recientemente</h3>
            {recentPlayed.length === 0 ? (
              <p className="text-sm text-slate-500">Aún no participa en partidos.</p>
            ) : (
              <ul className="space-y-3">
                {recentPlayed.map((match) => (
                  <li key={match.id} className="flex flex-col border-b border-slate-200 pb-3 last:border-b-0 last:pb-0">
                    <Link href={`/match/${match.id}`} className="text-sm font-medium text-slate-900 hover:underline underline-offset-4">
                      {match.title}
                    </Link>
                    <span className="text-xs text-slate-500">{formatDate(match.startsAt)}</span>
                    {match.venueName && <span className="text-xs text-slate-500">{match.venueName}</span>}
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