import { getProjects, type Project } from "@/lib/projects";
import ProjectFlipCard from "./ProjectFlipCard";

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
          {projects.map((project, index) => (
            <ProjectFlipCard
              key={`${project.id}-${project.title}`}
              project={project}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
