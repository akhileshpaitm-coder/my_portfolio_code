"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

/* White inline SVG icons (stroke inherits currentColor) */
const icons = {
  dashboard: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
      />
    </svg>
  ),
  profile: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    </svg>
  ),
  settings: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  projects: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  ),
  skills: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
      />
    </svg>
  ),
  expertise: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
      />
    </svg>
  ),
  about: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
      />
    </svg>
  ),
  messages: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
      />
    </svg>
  ),
  portfolio: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
      />
    </svg>
  ),
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: icons.dashboard },
  { href: "/dashboard/projects", label: "Projects", icon: icons.projects },
  { href: "/dashboard/skills", label: "Skills", icon: icons.skills },
  { href: "/dashboard/expertise", label: "Expertise", icon: icons.expertise },
  { href: "/dashboard/about", label: "About", icon: icons.about },
  { href: "/dashboard/messages", label: "Messages", icon: icons.messages },
  { href: "/dashboard/profile", label: "Profile", icon: icons.profile },
  { href: "/dashboard/settings", label: "Settings", icon: icons.settings },
];

/**
 * Dashboard sidebar — fixed on desktop, slide-in drawer on mobile.
 * Active items use the site's cyan→purple gradient accents.
 * Icons are white inline SVGs that inherit the current text color.
 */
export default function Sidebar({
  open,
  onClose,
  unreadCount = 0,
}: {
  open: boolean;
  onClose: () => void;
  /** Unread contact messages (admin only) — shown as a badge on Messages. */
  unreadCount?: number;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === href
      : href === "/dashboard/projects"
        ? pathname.startsWith("/dashboard/projects")
        : pathname.startsWith(href);

  return (
    <>
      {/* Mobile overlay (dims page, no blur/reflection) */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 flex h-full w-64 flex-col border-r border-zinc-800/60 bg-zinc-950 transition-transform duration-300 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b border-zinc-800/60 px-6">
          <Link href="/" className="shrink-0">
            <Image
              src="/assets/site_images/logo-icon.png"
              alt=""
              width={44}
              height={30}
              priority
              className="h-12 w-auto"
            />
          </Link>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800/50 hover:text-zinc-300 md:hidden"
            aria-label="Close sidebar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`group flex select-none items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium outline-none [-webkit-tap-highlight-color:transparent] focus-visible:ring-2 focus-visible:ring-cyan-500/40 ${
                  active
                    ? "border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-purple-600/10 text-cyan-300"
                    : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-200"
                }`}
              >
                {/* White icon — inherits active/hover text color */}
                <span className="text-white opacity-90 [&>svg]:h-5 [&>svg]:w-5">
                  {item.icon}
                </span>
                {item.label}
                {item.href === "/dashboard/messages" && unreadCount > 0 ? (
                  <span
                    className="ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-1.5 text-[10px] font-bold leading-none text-white"
                    aria-label={`${unreadCount} unread message${unreadCount === 1 ? "" : "s"}`}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : (
                  active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500" />
                  )
                )}
              </Link>
            );
          })}

          <div className="my-4 border-t border-zinc-800/60" />

          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="group flex select-none items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-500 outline-none [-webkit-tap-highlight-color:transparent] transition-colors hover:bg-zinc-800/50 hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-cyan-500/40"
          >
            <span className="text-white opacity-90 [&>svg]:h-5 [&>svg]:w-5">
              {icons.portfolio}
            </span>
            View Portfolio
          </Link>
        </nav>

        {/* Footer */}
        <div className="border-t border-zinc-800/60 p-4">
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-4 py-3">
            <p className="text-xs font-semibold text-zinc-300">Secure area</p>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              JWT-protected session
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
