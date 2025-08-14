"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AuthDialog from "@/components/AuthDialog";
import { Suspense } from "react";

function SignInContent() {
	const sp = useSearchParams();
	const router = useRouter();
	const [open, setOpen] = useState(true);
	const next = sp.get("next") ?? "/";
	useEffect(() => {
		if (!open) router.replace(next);
	}, [open, next, router]);
	return (
		<div className="min-h-[60vh] flex items-center justify-center">
			<AuthDialog open={open} onOpenChange={setOpen} initialTab="login" />
		</div>
	);
}

export default function SignInPage() {
	return (
		<Suspense>
			<SignInContent />
		</Suspense>
	);
}


