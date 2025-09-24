"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import AuthDialog from "@/components/AuthDialog";
import AddFriendButton from "@/components/AddFriendButton";
import type { FriendStatus } from "@/lib/friendship";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, Users, Clock, CheckCircle, AlertCircle, Share2, MessageSquare, Trash2, Timer, Pencil } from "lucide-react";
import MatchHeroMap from "@/components/MatchHeroMap";
import { nivelES, posicionES } from "@/lib/i18n";
import { sampleMatches } from "@/lib/samples";
import { FormationBoard, type FormationPlayer, type FormationSlotView } from "@/components/match/FormationBoard";
import { JoinFormationDialog, type JoinFormationTeam, type InviteFriendDraft } from "@/components/match/JoinFormationDialog";
import { assignPlayersToFormation, getFormationPreset } from "@/lib/formations";
import {
  computeTeamCapacities,
  normalizeTeam,
  normalizePosition,
  TEAM_LABELS,
  TEAM_KEYS,
  type TeamKey,
  type PositionKey,
} from "@/lib/teams";

type NormalizedMatchPlayer = FormationPlayer & {
  team: TeamKey | null;
  status: string;
  invitedByViewer?: boolean;
  invitedByUserId?: string | null;
};

type FormationTeamView = JoinFormationTeam & {
  availableSlots: number;
  capacity: number;
  totalPlayers: number;
};

export default function MatchDetailPage() {
  const routeParams = useParams() as any;
  const id = routeParams?.id as string;
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"about" | "roster">("about");
  const showAbout = activeTab === "about";
  const showRoster = activeTab === "roster";
  const { user } = useAuth();
  const router = useRouter();

  const [joining, setJoining] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [joinSelectedTeam, setJoinSelectedTeam] = useState<TeamKey>("CLARO");
  const [joinSelectedSlot, setJoinSelectedSlot] = useState<{ team: TeamKey; slotIndex: number; position: PositionKey } | null>(
    null,
  );
  const [joinFriendCount, setJoinFriendCount] = useState(0);
  const [joinFriends, setJoinFriends] = useState<InviteFriendDraft[]>([]);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteTempCount, setInviteTempCount] = useState(0);

  const loadMatch = useCallback(async () => {
    setLoading(true);
    try {
      const ts = Date.now();
      const res = await fetch(`/api/matches/${id}?t=${ts}`, {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (res.ok) {
        const data = await res.json();
        setMatch(data);
      } else {
        const fallback: any = sampleMatches().find((m: any) => m.id === id);
        if (fallback) {
          setMatch({
            ...fallback,
            paid: fallback.spots.filter((s: any) => s.status === "PAID").length,
            available: fallback.spots.filter((s: any) => s.status === "AVAILABLE").length,
          });
        }
      }
    } catch (error) {
      const fallback: any = sampleMatches().find((m: any) => m.id === id);
      if (fallback) {
        setMatch({
          ...fallback,
          paid: fallback.spots.filter((s: any) => s.status === "PAID").length,
          available: fallback.spots.filter((s: any) => s.status === "AVAILABLE").length,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadMatch();
  }, [loadMatch]);

  const formationData = useMemo(() => {
    if (!match) {
      return { teams: [] as FormationTeamView[], unassigned: [] as NormalizedMatchPlayer[] };
    }
    const capacities = computeTeamCapacities(match.totalSpots ?? 0);
    const rawPlayers = Array.isArray(match.players) ? (match.players as any[]) : [];
    const normalizedPlayers: NormalizedMatchPlayer[] = rawPlayers.map((player: any, idx: number) => {
      const displayName =
        typeof player.displayName === "string" && player.displayName.trim().length > 0
          ? player.displayName
          : player.user?.name ?? `Jugador ${idx + 1}`;
      const position = normalizePosition(player.position ?? player.user?.position ?? null);
      const team = normalizeTeam(player.team ?? player.user?.team ?? null);
      return {
        spotId: player.spotId ?? player.id ?? null,
        userId: player.userId ?? player.user?.id ?? null,
        displayName,
        position,
        team,
        status: player.status ?? "PAID",
        invitedByViewer: Boolean(player.invitedByViewer),
        invitedByUserId: player.invitedByUserId ?? null,
      };
    });

    const playersByTeam: Record<TeamKey, NormalizedMatchPlayer[]> = {
      CLARO: normalizedPlayers.filter((player) => player.team === "CLARO"),
      OSCURO: normalizedPlayers.filter((player) => player.team === "OSCURO"),
    };

    const unassigned = normalizedPlayers.filter((player) => !player.team);

    const teams = (TEAM_KEYS as readonly TeamKey[])
      .map((teamKey) => {
        const capacity = teamKey === "CLARO" ? capacities.claro : capacities.oscuro;
        const players = playersByTeam[teamKey];
        const shouldInclude = capacity > 0 || players.length > 0;
        if (!shouldInclude) {
          return null;
        }
        const effectiveSize = capacity > 0 ? capacity : Math.max(players.length, 1);
        const preset = getFormationPreset(effectiveSize);
        const assignment = assignPlayersToFormation(players, preset);
        const allowNewPlayers = capacity > 0 && players.length < capacity;
        const slots: FormationSlotView[] = assignment.slots.map((slot, index) => ({
          index,
          position: slot.position,
          player: slot.player
            ? {
                spotId: slot.player.spotId ?? null,
                userId: slot.player.userId ?? null,
                displayName: slot.player.displayName,
                position: slot.player.position ?? null,
              }
            : null,
          isAvailable: allowNewPlayers && index < capacity && !slot.player,
        }));
        const bench: FormationPlayer[] = assignment.bench.map((player) => ({
          spotId: player.spotId ?? null,
          userId: player.userId ?? null,
          displayName: player.displayName,
          position: player.position ?? null,
        }));
        const availableSlots = slots.filter((slot) => slot.isAvailable).length;
        return {
          team: teamKey,
          label: TEAM_LABELS[teamKey],
          formationName: preset.name,
          slots,
          bench,
          availableSlots,
          capacity,
          totalPlayers: players.length,
        } as FormationTeamView;
      })
      .filter((team): team is FormationTeamView => team !== null);

    return { teams, unassigned };
  }, [match]);

  const viewerTeamKey = useMemo(() => {
    if (!user || !match) return null;
    const players = Array.isArray(match.players) ? (match.players as any[]) : [];
    const viewerSpot = players.find((player: any) => {
      const candidateId = player.userId ?? player.user?.id ?? null;
      return candidateId && candidateId === user.id;
    });
    if (!viewerSpot) return null;
    return normalizeTeam(viewerSpot.team ?? viewerSpot.user?.team ?? null);
  }, [match, user]);

  const viewerTeamLabel = viewerTeamKey ? TEAM_LABELS[viewerTeamKey] : null;

  // Metrics needed across multiple callbacks
  const totalSpots = Math.max(match?.totalSpots ?? 1, 1);
  const minSpotsToConfirm = Math.max(match?.minSpotsToConfirm ?? totalSpots, 1);
  const paidCount = match?.paid ?? 0;
  const availableSpots = match?.available ?? 0;
  const progressPercent = Math.min(100, (paidCount / totalSpots) * 100);
  const minMarkerPercent = Math.min(100, (minSpotsToConfirm / totalSpots) * 100);
  const spotsMissingForConfirmation = Math.max(0, minSpotsToConfirm - paidCount);
  const isFull = availableSpots === 0;
  const isAlmostFull = availableSpots <= 2;
  const maxInvitableFriends = useMemo(() => Math.max(0, availableSpots - 1), [availableSpots]);

  const initializeJoinSelection = useCallback(() => {
    const sorted = [...formationData.teams].sort((a, b) => b.availableSlots - a.availableSlots);
    const preferred = sorted.find((team) => team.availableSlots > 0) ?? sorted[0] ?? null;
    if (preferred) {
      setJoinSelectedTeam(preferred.team);
      const slot = preferred.slots.find((candidate) => candidate.isAvailable) ?? null;
      if (slot) {
        setJoinSelectedSlot({ team: preferred.team, slotIndex: slot.index, position: slot.position });
        setJoinError(null);
      } else {
        setJoinSelectedSlot(null);
        setJoinError("Este equipo ya está completo. Prueba con el otro equipo.");
      }
    } else {
      setJoinSelectedTeam("CLARO");
      setJoinSelectedSlot(null);
      setJoinError("No quedan posiciones disponibles.");
    }
    setJoinFriendCount(0);
    setJoinFriends([]);
  }, [formationData]);

  const startJoinFlow = useCallback(() => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setInviteTempCount(0);
    setInviteDialogOpen(true);
  }, [user]);

  const proceedFromInvite = useCallback(() => {
    initializeJoinSelection();
    const bounded = Math.max(0, Math.min(inviteTempCount, maxInvitableFriends));
    setJoinFriendCount(bounded);
    setJoinFriends((prev) => {
      const next = [...prev];
      while (next.length < bounded) {
        next.push({ name: "", email: "", team: "", position: "" });
      }
      return next.slice(0, bounded);
    });
    setInviteDialogOpen(false);
    setJoinDialogOpen(true);
  }, [initializeJoinSelection, inviteTempCount, maxInvitableFriends]);


  const closeJoinDialog = useCallback(() => {
    if (joining) return;
    setJoinDialogOpen(false);
    setJoinError(null);
    setJoinSelectedSlot(null);
    setJoinFriendCount(0);
    setJoinFriends([]);
  }, [joining]);

  const handleSelectTeam = useCallback(
    (team: TeamKey) => {
      setJoinSelectedTeam(team);
      const teamData = formationData.teams.find((candidate) => candidate.team === team);
      if (teamData) {
        const slot = teamData.slots.find((candidate) => candidate.isAvailable) ?? null;
        if (slot) {
          setJoinSelectedSlot({ team, slotIndex: slot.index, position: slot.position });
          setJoinError(null);
        } else {
          setJoinSelectedSlot(null);
          setJoinError("Este equipo ya está completo. Prueba con el otro equipo.");
        }
      } else {
        setJoinSelectedSlot(null);
      }
    },
    [formationData],
  );

  const handleSelectSlot = useCallback((team: TeamKey, slot: FormationSlotView) => {
    setJoinSelectedTeam(team);
    setJoinSelectedSlot({ team, slotIndex: slot.index, position: slot.position });
    setJoinError(null);
  }, []);

  const handleConfirmJoin = useCallback(async () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (!joinSelectedSlot) {
      setJoinError("Selecciona una posición disponible.");
      return;
    }
    const localFriendEntries = joinFriends.slice(0, joinFriendCount);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const localFriendsValid = joinFriendCount === 0 || localFriendEntries.every((friend) => {
      const nameOk = friend.name.trim().length > 1;
      const emailOk = emailRegex.test(friend.email.trim());
      const positionOk = !!friend.position;
      return nameOk && emailOk && positionOk;
    });
    if (!localFriendsValid) {
      setJoinError("Completa los datos de tus invitados antes de continuar.");
      return;
    }
    setJoining(true);
    setJoinError(null);
    try {
      const payloadFriends = localFriendEntries.map((friend) => ({
        name: friend.name.trim(),
        email: friend.email.trim(),
        team: friend.team || null,
        position: friend.position,
      }));
      const res = await fetch(`/api/matches/${id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          team: joinSelectedSlot.team,
          position: joinSelectedSlot.position,
          friends: payloadFriends,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || data?.message || "No se pudo confirmar el cupo");
      }
      const successMessage =
        data?.message ||
        (data?.alreadyJoined ? "Ya estabas inscrito en este partido." : "Cupo confirmado. Nos vemos en la cancha.");
      setToast(successMessage);
      setTimeout(() => setToast(null), 3000);
      setJoinDialogOpen(false);
      setJoinSelectedSlot(null);
      setJoinFriendCount(0);
      setJoinFriends([]);
      await loadMatch();
      setActiveTab("roster");
    } catch (e: any) {
      const msg = e?.message ?? "No se pudo confirmar el cupo";
      setJoinError(msg);
    } finally {
      setJoining(false);
    }
  }, [user, joinSelectedSlot, id, loadMatch, joinFriends, joinFriendCount]);

  useEffect(() => {
    if (!joinDialogOpen) return;
    const teamData = formationData.teams.find((team) => team.team === joinSelectedTeam);
    if (!teamData) {
      if (formationData.teams.length > 0) {
        initializeJoinSelection();
      }
      return;
    }
    if (joinSelectedSlot) {
      const slotStillAvailable = teamData.slots.some(
        (slot) => slot.index === joinSelectedSlot.slotIndex && slot.isAvailable,
      );
      if (!slotStillAvailable) {
        if (teamData.availableSlots > 0) {
          const nextSlot = teamData.slots.find((slot) => slot.isAvailable) ?? null;
          if (nextSlot) {
            setJoinSelectedSlot({ team: teamData.team, slotIndex: nextSlot.index, position: nextSlot.position });
            setJoinError(null);
          }
        } else {
          setJoinSelectedSlot(null);
          setJoinError("Este equipo ya está completo. Prueba con el otro equipo.");
        }
      }
    } else if (teamData.availableSlots > 0) {
      const nextSlot = teamData.slots.find((slot) => slot.isAvailable) ?? null;
      if (nextSlot) {
        setJoinSelectedSlot({ team: teamData.team, slotIndex: nextSlot.index, position: nextSlot.position });
        setJoinError(null);
      }
    }
  }, [formationData, joinDialogOpen, joinSelectedSlot, joinSelectedTeam, initializeJoinSelection]);

  const handleDelete = async () => {
    if (!match?.viewer?.canDelete || deleting) return;
    if (typeof window !== "undefined") {
      const confirmed = window.confirm("Estas seguro de eliminar este partido? Esta accion no se puede deshacer.");
      if (!confirmed) return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/matches/${id}`, { method: "DELETE", credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "No se pudo eliminar el partido");
      }
      const msg = data?.message || "Partido eliminado correctamente";
      setToast(msg);
      setTimeout(() => setToast(null), 3000);
      setTimeout(() => {
        router.replace("/explorar");
      }, 600);
    } catch (e: any) {
      const msg = e?.message ?? "No se pudo eliminar el partido";
      setToast(msg);
      setTimeout(() => setToast(null), 3000);
    } finally {
      setDeleting(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: match?.title ?? "PichangApp", url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setToast("Link copiado");
      setTimeout(() => setToast(null), 2000);
    }
  };

  const handleLeave = useCallback(async () => {
    if (!user || !match) {
      setAuthOpen(true);
      return;
    }
    const startsAt = match.startsAt ? new Date(match.startsAt) : null;
    const withinCutoff = (() => {
      if (!startsAt) return false;
      const msUntil = startsAt.getTime() - Date.now();
      return msUntil < 2 * 60 * 60 * 1000;
    })();
    if (withinCutoff) {
      setToast("Ya no puedes bajarte. Faltan menos de 2 horas.");
      setTimeout(() => setToast(null), 2500);
      return;
    }
    const message = "Si te bajas, también se darán de baja tus invitados y se liberarán sus cupos. ¿Confirmas?";
    const confirmed = typeof window !== "undefined" ? window.confirm(message) : true;
    if (!confirmed) return;
    try {
      // Optimistic UI: marcar como no inscrito de inmediato y remover invitados
      setMatch((m: any) => {
        if (!m) return m;
        const playersArray = Array.isArray(m.players) ? (m.players as any[]) : [];
        const viewerId = user.id;
        let removedCount = 0;
        const filteredPlayers = playersArray.filter((player: any) => {
          const candidateId = player?.userId ?? player?.user?.id ?? null;
          const invitedByViewer = Boolean(player?.invitedByViewer);
          const invitedByUserId = player?.invitedByUserId ?? null;
          const shouldRemove =
            (candidateId && candidateId === viewerId) ||
            invitedByViewer ||
            (invitedByUserId && invitedByUserId === viewerId);
          if (shouldRemove) {
            removedCount += 1;
            return false;
          }
          return true;
        });
        const nextPaid = removedCount > 0 ? Math.max(0, (m.paid ?? 0) - removedCount) : m.paid ?? 0;
        const nextAvailable = removedCount > 0 ? (m.available ?? 0) + removedCount : m.available ?? 0;
        return {
          ...m,
          paid: nextPaid,
          available: nextAvailable,
          players: filteredPlayers,
          viewer: { ...(m.viewer ?? {}), hasJoined: false },
        };
      });
      const res = await fetch(`/api/matches/${id}/leave`, { method: "POST", credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo bajar del partido");
      setToast(data?.message || "Te bajaste del partido");
      setTimeout(() => setToast(null), 2500);
      await loadMatch();
    } catch (e: any) {
      // Revert on error
      await loadMatch();
      setToast(e?.message || "No se pudo bajar del partido");
      setTimeout(() => setToast(null), 2500);
    }
  }, [user, match, id, loadMatch]);

  

  const handleFriendCountChange = useCallback(
    (next: number) => {
      const bounded = Math.max(0, Math.min(next, maxInvitableFriends));
      setJoinFriendCount(bounded);
      setJoinFriends((prev) => {
        const draft = [...prev];
        while (draft.length < bounded) {
          draft.push({ name: "", email: "", team: "", position: "" });
        }
        return draft.slice(0, bounded);
      });
    },
    [maxInvitableFriends],
  );

  const handleUpdateFriend = useCallback((index: number, draft: InviteFriendDraft) => {
    setJoinFriends((prev) => {
      const next = [...prev];
      next[index] = draft;
      return next;
    });
  }, []);

  const friendEntries = useMemo(() => joinFriends.slice(0, joinFriendCount), [joinFriends, joinFriendCount]);

  const friendsValid = useMemo(() => {
    if (joinFriendCount === 0) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return friendEntries.every((friend) => {
      const nameOk = friend.name.trim().length > 1;
      const emailOk = emailRegex.test(friend.email.trim());
      const positionOk = !!friend.position;
      return nameOk && emailOk && positionOk;
    });
  }, [friendEntries, joinFriendCount]);

  useEffect(() => {
    if (joinFriendCount > maxInvitableFriends) {
      setJoinFriendCount(maxInvitableFriends);
      setJoinFriends((prev) => prev.slice(0, maxInvitableFriends));
    }
  }, [joinFriendCount, maxInvitableFriends]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-sm uppercase tracking-[0.3em]">Cargando partido...</span>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-slate-700">
          <h1 className="text-2xl font-semibold mb-4">Partido no encontrado</h1>
          <Link href="/explorar" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 font-semibold text-white shadow hover:bg-slate-800 transition">
            <ArrowLeft className="h-4 w-4" />
            Volver a partidos
          </Link>
        </div>
      </div>
    );
  }

  const viewer = match.viewer ?? null;
  const isOrganizer = viewer?.isOrganizer || (user && match && (user.id === (match.organizerId ?? match.organizer?.id)));
  const canOpenChat = !!(viewer?.hasJoined || isOrganizer);
  const organizerFriendship = match.organizerFriendship ?? { status: "NONE", friendId: null };
  const initialFriendStatus = (organizerFriendship.status ?? "NONE") as FriendStatus;

  const mapSectionId = "match-hero-map-section";
  const tabs: Array<{ id: "about" | "roster"; label: string }> = [
    { id: "about", label: "DETALLE" },
    { id: "roster", label: "JUGADORES" },
  ];
  const startAt = match.startsAt ? new Date(match.startsAt) : null;
  const estimatedEndAt = startAt ? new Date(startAt.getTime() + ((match.durationMins ?? 90) * 60 * 1000)) : null;
  const dateFormatter = new Intl.DateTimeFormat("es-CL", { weekday: "long", day: "numeric", month: "long" });
  const timeFormatter = new Intl.DateTimeFormat("es-CL", { hour: "2-digit", minute: "2-digit" });
  const capitalize = (value: string) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);
  const dateLabel = startAt ? capitalize(dateFormatter.format(startAt)) : "Fecha por confirmar";
  const timeLabel = startAt ? `${timeFormatter.format(startAt)}${estimatedEndAt ? ` - ${timeFormatter.format(estimatedEndAt)}` : ""}` : "Horario por confirmar";
  const durationLabel = `${match.durationMins ?? 90} minutos`;
  const priceLabel = match.pricePerSpot > 0 ? new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(match.pricePerSpot) : "Gratis";
  const spotsLeft = Math.max(availableSpots, 0);
  const spotsHeadline = isFull
    ? "Partido completo"
    : spotsLeft <= 3
      ? `${spotsLeft} ${spotsLeft === 1 ? "cupo disponible" : "cupos disponibles"}`
      : `${spotsLeft} cupos disponibles`;
  const matchStatusLabel = isFull ? "Partido completo" : paidCount >= minSpotsToConfirm || match.isConfirmed ? "Partido confirmado" : "En confirmacion";
  const chipPercent = isFull ? 100 : paidCount >= minSpotsToConfirm || match.isConfirmed ? Math.max(minMarkerPercent, progressPercent) : progressPercent;
  const description = (match.description ?? match.details ?? match.notes ?? "") as string;
  const addressLabel = match.venueAddress || match.venueName || match.comuna || "Ubicación por confirmar";
  const hasCoords = match.lat != null && match.lng != null && !isNaN(Number(match.lat)) && !isNaN(Number(match.lng));
  const coordsString = hasCoords ? `${match.lat},${match.lng}` : null;
  const directionsHref = (() => {
    const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
    const destination = coordsString ?? addressLabel;
    if (!destination) return undefined;
    if (isIOS) {
      return `http://maps.apple.com/?daddr=${encodeURIComponent(destination)}`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
  })();
  const statusSteps = [
    { key: "scheduled", label: "Agendado", reached: true },
    { key: "confirmed", label: "Confirmado", reached: paidCount >= minSpotsToConfirm || !!match.isConfirmed },
    { key: "full", label: "Completo", reached: isFull },
  ] as const;
  const overviewItems = [
    { icon: Calendar, label: "Fecha", value: dateLabel },
    { icon: Clock, label: "Horario", value: timeLabel },
    { icon: Timer, label: "Duracion", value: durationLabel },
    { icon: Users, label: "Jugadores", value: `${minSpotsToConfirm} - ${totalSpots} jugadores` },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/explorar" className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50">
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Link>
            <div className="flex-1 text-center sm:text-left">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">Partido</p>
              <h1 className="text-lg font-semibold text-slate-800">Detalles</h1>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {viewer?.canDelete ? (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="hidden sm:inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleting ? "Eliminando..." : "Eliminar"}
                </button>
              ) : null}
              {canOpenChat ? (
                <button
                  onClick={() => router.push(`/match/${id}/chat`)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
                  aria-label="Abrir chat"
                >
                  <MessageSquare className="h-5 w-5" />
                </button>
              ) : null}
              <button
                onClick={() => {
                  setActiveTab("about");
                  const el = document.getElementById(mapSectionId);
                  if (el) {
                    window.requestAnimationFrame(() => {
                      el.scrollIntoView({ behavior: "smooth", block: "start" });
                    });
                  }
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
                aria-label="Ver mapa"
              >
                <MapPin className="h-5 w-5" />
              </button>
              <button
                onClick={handleShare}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
                aria-label="Compartir partido"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-4">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 text-sm font-semibold shadow-sm">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${isActive ? "bg-emerald-500 text-white shadow" : "text-slate-500 hover:text-slate-900"} flex-1 rounded-full px-4 py-2 transition`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 pb-20">
        {activeTab === "about" ? (
          <section id={mapSectionId} className="mt-8 space-y-6">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
              <div className="h-[420px] w-full bg-gray-100">
                {match ? <MatchHeroMap lat={match.lat} lng={match.lng} title={match.title} /> : <div className="h-full w-full animate-pulse bg-gray-200" />}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-slate-800">¿Quieres jugar?</h3>
                  <p className="text-sm text-slate-500">Reserva tu cupo. Podrás invitar amigos en el siguiente paso.</p>
                </div>
                {(() => {
                  if (isFull) {
                    return (
                      <span className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600">Partido completo</span>
                    );
                  }
                  if (viewer?.hasJoined) {
                    return (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleLeave}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Bajarse del partido
                        </button>
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">Ya estás inscrito</span>
                      </div>
                    );
                  }
                  return (
                    <button
                      onClick={startJoinFlow}
                      disabled={joining}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Tomar cupo
                    </button>
                  );
                })()}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-800">{match.title ?? "Partido"}</h2>
                  <p className="text-sm text-slate-500 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    <span className="truncate max-w-[70vw] sm:max-w-[60ch]">
                      {addressLabel}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {directionsHref ? (
                    <a
                      href={directionsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      <MapPin className="h-4 w-4" />
                      Cómo llegar
                    </a>
                  ) : null}
                  <div className={`rounded-full px-3 py-1 text-xs font-semibold ${isFull ? "bg-slate-100 text-slate-700 border border-slate-200" : paidCount >= minSpotsToConfirm || match.isConfirmed ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                    {matchStatusLabel}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {overviewItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <item.icon className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
                      <p className="font-medium text-slate-800">{item.value}</p>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-bold">$</span>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Valor</p>
                    <p className="font-medium text-slate-800">{priceLabel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Dirección</p>
                    <p className="font-medium text-slate-800 leading-snug" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {addressLabel}
                    </p>
                    {directionsHref ? (
                      <a href={directionsHref} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs font-semibold text-emerald-700 hover:underline">Cómo llegar</a>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <Users className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Cupos</p>
                    <p className="font-medium text-slate-800">{paidCount} / {totalSpots}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className={`font-medium ${isFull ? "text-slate-700" : isAlmostFull ? "text-amber-700" : "text-emerald-700"}`}>{spotsHeadline}</span>
                  {spotsMissingForConfirmation > 0 && !match.isConfirmed ? (
                    <span className="text-xs text-slate-500">Faltan {spotsMissingForConfirmation} para confirmar</span>
                  ) : null}
                </div>
                <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="absolute left-0 top-0 h-full bg-emerald-500 transition-all" style={{ width: `${chipPercent}%` }} />
                  <div className="absolute left-0 top-0 h-full bg-emerald-200 opacity-50" style={{ width: `${progressPercent}%` }} />
                  <div className="absolute top-1/2 h-5 -translate-y-1/2" style={{ left: `calc(${minMarkerPercent}% - 0.5rem)` }}>
                    <div className="h-5 w-5 rounded-full border-2 border-white bg-amber-500 shadow" title="Mínimo para confirmar" />
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Agendado</span>
                  <span>Confirmado</span>
                  <span>Completo</span>
                </div>
              </div>
            </div>

            {description ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800">Descripción</h3>
                <p className="mt-2 whitespace-pre-wrap text-slate-700">{description}</p>
              </div>
            ) : null}
          </section>
        ) : (
          <section className="mt-8 space-y-6" id="jugadores">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-slate-800">Formaciones</h3>
                  <p className="text-sm text-slate-500">Visualiza los equipos claro y oscuro y elige tu posición disponible.</p>
                </div>
                {(() => {
                  if (isFull) {
                    return (
                      <span className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600">
                        Partido completo
                      </span>
                    );
                  }
                  if (viewer?.hasJoined) {
                    return viewerTeamLabel ? (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
                        Inscrito en el {viewerTeamLabel.toLowerCase()}
                      </span>
                    ) : (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
                        Ya estás inscrito
                      </span>
                    );
                  }
                  return (
                    <button
                      onClick={startJoinFlow}
                      disabled={joining}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <Pencil className="h-4 w-4" />
                      Elegir mi posición
                    </button>
                  );
                })()}
              </div>
              <div className={`grid gap-6 ${formationData.teams.length > 1 ? "md:grid-cols-2" : ""}`}>
                {formationData.teams.map((team) => (
                  <FormationBoard
                    key={team.team}
                    teamLabel={team.label}
                    formationName={team.formationName}
                    slots={team.slots}
                    bench={team.bench}
                  />
                ))}
                {formationData.teams.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    Aún no hay formaciones disponibles para este partido.
                  </div>
                ) : null}
              </div>
              {viewer?.hasJoined && viewerTeamLabel ? (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  Tu cupo está confirmado en el {viewerTeamLabel.toLowerCase()}.
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-slate-800">Jugadores</h3>
                  <p className="text-sm text-slate-500">Listado de confirmados y reservas</p>
                </div>
                <span className="text-sm text-slate-600">{paidCount} confirmados / {totalSpots} cupos</span>
              </div>
              <ul className="mt-6 space-y-3">
                {(match.players ?? []).length > 0 ? (
                  (match.players ?? []).map((p: any, idx: number) => {
                    const playerName = p.displayName ?? p.user?.name ?? `Jugador ${idx + 1}`;
                    const isGuest = Boolean(p.isGuest);
                    const nameLabel = isGuest ? `${playerName} (invitado)` : playerName;
                    const positionKey = (p.user?.position ?? p.position) as keyof typeof posicionES | undefined;
                    const normalizedTeam = normalizeTeam(p.team ?? p.user?.team ?? null);
                    return (
                      <li
                        key={`${playerName}-${idx}`}
                        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex flex-wrap items-center gap-3 text-slate-800">
                          <span className="font-semibold">{nameLabel}</span>
                          {positionKey ? (
                            <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-600">
                              {posicionES[positionKey]}
                            </span>
                          ) : null}
                          {normalizedTeam ? (
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                normalizedTeam === "CLARO"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {normalizedTeam === "CLARO" ? "Claro" : "Oscuro"}
                            </span>
                          ) : null}
                        </div>
                        <span className={`text-sm font-medium ${p.status === "PAID" ? "text-emerald-600" : "text-slate-500"}`}>
                          {p.status === "PAID" ? "Confirmado" : "Reservado"}
                        </span>
                      </li>
                    );
                  })
                ) : (
                  <li className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                    Aún no hay jugadores inscritos.
                  </li>
                )}
              </ul>
            </div>
          </section>
        )}
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}
      <JoinFormationDialog
        open={joinDialogOpen}
        onClose={closeJoinDialog}
        teams={formationData.teams}
        selectedTeam={joinSelectedTeam}
        onSelectTeam={handleSelectTeam}
        selectedSlot={
          joinSelectedSlot ? { team: joinSelectedSlot.team, slotIndex: joinSelectedSlot.slotIndex } : null
        }
        onSelectSlot={handleSelectSlot}
        onConfirm={handleConfirmJoin}
        confirmDisabled={!joinSelectedSlot || joining || !friendsValid}
        loading={joining}
        errorMessage={joinError}
        maxFriends={maxInvitableFriends}
        friendCount={joinFriendCount}
        onFriendCountChange={handleFriendCountChange}
        friends={joinFriends}
        onUpdateFriend={handleUpdateFriend}
      />
      {inviteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setInviteDialogOpen(false)} />
          <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-800">¿Quieres invitar amigos?</h3>
            <p className="mt-1 text-sm text-slate-600">Elige cuántos amigos traerás además de tu cupo.</p>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => setInviteTempCount(Math.max(0, inviteTempCount - 1))}
                className="h-10 w-10 rounded-full border border-slate-200 bg-slate-50 text-slate-700"
                aria-label="disminuir"
              >
                -
              </button>
              <input
                type="number"
                min={0}
                max={maxInvitableFriends}
                value={inviteTempCount}
                onChange={(e) => setInviteTempCount(Math.max(0, Math.min(Number(e.target.value) || 0, maxInvitableFriends)))}
                className="w-20 rounded-lg border border-slate-200 bg-white p-2 text-center text-slate-800"
              />
              <button
                onClick={() => setInviteTempCount(Math.min(maxInvitableFriends, inviteTempCount + 1))}
                className="h-10 w-10 rounded-full border border-slate-200 bg-slate-50 text-slate-700"
                aria-label="aumentar"
              >
                +
              </button>
              <span className="text-sm text-slate-500">máx. {maxInvitableFriends}</span>
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setInviteDialogOpen(false)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={proceedFromInvite}
                className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} initialTab="login" next={`/match/${id}`} />
    </div>
  );
}





