import { getProjects, type Project } from "@/lib/projects";

/** Static fallback so the public page still renders if the DB is unreachable. */
export const projectsData: Project[] = [
  {
    id: 0,
    title: "Enterprise CRM Platform",
    description:
      "A full-featured customer relationship management system with lead tracking, pipeline management, analytics dashboards, role-based access control, and automated email campaigns. Built for scalability serving 10,000+ concurrent users.",
    tech: ["React.js", "Node.js", "NestJS", "PostgreSQL", "TypeORM", "Docker", "Redis"],
    color: "#06b6d4",
    icon: "🤝",
    features: ["Lead Management", "Pipeline Analytics", "Email Campaigns", "Role-based Access"],
    sort_order: 1,
    demo_url: null,
    screenshot_url: null,
    video_url: null,
    video_path: null,
  },
  {
    id: 0,
    title: "E-Commerce Marketplace",
    description:
      "A scalable multi-vendor e-commerce platform with real-time inventory tracking, payment gateway integration, order management, and a recommendation engine. Handles 50,000+ daily transactions with sub-200ms response times.",
    tech: ["Next.js", "Laravel", "PHP", "MySQL", "Kafka", "Redis", "Jenkins"],
    color: "#8b5cf6",
    icon: "🛒",
    features: ["Multi-vendor Support", "Payment Integration", "Inventory Management", "Order Tracking"],
    sort_order: 2,
    demo_url: null,
    screenshot_url: null,
    video_url: null,
    video_path: null,
  },
  {
    id: 0,
    title: "ERP Management Portal",
    description:
      "A comprehensive enterprise resource planning solution with modules for finance, HR, inventory, procurement, and reporting. Features real-time data synchronization across departments with automated workflow approvals.",
    tech: ["Vue.js", "NestJS", "MongoDB", "GraphQL", "Docker", "Kubernetes", "GitLab CI"],
    color: "#ec4899",
    icon: "🏢",
    features: ["Finance Module", "HR Management", "Inventory Control", "Workflow Automation"],
    sort_order: 3,
    demo_url: null,
    screenshot_url: null,
    video_url: null,
    video_path: null,
  },
  {
    id: 0,
    title: "Cloud Analytics Dashboard",
    description:
      "A real-time business intelligence platform with interactive data visualizations, custom report builders, and predictive analytics. Leverages microservices architecture with event-driven data processing pipelines.",
    tech: ["React.js", "Python", "GraphQL", "AWS S3", "Docker", "Redis", "NestJS"],
    color: "#f59e0b",
    icon: "📊",
    features: ["Real-time Analytics", "Custom Reports", "Predictive Modeling", "Data Export"],
    sort_order: 4,
    demo_url: null,
    screenshot_url: null,
    video_url: null,
    video_path: null,
  },
  {
    id: 0,
    title: "Mobile Healthcare App",
    description:
      "A cross-platform mobile application for patient management, appointment scheduling, telemedicine consultations, and electronic health records. Built with React Native for iOS and Android with offline-first capabilities.",
    tech: ["React Native", "Firebase", "Node.js", "MongoDB", "TypeScript", "WebSockets"],
    color: "#10b981",
    icon: "🏥",
    features: ["Appointment Scheduling", "Telemedicine", "Health Records", "Push Notifications"],
    sort_order: 5,
    demo_url: null,
    screenshot_url: null,
    video_url: null,
    video_path: null,
  },
  {
    id: 0,
    title: "Real-Time Notification System",
    description:
      "An event-driven notification infrastructure supporting email, SMS, push notifications, and in-app alerts. Processes 1M+ events daily with Kafka-based message queuing and configurable delivery rules.",
    tech: ["Node.js", "NestJS", "Kafka", "Redis", "MongoDB", "Docker", "WebSockets"],
    color: "#06b6d4",
    icon: "🔔",
    features: ["Multi-channel Delivery", "Template Engine", "Delivery Analytics", "Retry Logic"],
    sort_order: 6,
    demo_url: null,
    screenshot_url: null,
    video_url: null,
    video_path: null,
  },
];

async function loadProjects(): Promise<Project[]> {
  try {
    const dbProjects = await getProjects();
    if (dbProjects.length > 0) return dbProjects;
  } catch (error) {
    console.error("[projects] DB unavailable, using static fallback:", error);
  }
  return projectsData;
}

export default async function ProjectsSection() {
  const projects = await loadProjects();

  return (
    <section id="projects" className="relative px-4 py-28">
      <div className="absolute top-1/3 left-0 h-80 w-80 rounded-full bg-cyan-500/5 blur-[120px]" />

      <div className="relative mx-auto max-w-5xl">
        {/* Heading */}
        <div className="mb-4 flex items-center gap-4">
          <span className="text-sm font-semibold tracking-widest text-cyan-400 uppercase">Projects</span>
          <div className="section-bar" />
        </div>
        <h2 className="mb-4 text-3xl font-bold text-zinc-100 sm:text-4xl">
          Featured <span className="gradient-text">Work</span>
        </h2>
        <p className="mb-12 max-w-2xl text-zinc-500">
          A selection of projects that showcase my expertise across enterprise applications, e-commerce, cloud solutions, and mobile development.
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 stagger">
          {projects.map((project) => (
            <div
              key={`${project.id}-${project.title}`}
              className="group relative min-w-0 overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/40 transition-all duration-300 hover:-translate-y-2 hover:border-zinc-700 hover:shadow-xl"
            >
              {/* Screenshot banner (uploaded/linked in admin) */}
              {project.screenshot_url && (
                <div className="relative h-44 w-full overflow-hidden border-b border-zinc-800/60">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={project.screenshot_url}
                    alt={`${project.title} screenshot`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/60 to-transparent" />
                </div>
              )}

              <div className="p-6">
              {/* Top gradient accent */}
              <div
                className="absolute top-0 left-0 right-0 h-1 opacity-60 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background: `linear-gradient(90deg, ${project.color}, ${project.color}88)`,
                }}
              />

              {/* Icon */}
              <div
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-xl"
                style={{
                  background: `${project.color}15`,
                  border: `1px solid ${project.color}25`,
                }}
              >
                {project.icon}
              </div>

              {/* Title */}
              <h3 className="mb-2 break-words text-lg font-semibold text-zinc-100">
                {project.title}
              </h3>

              {/* Description */}
              <p className="mb-4 break-words text-sm leading-relaxed text-zinc-400">
                {project.description}
              </p>

              {/* Features */}
              {project.features.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {project.features.map((f, fi) => (
                    <span
                      key={`${f}-${fi}`}
                      className="max-w-full break-words rounded-md bg-zinc-800/60 px-2 py-0.5 text-[11px] text-zinc-500"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}

              {/* Tech tags */}
              {project.tech.length > 0 && (
                <div className="mb-5 flex flex-wrap gap-1.5">
                  {project.tech.map((t, ti) => (
                    <span
                      key={`${t}-${ti}`}
                      className="max-w-full break-words rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors duration-200"
                      style={{
                        color: project.color,
                        background: `${project.color}12`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Demo links (optional) */}
              {(project.demo_url || project.video_url || project.video_path) && (
                <div className="flex flex-wrap items-center gap-4 border-t border-zinc-800/60 pt-4">
                  {project.demo_url && (
                    <a
                      href={project.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
                      style={{ color: project.color }}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                      Live Demo
                    </a>
                  )}
                  {(project.video_url || project.video_path) && (
                    <a
                      href={project.video_url || project.video_path!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 transition-colors hover:text-zinc-100"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                      </svg>
                      Watch video
                    </a>
                  )}
                </div>
              )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
