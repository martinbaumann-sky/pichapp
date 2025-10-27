"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import FrostedAuthCard from "./FrostedAuthCard";

type AuthTab = "login" | "signup";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: AuthTab;
  next?: string;
};

export default function AuthDialog({ open, onOpenChange, initialTab, next }: Props) {
  const [tab, setTab] = useState<AuthTab>(initialTab ?? "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [comuna, setComuna] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (open && initialTab) {
      setTab(initialTab);
    }
  }, [open, initialTab]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          onClick={() => onOpenChange(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        />
        <Dialog.Content className="fixed inset-0 flex items-center justify-center p-4 z-[60]">
          <div className="sm:max-w-md w-[92vw] max-w-md p-6 bg-transparent sm:rounded-2xl rounded-none max-h-[90vh] overflow-auto focus:outline-none">
            <Dialog.Title className="sr-only">
              {tab === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </Dialog.Title>
            <FrostedAuthCard
              tab={tab}
              setTab={setTab}
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
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              onClose={() => onOpenChange(false)}
              next={next}
              isOpen={open}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

