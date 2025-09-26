"use client";

import { useState } from "react";
import type { FriendStatus } from "@/lib/friendship";

type ApiFriend = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "BLOCKED";
  isRequester: boolean;
};

type Props = {
  targetId: string;
  targetName?: string;
  initialStatus: FriendStatus;
  initialFriendId?: string | null;
  onStatusChange?: (status: FriendStatus) => void;
  size?: "sm" | "md";
};

function mapStatusFromApi(item: ApiFriend, viewerIdIsRequester: boolean): FriendStatus {
  if (item.status === "ACCEPTED") return "FRIENDS";
  if (item.status === "BLOCKED") return "BLOCKED";
  if (item.status === "PENDING") {
    return viewerIdIsRequester ? "PENDING_OUT" : "PENDING_IN";
  }
  return "NONE";
}

export default function AddFriendButton({
  targetId,
  targetName,
  initialStatus,
  initialFriendId,
  onStatusChange,
  size = "md",
}: Props) {
  const [status, setStatus] = useState<FriendStatus>(initialStatus);
  const [friendId, setFriendId] = useState<string | null>(initialFriendId ?? null);
  const [busy, setBusy] = useState(false);

  if (status === "SELF") {
    return null;
  }

  const applyState = (nextStatus: FriendStatus, nextFriendId: string | null) => {
    setStatus(nextStatus);
    setFriendId(nextFriendId);
    if (onStatusChange) onStatusChange(nextStatus);
  };

  const notifyError = (message: string) => {
    if (typeof window !== "undefined") {
      window.alert(message);
    }
  };

  const postFriend = async () => {
    try {
      setBusy(true);
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresseeId: targetId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          notifyError("Necesitas iniciar sesion para agregar amigos.");
        } else {
          notifyError(data?.error || "No se pudo enviar la solicitud.");
        }
        return;
      }
      const item: ApiFriend | null = data?.item
        ? { id: data.item.id, status: data.item.status, isRequester: !!data.item.isRequester }
        : null;
      if (item) {
        const next = mapStatusFromApi(item, item.isRequester);
        applyState(next, item.id);
      }
    } finally {
      setBusy(false);
    }
  };

  const patchFriend = async (action: string) => {
    if (!friendId) return;
    try {
      setBusy(true);
      const res = await fetch(`/api/friends/${friendId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notifyError(data?.error || "No se pudo actualizar la solicitud.");
        return;
      }
      const item: ApiFriend | null = data?.item
        ? { id: data.item.id, status: data.item.status, isRequester: !!data.item.isRequester }
        : null;
      if (item) {
        const next = mapStatusFromApi(item, item.isRequester);
        applyState(next, item.id);
      } else {
        applyState("NONE", null);
      }
    } finally {
      setBusy(false);
    }
  };

  const deleteFriend = async () => {
    if (!friendId) return;
    try {
      setBusy(true);
      const res = await fetch(`/api/friends/${friendId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        notifyError(data?.error || "No se pudo eliminar.");
        return;
      }
      applyState("NONE", null);
    } finally {
      setBusy(false);
    }
  };

  const acceptPending = () => patchFriend("accept");
  const rejectPending = () => patchFriend("reject");
  const cancelPending = () => patchFriend("cancel");

  const baseClass = size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-sm";

  if (status === "BLOCKED") {
    return (
      <button disabled className={`${baseClass} rounded-lg border bg-[color:var(--bg-subtle)] text-[color:var(--fg-subtle)]`}>
        No disponible
      </button>
    );
  }

  if (status === "PENDING_IN") {
    return (
      <div className="flex gap-2">
        <button
          disabled={busy}
          onClick={acceptPending}
          className={`${baseClass} rounded-lg bg-[color:var(--brand-1)] text-white disabled:opacity-60`}
        >
          Aceptar
        </button>
        <button
          disabled={busy}
          onClick={rejectPending}
          className={`${baseClass} rounded-lg border disabled:opacity-60`}
        >
          Rechazar
        </button>
      </div>
    );
  }

  if (status === "PENDING_OUT") {
    return (
      <div className="flex gap-2 items-center">
        <button disabled className={`${baseClass} rounded-lg border disabled:opacity-60`}>
          Solicitud enviada
        </button>
        <button
          disabled={busy}
          onClick={cancelPending}
          className="text-sm text-[color:var(--fg-subtle)] underline"
        >
          Cancelar
        </button>
      </div>
    );
  }

  if (status === "FRIENDS") {
    return (
      <div className="flex gap-2 items-center">
        <button disabled className={`${baseClass} rounded-lg bg-[color:var(--brand-1)] text-white`}>
          Amigos
        </button>
        <button
          disabled={busy}
          onClick={deleteFriend}
          className="text-sm text-[color:var(--fg-subtle)] underline"
        >
          Eliminar
        </button>
      </div>
    );
  }

  return (
    <button
      disabled={busy}
      onClick={postFriend}
      className={`${baseClass} rounded-lg bg-[color:var(--brand-1)] text-white disabled:opacity-60`}
    >
      {busy ? 'Enviando...' : `Agregar ${targetName ? `a ${targetName}` : 'amigo'}`}
    </button>
  );
}
