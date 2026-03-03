"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { UserButton } from '@clerk/nextjs';

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Home",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth={active ? 0 : 2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/assistant",
    label: "Assistant",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth={active ? 0 : 2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: "/service",
    label: "Service",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth={active ? 0 : 2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  
];

export default function BottomNav() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();

  // Hide on auth pages and landing
  if (!isSignedIn || pathname === "/" || pathname.startsWith("/sign")) return null;

  return (
    <nav
      className="sticky bottom-0 w-full bg-white flex pb-safe z-50 justify-around"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 active:opacity-60 transition-opacity"
          >
            <span style={{ color: active ? "var(--primary)" : "var(--text-muted)" }}>
              {item.icon(active)}
            </span>
            <span
              className="text-[10px] font-semibold tracking-wide"
              style={{ color: active ? "var(--primary)" : "var(--text-muted)" }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
      <UserButton />
    </nav>
  );
}