"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AuthDialog from "@/components/AuthDialog";
import Link from "next/link";
import { digitsOnly } from "@/lib/phone";

type FriendItem = {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED';
  isRequester: boolean;
  user: { id: string; name: string; comuna: string; position?: string | null; phone?: string | null; phoneDisplay?: string | null };
  createdAt: string;
};

export default function AmigosPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  const [tab, setTab] = useState<'friends' | 'requests'>('friends');
  const [phone, setPhone] = useState("");
  const [busyAdd, setBusyAdd] = useState(false);
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [incoming, setIncoming] = useState<FriendItem[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const normalizedPhone = useMemo(() => digitsOnly(phone), [phone]);

  useEffect(() => {
    if (!loading && !user) setAuthOpen(true);
  }, [user, loading]);

  const refresh = async () => {
    const [acc, inc] = await Promise.all([
      fetch('/api/friends?status=ACCEPTED', { cache: 'no-store' }).then(r => r.json()).catch(() => ({ items: [] })),
      fetch('/api/friends?pending=incoming', { cache: 'no-store' }).then(r => r.json()).catch(() => ({ items: [] })),
    ]);
<<<<<<< HEAD
    const acceptedItems = Array.isArray(acc.items) ? (acc.items as FriendItem[]) : [];
    const incomingItems = Array.isArray(inc.items)
      ? (inc.items as FriendItem[]).filter((item) => !item.isRequester)
      : [];
    setFriends(acceptedItems);
    setIncoming(incomingItems);
=======
    setFriends(acc.items || []);
    setIncoming(inc.items || []);
>>>>>>> 798dfd9d32fbb69361c0dfa6ccaad19804205fcf
  };

  useEffect(() => { if (user) refresh(); }, [user]);

  const addByPhone = async () => {
    const raw = phone.trim();
    setFormError(null);
    if (!raw) return;
    if (normalizedPhone.length < 7) {
      setFormError('Ingresa un número de celular válido para enviar la solicitud.');
      return;
    }
    setBusyAdd(true);
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setFormError(data?.error || 'No se pudo enviar la solicitud.');
      } else {
        setPhone('');
        await refresh();
        setTab('requests');
        setFormError(null);
      }
    } catch {
      setFormError('No se pudo enviar la solicitud. Inténtalo nuevamente.');
    } finally {
      setBusyAdd(false);
    }
  };

  if (!user) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <AuthDialog open={authOpen} onOpenChange={(o)=>{ setAuthOpen(o); if(!o) router.replace("/"); }} initialTab="login" next="/amigos" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Amigos</h1>
          <p className="text-gray-600">Conecta con tus amigos por numero de celular para invitarlos a tus pichangas.</p>
        </div>
      </div>

      {/* Add by phone */}
      <div className="bg-white border rounded-2xl p-4 mb-6 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <input
            inputMode="tel"
            autoComplete="tel"
            placeholder="+56 9 1234 5678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="flex-1 border rounded-lg px-3 py-2"
          />
          <button onClick={addByPhone} disabled={busyAdd || normalizedPhone.length < 7} className="btn-primary">{busyAdd ? 'Buscando...' : 'Agregar por celular'}</button>
        </div>
        <p className="text-xs text-gray-500 mt-2">Tip: usa el numero exacto que tu amigo tiene en su perfil.</p>
        {formError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>
        ) : null}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('friends')} className={`px-4 py-2 rounded-full text-sm font-medium ${tab==='friends'?'bg-black text-white':'bg-gray-100 text-gray-700'}`}>Mis amigos ({friends.length})</button>
        <button onClick={() => setTab('requests')} className={`px-4 py-2 rounded-full text-sm font-medium ${tab==='requests'?'bg-black text-white':'bg-gray-100 text-gray-700'}`}>Solicitudes ({incoming.length})</button>
      </div>

      {tab === 'friends' ? (
        friends.length === 0 ? (
          <div className="text-gray-500 text-sm">Aun no tienes amigos. Agrega a tus contactos por su celular!</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.map((f) => (
              <FriendCard key={f.id} item={f} onChanged={refresh} />
            ))}
          </div>
        )
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {incoming.map((f) => (
            <FriendCard key={f.id} item={f} mode="incoming" onChanged={refresh} />
          ))}
          {incoming.length === 0 && (
            <div className="text-gray-500 text-sm">No tienes solicitudes pendientes.</div>
          )}
        </div>
      )}
    </div>
  );
}

function FriendCard({ item, mode, onChanged }: { item: FriendItem; mode?: 'incoming' | 'outgoing'; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const isPending = item.status === 'PENDING';
  const profileUrl = item.user?.id ? `/usuarios/${item.user.id}` : null;
  const profileLinkButton = profileUrl ? (
    <Link href={profileUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-sm rounded-lg border">Ver perfil</Link>
  ) : null;

  const accept = async () => { setBusy(true); try { await fetch(`/api/friends/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'accept' }) }); await onChanged(); } finally { setBusy(false); } };
  const reject = async () => { setBusy(true); try { await fetch(`/api/friends/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reject' }) }); await onChanged(); } finally { setBusy(false); } };
  const cancel = async () => { setBusy(true); try { await fetch(`/api/friends/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'cancel' }) }); await onChanged(); } finally { setBusy(false); } };
  const remove = async () => { if (!confirm('Eliminar de tus amigos?')) return; setBusy(true); try { await fetch(`/api/friends/${item.id}`, { method: 'DELETE' }); await onChanged(); } finally { setBusy(false); } };

  return (
    <div className="rounded-2xl border p-4 bg-white">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-lg">*</div>
        <div>
          {profileUrl ? (
            <Link href={profileUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-black underline-offset-4 hover:underline">
              {item.user.name}
            </Link>
          ) : (
            <div className="font-semibold">{item.user.name}</div>
          )}
          <div className="text-xs text-gray-500">{item.user.comuna || '-'} {item.user.position ? `- ${item.user.position}`: ''}</div>
          {item.user.phoneDisplay && <div className="text-xs text-gray-400">{item.user.phoneDisplay}</div>}
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        {isPending ? (
          mode === 'incoming' ? (
            <>
              {profileLinkButton}
              <button disabled={busy} onClick={accept} className="px-3 py-1.5 text-sm rounded-lg bg-black text-white">Aceptar</button>
              <button disabled={busy} onClick={reject} className="px-3 py-1.5 text-sm rounded-lg border">Rechazar</button>
            </>
          ) : (
            <>
              {profileLinkButton}
              <button disabled={busy} onClick={cancel} className="px-3 py-1.5 text-sm rounded-lg border">Cancelar solicitud</button>
            </>
          )
        ) : (
          <>
            {profileLinkButton}
            <a href={`/organizar`} className="px-3 py-1.5 text-sm rounded-lg bg-gray-900 text-white">Invitar a pichanga</a>
            <button disabled={busy} onClick={remove} className="px-3 py-1.5 text-sm rounded-lg border">Eliminar</button>
          </>
        )}
      </div>
    </div>
  );
}

