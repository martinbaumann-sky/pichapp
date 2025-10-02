"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Dialog, Transition } from "@headlessui/react";
import type { PositionKey, TeamKey } from "@/lib/teams";
import { FormationBoard, type FormationSlotView, type FormationPlayer } from "@/components/match/FormationBoard";
import { TEAM_KEYS, TEAM_LABELS, POSITION_KEYS } from "@/lib/teams";
import { posicionES } from "@/lib/i18n";
import { AlertTriangle, ShieldCheck, Users } from "lucide-react";

export type InviteFriendDraft = {
  name: string;
  email: string;
  team: TeamKey | "";
  position: PositionKey | "";
};

export type JoinFormationTeam = {
  team: TeamKey;
  label: string;
  formationName: string;
  slots: FormationSlotView[];
  availableSlots: number;
  capacity: number;
  totalPlayers: number;
  bench?: FormationPlayer[];
};

export type JoinFormationDialogStepsProps = {
  open: boolean;
  onClose: () => void;
  teams: JoinFormationTeam[];
  selectedTeam: TeamKey;
  onSelectTeam: (team: TeamKey) => void;
  selectedSlot?: { team: TeamKey; slotIndex: number | null } | null;
  onSelectSlot: (team: TeamKey, slot: FormationSlotView) => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
  loading?: boolean;
  title?: string;
  description?: string;
  errorMessage?: string | null;
  maxFriends?: number;
  friendCount?: number;
  onFriendCountChange?: (count: number) => void;
  friends?: InviteFriendDraft[];
  onUpdateFriend?: (index: number, draft: InviteFriendDraft) => void;
  confirmCtaLabel?: string;
  confirmNotice?: ReactNode;
  importantNotice?: ReactNode;
  flowVariant?: "paid" | "free";
};

type Step = "position" | "friends" | "confirm";

export function JoinFormationDialogSteps({
  open,
  onClose,
  teams,
  selectedTeam,
  onSelectTeam,
  selectedSlot,
  onSelectSlot,
  onConfirm,
  confirmDisabled = false,
  loading = false,
  title = "Elige tu posición",
  description = "Selecciona equipo y posición antes de confirmar tu cupo.",
  errorMessage = null,
  maxFriends = 0,
  friendCount = 0,
  onFriendCountChange,
  friends = [],
  onUpdateFriend,
  confirmCtaLabel = "Confirmar registro",
  confirmNotice = null,
  importantNotice,
  flowVariant = "free",
}: JoinFormationDialogStepsProps) {
  const [currentStep, setCurrentStep] = useState<Step>("position");
  const allowFriends = maxFriends > 0;
  const boundedFriendCount = allowFriends ? Math.min(friendCount, maxFriends) : 0;
  const canAdjustFriends = typeof onFriendCountChange === "function" && allowFriends;
  const isPaidFlow = flowVariant === "paid";

  useEffect(() => {
    if (!allowFriends && currentStep === "friends") {
      setCurrentStep("confirm");
    }
  }, [allowFriends, currentStep]);

  const stepOrder = useMemo<Step[]>(
    () => (allowFriends ? ["position", "friends", "confirm"] : ["position", "confirm"]),
    [allowFriends],
  );

  const handleNext = () => {
    if (currentStep === "position") {
      if (selectedSlot) {
        setCurrentStep(allowFriends ? "friends" : "confirm");
      }
    } else if (currentStep === "friends") {
      setCurrentStep("confirm");
    }
  };

  const handleBack = () => {
    if (currentStep === "friends") {
      setCurrentStep("position");
    } else if (currentStep === "confirm") {
      setCurrentStep(allowFriends ? "friends" : "position");
    }
  };

  const handleClose = () => {
    setCurrentStep("position");
    onClose();
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case "position":
        return "Paso 1: Elige tu posición";
      case "friends":
        return allowFriends ? "Paso 2: Invita amigos" : "Paso 2: Revisa tu cupo";
      case "confirm":
        if (isPaidFlow) return "Paso 2: Paga con Mercado Pago";
        return allowFriends ? "Paso 3: Confirma tu registro" : "Paso 2: Confirma tu registro";
      default:
        return title;
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case "position":
        return "Selecciona el equipo y posición donde quieres jugar.";
      case "friends":
        return allowFriends
          ? "¿Quieres invitar amigos? Puedes traer hasta " + maxFriends + " amigos."
          : "Revisa que tu selección esté correcta antes de confirmar.";
      case "confirm":
        if (isPaidFlow) return "Revisa tu selección. Abriremos el pago oficial en Mercado Pago.";
        return "Revisa tu selección y confirma tu registro.";
      default:
        return description;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case "position":
        return !!selectedSlot;
      case "friends":
        return true; // Friends are optional
      case "confirm":
        return !confirmDisabled;
      default:
        return false;
    }
  };

  const renderPositionStep = () => (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {teams.map((team) => (
          <div
            key={team.team}
            className={`rounded-2xl border-2 p-4 transition-colors ${
              selectedTeam === team.team
                ? "border-emerald-500 bg-emerald-50"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">{team.label}</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">
                  {team.totalPlayers}/{team.capacity}
                </span>
                {team.availableSlots > 0 && (
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                    {team.availableSlots} disponible{team.availableSlots !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            <div className="px-4 pb-4">
              <FormationBoard
                teamLabel={team.label}
                formationName={team.formationName}
                slots={team.slots}
                bench={team.bench}
                variant={team.team === "OSCURO" ? "dark" : "light"}
                selectedSlotIndex={selectedSlot && selectedSlot.team === team.team ? selectedSlot.slotIndex ?? null : null}
                onSelectSlot={(slot) => onSelectSlot(team.team, slot)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFriendsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-slate-800">¿Quieres invitar amigos?</h3>
        <p className="mt-1 text-sm text-slate-600">
          Puedes invitar hasta {maxFriends} amigos además de tu cupo.
        </p>
      </div>

      {canAdjustFriends && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => onFriendCountChange?.(Math.max(0, friendCount - 1))}
            className="h-10 w-10 rounded-full border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
            aria-label="Disminuir"
          >
            -
          </button>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-800">{friendCount}</div>
            <div className="text-xs text-slate-500">amigos</div>
          </div>
          <button
            onClick={() => onFriendCountChange?.(Math.min(maxFriends, friendCount + 1))}
            className="h-10 w-10 rounded-full border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
            aria-label="Aumentar"
          >
            +
          </button>
        </div>
      )}

      {friendCount > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-slate-700">Datos de tus amigos</h4>
          {friends.slice(0, friendCount).map((friend, index) => (
            <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h5 className="font-medium text-slate-800">Amigo {index + 1}</h5>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={friend.name}
                    onChange={(e) => onUpdateFriend?.(index, { ...friend, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    placeholder="Nombre completo"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={friend.email}
                    onChange={(e) => onUpdateFriend?.(index, { ...friend, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Equipo</label>
                  <select
                    value={friend.team}
                    onChange={(e) => onUpdateFriend?.(index, { ...friend, team: e.target.value as TeamKey })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Sin preferencia</option>
                    {TEAM_KEYS.map((key) => (
                      <option key={key} value={key}>
                        {TEAM_LABELS[key]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Posición</label>
                  <select
                    value={friend.position}
                    onChange={(e) => onUpdateFriend?.(index, { ...friend, position: e.target.value as PositionKey })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Sin preferencia</option>
                    {POSITION_KEYS.map((key) => (
                      <option key={key} value={key}>
                        {posicionES[key]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderConfirmStep = () => {
    const selectedTeamData = teams.find((t) => t.team === selectedTeam);
    const selectedSlotData = selectedTeamData?.slots.find((s) => s.index === selectedSlot?.slotIndex);
    const friendEntries = friends.slice(0, boundedFriendCount);
    const hasFriends = allowFriends && boundedFriendCount > 0 && friendEntries.length > 0;

    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white p-6 shadow-inner">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <div>
                <h4 className="text-base font-semibold text-emerald-900">Tu inscripción</h4>
                <p className="text-sm text-emerald-700">
                  Confirma que la información sea correcta antes de reservar tu cupo.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col rounded-2xl border border-emerald-100 bg-white/80 p-4 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-500">Equipo</span>
              <span className="mt-1 text-sm font-semibold text-emerald-900">
                {selectedTeamData?.label ?? "Equipo a confirmar"}
              </span>
              <span className="mt-1 text-xs text-emerald-600">
                {selectedTeamData
                  ? `${selectedTeamData.totalPlayers}/${selectedTeamData.capacity} jugadores`
                  : "Se confirmará al finalizar"}
              </span>
            </div>
            <div className="flex flex-col rounded-2xl border border-emerald-100 bg-white/80 p-4 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-500">Posición</span>
              <span className="mt-1 text-sm font-semibold text-emerald-900">
                {selectedSlotData?.position ? posicionES[selectedSlotData.position] : "Sin posición"}
              </span>
              <span className="mt-1 text-xs text-emerald-600">
                {selectedSlotData?.position ? "Reserva inmediata" : "Se asignará automáticamente"}
              </span>
            </div>
          </div>
        </div>

        {confirmNotice ? (
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-700 shadow-sm">
            {confirmNotice}
          </div>
        ) : null}

        {hasFriends && (
          <div className="rounded-3xl border border-slate-200 bg-slate-50/90 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900/5 text-slate-700">
                <Users className="h-6 w-6" />
              </span>
              <div className="flex-1">
                <h4 className="text-base font-semibold text-slate-800">
                  Amigos invitados ({friendCount})
                </h4>
                <p className="mt-1 text-sm text-slate-600">
                  Verifica que los datos estén correctos antes de confirmar.
                </p>
                <ul className="mt-4 space-y-3">
                  {friendEntries.map((friend, index) => {
                    const teamLabel =
                      friend.team && TEAM_LABELS[friend.team as TeamKey]
                        ? TEAM_LABELS[friend.team as TeamKey]
                        : "Equipo a confirmar";
                    const hasPreferredPosition = Boolean(friend.position);
                    return (
                      <li
                        key={`${friend.email}-${index}`}
                        className="rounded-2xl border border-white/60 bg-white p-4 shadow-sm"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {friend.name.trim() || `Amigo ${index + 1}`}
                            </p>
                            <p className="text-xs text-slate-500">{friend.email}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                              {teamLabel}
                            </span>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                hasPreferredPosition
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {hasPreferredPosition
                                ? posicionES[friend.position as PositionKey]
                                : "Posición aleatoria"}
                            </span>
                          </div>
                        </div>
                        {!hasPreferredPosition && (
                          <p className="mt-2 text-xs italic text-slate-500">
                            Sin preferencia seleccionada: asignaremos una posición disponible al confirmar.
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white p-6 shadow-inner">
          {importantNotice ? (
            importantNotice
          ) : (
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div className="text-sm text-amber-800">
                <p className="font-semibold">Importante</p>
                <p className="mt-1">
                  Al confirmar, tu cupo quedará reservado. Si tienes amigos invitados,
                  también se reservarán sus cupos automáticamente.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "position":
        return renderPositionStep();
      case "friends":
        return allowFriends ? renderFriendsStep() : renderConfirmStep();
      case "confirm":
        return renderConfirmStep();
      default:
        return null;
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[2000]" onClose={loading ? () => undefined : handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 z-[2000] bg-slate-900/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 z-[2001] overflow-y-auto">
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
              <Dialog.Panel className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                <div className="p-6">
                  <div className="mb-6">
                    <Dialog.Title className="text-xl font-semibold text-slate-800">
                      {getStepTitle()}
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-slate-600">
                      {getStepDescription()}
                    </p>
                  </div>

                  {renderCurrentStep()}

                  {errorMessage ? (
                    <div className="mt-6 rounded-full bg-red-100 px-4 py-2 text-center text-xs font-semibold text-red-700">
                      {errorMessage}
                    </div>
                  ) : null}

                  <div className="mt-8 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={currentStep === "position" ? handleClose : handleBack}
                      disabled={loading}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {currentStep === "position" ? "Cancelar" : "Atrás"}
                    </button>

                    <div className="flex items-center gap-2">
                      {currentStep !== "position" && (
                        <div className="flex items-center gap-1">
                          {stepOrder.map((step, index) => (
                            <div
                              key={step}
                              className={`h-2 w-2 rounded-full ${
                                index <= stepOrder.indexOf(currentStep)
                                  ? "bg-emerald-500"
                                  : "bg-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                      )}

                      {currentStep === "confirm" ? (
                        <button
                          type="button"
                          onClick={onConfirm}
                          disabled={!canProceed() || loading}
                          className="rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {loading ? "Confirmando..." : confirmCtaLabel}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleNext}
                          disabled={!canProceed() || loading}
                          className="rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Siguiente
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
