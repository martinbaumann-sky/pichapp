"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth, resolveUserRole, type UserRole } from "./useAuth";

type GateStatus = "pending" | "allowed" | "denied";

interface RoleGateOptions {
  allow?: ReadonlyArray<UserRole>;
  allowAnonymous?: boolean;
  enforceLogout?: boolean;
  redirectTo?: string;
  message?: string;
  requireAuth?: boolean;
  unauthenticatedRedirect?: string;
}

export function useRoleGate(options: RoleGateOptions) {
  const {
    allow = [],
    allowAnonymous = true,
    enforceLogout = false,
    redirectTo,
    message,
    requireAuth = false,
    unauthenticatedRedirect,
  } = options;

  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const role = useMemo(() => resolveUserRole(user), [user]);
  const [status, setStatus] = useState<GateStatus>("pending");
  const handledRef = useRef(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      handledRef.current = false;
      if (requireAuth && !handledRef.current) {
        handledRef.current = true;
        if (unauthenticatedRedirect) {
          router.replace(unauthenticatedRedirect);
        }
      }
      setStatus(allowAnonymous || !requireAuth ? "allowed" : "pending");
      return;
    }

    if (allow.length === 0 || !role || allow.includes(role)) {
      setStatus("allowed");
      handledRef.current = false;
      return;
    }

    setStatus("denied");
    if (handledRef.current) return;
    handledRef.current = true;

    if (typeof window !== "undefined" && message) {
      try {
        sessionStorage.setItem("pichapp-role-message", message);
      } catch (error) {
        console.warn("[RoleGate] Unable to persist role message", error);
      }
    }

    if (enforceLogout) {
      void signOut();
    } else if (redirectTo) {
      router.replace(redirectTo);
    }
  }, [allow, allowAnonymous, enforceLogout, loading, message, redirectTo, requireAuth, role, router, signOut, unauthenticatedRedirect, user]);

  return { status, role, user };
}
