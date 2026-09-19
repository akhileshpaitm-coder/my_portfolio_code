import Image from "next/image";
import Link from "next/link";
import MobileMenu from "./MobileMenu";

const NAV_LINKS = [
  { href: "/about", label: "About" },
  { href: "/skills", label: "Skills" },
  { href: "/expertise", label: "Expertise" },
  { href: "/projects", label: "Projects" },
  { href: "/tech-stack", label: "Tech Stack" },
  { href: "/contact", label: "Contact" },
];

export function SiteNavbar({ active }: { active?: string }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="glass mx-auto mt-4 w-[90%] max-w-5xl rounded-2xl px-6 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Image
              src="/assets/site_images/logo-icon.png"
              alt=""
              width={40}
              height={25}
              priority
              className="h-9 w-auto sm:h-10"
            />
            <span className="gradient-text text-lg font-bold tracking-tight">
              Akhilesh Prajapati
            </span>
          </Link>
          <div className="hidden items-center gap-8 text-sm lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${active === link.href ? "text-zinc-100" : ""}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className="hidden rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2 text-sm font-medium text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25 sm:block"
            >
              Contact Me
            </Link>
            <MobileMenu links={NAV_LINKS} active={active} />
          </div>
        </div>
      </div>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-800/60 px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          {/* Brand + about text */}
          <div>
            <div className="flex items-center gap-2">
              <Image
                src="/assets/site_images/logo-icon.png"
                alt=""
                width={36}
                height={23}
                className="h-8 w-auto"
              />
              <span className="gradient-text text-base font-bold tracking-tight">
                Akhilesh Prajapati
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Full Stack Software Developer
            </p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-500">
              Building scalable, secure, and high-performance web &amp; mobile
              applications for 6+ years — from enterprise platforms and
              e-commerce to cloud solutions and real-time systems.
            </p>
          </div>

          {/* Quick links (menu) */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Quick Links
            </h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-500 transition-colors hover:text-cyan-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Connect
            </h3>
            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href="https://github.com/akhileshpaitm-coder"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-zinc-800 px-4 py-2 text-xs text-zinc-500 transition-all hover:border-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/50"
              >
                GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/akhilesh-prajapati-9a8682193"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-zinc-800 px-4 py-2 text-xs text-zinc-500 transition-all hover:border-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/50"
              >
                LinkedIn
              </a>
              <a
                href="mailto:akhileshpaitm@gmail.com"
                className="rounded-full border border-zinc-800 px-4 py-2 text-xs text-zinc-500 transition-all hover:border-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/50"
              >
                Email
              </a>
              <Link
                href="/login"
                className="rounded-full border border-zinc-800 px-4 py-2 text-xs text-zinc-500 transition-all hover:border-cyan-500/40 hover:text-cyan-300 hover:bg-zinc-800/50"
              >
                Login
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-zinc-800/60 pt-6 text-center">
          <p className="text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} — Akhilesh Prajapati. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
