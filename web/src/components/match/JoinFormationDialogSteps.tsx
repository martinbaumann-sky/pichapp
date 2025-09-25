"use client";

import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import type { PositionKey, TeamKey } from "@/lib/teams";
import { FormationBoard, type FormationSlotView, type FormationPlayer } from "@/components/match/FormationBoard";
import { TEAM_KEYS, TEAM_LABELS, POSITION_KEYS } from "@/lib/teams";
import { posicionES } from "@/lib/i18n";

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
}: JoinFormationDialogStepsProps) {
  const [currentStep, setCurrentStep] = useState<Step>("position");
  const boundedFriendCount = Math.min(friendCount, maxFriends);
  const canAdjustFriends = typeof onFriendCountChange === "function" && maxFriends > 0;

  const handleNext = () => {
    if (currentStep === "position") {
      if (selectedSlot) {
        setCurrentStep("friends");
      }
    } else if (currentStep === "friends") {
      setCurrentStep("confirm");
    }
  };

  const handleBack = () => {
    if (currentStep === "friends") {
      setCurrentStep("position");
    } else if (currentStep === "confirm") {
      setCurrentStep("friends");
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
        return "Paso 2: Invita amigos";
      case "confirm":
        return "Paso 3: Confirma tu registro";
      default:
        return title;
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case "position":
        return "Selecciona el equipo y posición donde quieres jugar.";
      case "friends":
        return "¿Quieres invitar amigos? Puedes traer hasta " + maxFriends + " amigos.";
      case "confirm":
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

      {errorMessage ? (
        <div className="rounded-full bg-red-100 px-4 py-2 text-center text-xs font-semibold text-red-700">
          {errorMessage}
        </div>
      ) : null}
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
    const selectedTeamData = teams.find(t => t.team === selectedTeam);
    const selectedSlotData = selectedTeamData?.slots.find(s => s.index === selectedSlot?.slotIndex);
    
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h4 className="font-semibold text-slate-800 mb-3">Tu posición</h4>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
              {selectedTeamData?.label}
            </span>
            <span className="text-slate-600">
              {selectedSlotData?.position ? posicionES[selectedSlotData.position] : "Posición"}
            </span>
          </div>
        </div>

        {friendCount > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="font-semibold text-slate-800 mb-3">Amigos invitados ({friendCount})</h4>
            <div className="space-y-2">
              {friends.slice(0, friendCount).map((friend, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{friend.name}</span>
                  <span className="text-slate-500">{friend.email}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <div className="h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-white">!</span>
            </div>
            <div className="text-sm text-amber-800">
              <p className="font-medium">Importante</p>
              <p className="mt-1">
                Al confirmar, tu cupo quedará reservado. Si tienes amigos invitados, 
                también se reservarán sus cupos automáticamente.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "position":
        return renderPositionStep();
      case "friends":
        return renderFriendsStep();
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
                          {["position", "friends", "confirm"].map((step, index) => (
                            <div
                              key={step}
                              className={`h-2 w-2 rounded-full ${
                                index <= ["position", "friends", "confirm"].indexOf(currentStep)
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
                          {loading ? "Confirmando..." : "Confirmar registro"}
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
