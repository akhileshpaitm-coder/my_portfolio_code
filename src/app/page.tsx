import Image from "next/image";
import Link from "next/link";
import ContactSection from "./components/ContactSection";
import CalendlyButton from "./components/CalendlyButton";
import MobileMenu from "./components/MobileMenu";
import AboutSection from "./components/sections/About";
import ExpertiseSection from "./components/sections/Expertise";
import ProjectsSection from "./components/sections/Projects";
import TechnologiesSection from "./components/sections/Technologies";
import { getSiteSettings } from "@/lib/settings";
import { auth } from "@/lib/auth";

function Navbar({
  prefill,
}: {
  prefill?: { name?: string; email?: string };
}) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="glass mx-auto mt-4 w-[90%] max-w-5xl rounded-2xl px-6 py-3">
        <div className="flex items-center justify-between">
          <a href="#" className="flex shrink-0 items-center gap-2">
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
          </a>
          <div className="hidden items-center gap-8 text-sm sm:flex">
            <Link href="/about" className="nav-link">About</Link>
            <Link href="/skills" className="nav-link">Skills</Link>
            <Link href="/expertise" className="nav-link">Expertise</Link>
            <Link href="/projects" className="nav-link">Projects</Link>
            <Link href="/tech-stack" className="nav-link">Tech Stack</Link>
            <Link href="/contact" className="nav-link">Contact</Link>
          </div>
          <div className="flex items-center gap-3">
            <CalendlyButton
              prefill={prefill}
              className="hidden rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2 text-sm font-medium text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25 sm:block"
            />
            <a
              href="mailto:akhileshpaitm@gmail.com"
              className="hidden rounded-full border border-zinc-700 px-5 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100 sm:block"
            >
              Contact Me
            </a>
            <MobileMenu
              links={[
                { href: "/about", label: "About" },
                { href: "/skills", label: "Skills" },
                { href: "/expertise", label: "Expertise" },
                { href: "/projects", label: "Projects" },
                { href: "/tech-stack", label: "Tech Stack" },
                { href: "/contact", label: "Contact" },
              ]}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────
function HeroSection({
  settings,
  prefill,
}: {
  settings: Awaited<ReturnType<typeof getSiteSettings>>;
  prefill?: { name?: string; email?: string };
}) {
  const stats = [
    { value: settings.hero_stat1_value, label: settings.hero_stat1_label },
    { value: settings.hero_stat2_value, label: settings.hero_stat2_label },
    { value: settings.hero_stat3_value, label: settings.hero_stat3_label },
  ];

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pt-24">
      {/* Background blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #e4e4e7 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        {/* Badge */}
        <div className="mb-6 inline-block animate-fade-in rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1.5 text-xs font-medium tracking-wide text-cyan-300">
          {settings.hero_badge}
        </div>

        {/* Name */}
        <h1 className="mb-4 text-5xl font-bold leading-tight tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
          <span className="gradient-text">Akhilesh Prajapati</span>
        </h1>

        {/* Tagline */}
        <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {settings.hero_tagline}
        </p>

        {/* CTAs */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <CalendlyButton
            prefill={prefill}
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/25"
          >
            Book a Meeting
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </CalendlyButton>
          <a
            href="#projects"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-8 py-3.5 text-sm font-medium text-zinc-300 transition-all hover:border-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/50"
          >
            Explore My Work
          </a>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 border-t border-zinc-800/60 pt-10 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-bold gradient-text sm:text-4xl">{stat.value}</div>
              <div className="mt-1 text-xs text-zinc-500 sm:text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg className="h-6 w-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7" />
        </svg>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────
const FOOTER_LINKS = [
  { href: "/about", label: "About" },
  { href: "/skills", label: "Skills" },
  { href: "/expertise", label: "Expertise" },
  { href: "/projects", label: "Projects" },
  { href: "/tech-stack", label: "Tech Stack" },
  { href: "/contact", label: "Contact" },
];

function Footer({
  settings,
}: {
  settings: Awaited<ReturnType<typeof getSiteSettings>>;
}) {
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
              {settings.footer_blurb}
            </p>
          </div>

          {/* Quick links (menu) */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Quick Links
            </h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {FOOTER_LINKS.map((link) => (
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
                href={settings.footer_github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-zinc-800 px-4 py-2 text-xs text-zinc-500 transition-all hover:border-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/50"
              >
                GitHub
              </a>
              <a
                href={settings.footer_linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-zinc-800 px-4 py-2 text-xs text-zinc-500 transition-all hover:border-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/50"
              >
                LinkedIn
              </a>
              <a
                href={`mailto:${settings.contact_email}`}
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

// =============================================
// PAGE
// =============================================
export const dynamic = "force-dynamic";

export default async function Home() {
  const [settings, session] = await Promise.all([getSiteSettings(), auth()]);
  const prefill =
    session?.user?.name || session?.user?.email
      ? { name: session.user.name ?? undefined, email: session.user.email ?? undefined }
      : undefined;

  return (
    <main className="bg-background">
      <Navbar prefill={prefill} />
      <HeroSection settings={settings} prefill={prefill} />
      <AboutSection />
      <TechnologiesSection />
      <ExpertiseSection />
      <ProjectsSection />
      <ContactSection
        email={settings.contact_email}
        location={settings.contact_location}
        availability={settings.contact_availability}
        responseNote={settings.contact_response_note}
      />
      <Footer settings={settings} />
    </main>
  );
}
