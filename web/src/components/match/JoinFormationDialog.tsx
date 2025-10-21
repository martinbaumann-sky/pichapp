"use client";

import { Fragment } from "react";
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
  bench?: FormationPlayer[];
};

export type JoinFormationDialogProps = {
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

export function JoinFormationDialog({
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
  title = "Elige tu posicion",
  description = "Selecciona equipo y posicion antes de confirmar tu cupo.",
  errorMessage = null,
  maxFriends = 0,
  friendCount = 0,
  onFriendCountChange,
  friends = [],
  onUpdateFriend,
}: JoinFormationDialogProps) {
  const boundedFriendCount = Math.min(friendCount, maxFriends);
  const canAdjustFriends = typeof onFriendCountChange === "function" && maxFriends > 0;

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[2000]" onClose={loading ? () => undefined : onClose}>
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
          <div className="flex min-h-full items-center justify-center px-4 py-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-2"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-2"
            >
              <Dialog.Panel className="w-full max-w-5xl rounded-3xl bg-white shadow-2xl">
                <div className="flex flex-col gap-6 p-6 sm:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Dialog.Title className="text-2xl font-semibold text-slate-900">{title}</Dialog.Title>
                      <Dialog.Description className="mt-1 text-sm text-slate-500">{description}</Dialog.Description>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-500 transition hover:bg-slate-50"
                    >
                      Cerrar
                    </button>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    {teams.map((team) => (
                      <div
                        key={team.team}
                        className={`flex flex-col gap-4 rounded-3xl border transition ${
                          selectedTeam === team.team ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between px-4 pt-4">
                          <button
                            type="button"
                            onClick={() => onSelectTeam(team.team)}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                              selectedTeam === team.team
                                ? "bg-emerald-500 text-white shadow"
                                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {team.label}
                          </button>
                          {selectedTeam === team.team ? (
                            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Seleccionado</span>
                          ) : null}
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

                  {canAdjustFriends ? (
                    <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-slate-800">¿Quieres traer amigos?</h4>
                          <p className="text-sm text-slate-500">
                            {maxFriends === 0
                              ? "No quedan cupos extra para invitar en este partido."
                              : "Reserva cupos para tus invitados, tú cubres el pago de cada uno."}
                          </p>
                        </div>
                        <div className="inline-flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => onFriendCountChange?.(Math.max(0, boundedFriendCount - 1))}
                            disabled={boundedFriendCount <= 0 || loading}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
                            aria-label="Reducir invitados"
                          >
                            −
                          </button>
                          <span className="min-w-[2.5rem] text-center text-base font-semibold text-slate-700">
                            {boundedFriendCount}
                          </span>
                          <button
                            type="button"
                            onClick={() => onFriendCountChange?.(Math.min(maxFriends, boundedFriendCount + 1))}
                            disabled={boundedFriendCount >= maxFriends || loading}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
                            aria-label="Aumentar invitados"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {boundedFriendCount > 0 ? (
                        <div className="space-y-4">
                          {friends.slice(0, boundedFriendCount).map((friend, idx) => (
                            <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                              <div className="mb-3 flex items-center justify-between">
                                <p className="text-sm font-semibold text-slate-700">Invitado {idx + 1}</p>
                                <span className="text-xs text-slate-400">Pagas su cupo al confirmar</span>
                              </div>
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nombre</label>
                                  <input
                                    type="text"
                                    value={friend.name}
                                    onChange={(e) => onUpdateFriend?.(idx, { ...friend, name: e.target.value })}
                                    placeholder="Nombre de tu amigo"
                                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
                                    required
                                  />
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Correo</label>
                                  <input
                                    type="email"
                                    value={friend.email}
                                    onChange={(e) => onUpdateFriend?.(idx, { ...friend, email: e.target.value })}
                                    placeholder="amigo@correo.com"
                                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Equipo preferido</label>
                                  <select
                                    value={friend.team}
                                    onChange={(e) => onUpdateFriend?.(idx, { ...friend, team: (e.target.value as TeamKey) || "" })}
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
                                    required
                                  >
                                    <option value="" disabled>
                                      Selecciona equipo
                                    </option>
                                    {TEAM_KEYS.map((key) => (
                                      <option key={key} value={key}>
                                        {TEAM_LABELS[key]}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Posición</label>
                                  <select
                                    value={friend.position}
                                    onChange={(e) => onUpdateFriend?.(idx, { ...friend, position: (e.target.value as PositionKey) || "" })}
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
                                    required
                                  >
                                    <option value="" disabled>
                                      Selecciona posición
                                    </option>
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
                      ) : null}

                      <p className="text-xs text-slate-400">
                        Puedes invitar hasta {maxFriends} amigo{maxFriends === 1 ? "" : "s"} según los cupos disponibles.
                      </p>
                    </div>
                  ) : null}

                  <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={onConfirm}
                      disabled={confirmDisabled || loading}
                      className="inline-flex min-w-[180px] items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {loading ? "Confirmando..." : "Confirmar"}
                    </button>
                    <p className="text-xs text-slate-400">Luego podras revisar la formacion en la pestaña Jugadores.</p>
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

