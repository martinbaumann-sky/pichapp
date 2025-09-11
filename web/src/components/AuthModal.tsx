"use client";

import { useState } from "react";
import FrostedAuthCard from "./FrostedAuthCard";

type Props = { open: boolean; onClose: () => void; initialTab?: "login" | "signup" };

export default function AuthModal({ open, onClose, initialTab }: Props) {
  const [tab, setTab] = useState<"login" | "signup">(initialTab ?? "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [comuna, setComuna] = useState("");
  const [position, setPosition] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md p-6">
        <div className="bg-transparent">
          <FrostedAuthCard
            tab={tab}
            setTab={(t) => setTab(t)}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            name={name}
            setName={setName}
            lastName={lastName}
            setLastName={setLastName}
            comuna={comuna}
            setComuna={setComuna}
            position={position}
            setPosition={setPosition}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            onClose={onClose}
          />
          <div className="mt-3">
            <button type="button" onClick={onClose} className="w-full px-4 py-2 text-sm text-gray-500">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}


