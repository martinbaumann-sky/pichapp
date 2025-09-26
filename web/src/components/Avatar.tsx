"use client";

export default function Avatar({ name, size = 40 }: { name?: string; size?: number }) {
  const initials = (name || "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{ width: size, height: size }} className="rounded-full bg-[color:var(--border)] text-[color:var(--fg)] flex items-center justify-center font-medium">
      {initials}
    </div>
  );
}


