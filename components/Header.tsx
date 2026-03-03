"use client";

import { UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface HeaderProps {
  title: string;
  showBack?: boolean;
}

export default function Header({ title, showBack = false }: HeaderProps) {
  const router = useRouter();

  return (
    <header
      className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 bg-white"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-xl active:scale-90 transition-transform"
            style={{ background: "var(--surface)", color: "var(--text-primary)" }}
          >
            ‹
          </button>
        )}
        <h1 className="text-base font-bold tracking-tight truncate" style={{ color: "var(--text-primary)" }}>
          {title}
        </h1>
      </div>
      <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-9 h-9" } }} />
    </header>
  );
}