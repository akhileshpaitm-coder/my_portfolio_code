const skillsData = {
  backend: [
    "Node.js", "NestJS", "PHP", "Laravel", "Python",
    "GraphQL", "Kafka", "TypeORM", "Prisma",
  ],
  frontend: [
    "React.js", "Next.js", "Vue.js", "React Native",
    "JavaScript (ES6+)", "TypeScript", "jQuery", "HTML5", "CSS3", "Tailwind CSS",
  ],
  databases: ["MySQL", "MongoDB", "PostgreSQL", "Firebase"],
  devops: [
    "Docker", "Kubernetes", "Jenkins", "SonarQube",
    "Git", "GitLab", "Amazon S3",
  ],
  tools: [
    "Slack", "REST APIs", "Third-party API Integrations",
    "CI/CD Pipelines", "Agile Development",
  ],
};

const expertiseList = [
  "Full Stack Web Application Development",
  "RESTful API & GraphQL Development",
  "Microservices Architecture",
  "Enterprise Application Development",
  "Responsive Web Design",
  "Mobile Application Development",
  "Authentication & Authorization",
  "Database Design & Query Optimization",
  "CI/CD Pipeline Implementation",
  "Docker & Kubernetes Deployment",
  "Cloud Storage Integration (Amazon S3)",
  "Third-Party API Integration",
  "Performance Optimization",
  "Code Quality & Testing",
  "Agile & Scrum Development",
];

const projectsData = [
  {
    title: "Enterprise CRM Platform",
    description:
      "A full-featured customer relationship management system with lead tracking, pipeline management, analytics dashboards, role-based access control, and automated email campaigns. Built for scalability serving 10,000+ concurrent users.",
    tech: ["React.js", "Node.js", "NestJS", "PostgreSQL", "TypeORM", "Docker", "Redis"],
    gradient: "#06b6d4",
    icon: "🤝",
    features: ["Lead Management", "Pipeline Analytics", "Email Campaigns", "Role-based Access"],
  },
  {
    title: "E-Commerce Marketplace",
    description:
      "A scalable multi-vendor e-commerce platform with real-time inventory tracking, payment gateway integration, order management, and a recommendation engine. Handles 50,000+ daily transactions with sub-200ms response times.",
    tech: ["Next.js", "Laravel", "PHP", "MySQL", "Kafka", "Redis", "Jenkins"],
    gradient: "#8b5cf6",
    icon: "🛒",
    features: ["Multi-vendor Support", "Payment Integration", "Inventory Management", "Order Tracking"],
  },
  {
    title: "ERP Management Portal",
    description:
      "A comprehensive enterprise resource planning solution with modules for finance, HR, inventory, procurement, and reporting. Features real-time data synchronization across departments with automated workflow approvals.",
    tech: ["Vue.js", "NestJS", "MongoDB", "GraphQL", "Docker", "Kubernetes", "GitLab CI"],
    gradient: "#ec4899",
    icon: "🏢",
    features: ["Finance Module", "HR Management", "Inventory Control", "Workflow Automation"],
  },
  {
    title: "Cloud Analytics Dashboard",
    description:
      "A real-time business intelligence platform with interactive data visualizations, custom report builders, and predictive analytics. Leverages microservices architecture with event-driven data processing pipelines.",
    tech: ["React.js", "Python", "GraphQL", "AWS S3", "Docker", "Redis", "NestJS"],
    gradient: "#f59e0b",
    icon: "📊",
    features: ["Real-time Analytics", "Custom Reports", "Predictive Modeling", "Data Export"],
  },
  {
    title: "Mobile Healthcare App",
    description:
      "A cross-platform mobile application for patient management, appointment scheduling, telemedicine consultations, and electronic health records. Built with React Native for iOS and Android with offline-first capabilities.",
    tech: ["React Native", "Firebase", "Node.js", "MongoDB", "TypeScript", "WebSockets"],
    gradient: "#10b981",
    icon: "🏥",
    features: ["Appointment Scheduling", "Telemedicine", "Health Records", "Push Notifications"],
  },
  {
    title: "Real-Time Notification System",
    description:
      "An event-driven notification infrastructure supporting email, SMS, push notifications, and in-app alerts. Processes 1M+ events daily with Kafka-based message queuing and configurable delivery rules.",
    tech: ["Node.js", "NestJS", "Kafka", "Redis", "MongoDB", "Docker", "WebSockets"],
    gradient: "#06b6d4",
    icon: "🔔",
    features: ["Multi-channel Delivery", "Template Engine", "Delivery Analytics", "Retry Logic"],
  },
];

const technologies = {
  Frontend: [
    "React.js", "Next.js", "Vue.js", "React Native",
    "JavaScript", "TypeScript", "HTML5", "CSS3", "Tailwind CSS", "jQuery",
  ],
  Backend: ["Node.js", "NestJS", "PHP", "Laravel", "Python", "GraphQL", "Kafka"],
  Databases: ["MySQL", "PostgreSQL", "MongoDB", "Firebase"],
  "ORMs": ["TypeORM", "Prisma"],
  "DevOps & Tools": [
    "Docker", "Kubernetes", "Jenkins", "SonarQube",
    "Git", "GitLab", "Amazon S3", "Slack",
  ],
};

function SkillCard({
  title,
  skills,
  gradient,
  index,
}: {
  title: string;
  skills: string[];
  gradient: string;
  index: number;
}) {
  return (
    <div
      className="skill-card rounded-2xl p-6 md:p-7"
      style={{ animationDelay: `${0.1 + index * 0.1}s` }}
    >
      {/* Icon */}
      <div
        className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
        style={{
          background: `linear-gradient(135deg, ${gradient})`,
          boxShadow: `0 4px 16px ${gradient.replace('50%', '20%')}`,
        }}
      >
        {title === "Backend" && "⚙️"}
        {title === "Frontend" && "🎨"}
        {title === "Databases" && "🗄️"}
        {title === "DevOps & Cloud" && "☁️"}
        {title === "Tools & Collaboration" && "🛠️"}
      </div>

      <h3 className="mb-4 text-lg font-semibold text-zinc-100">{title}</h3>

      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span key={skill} className="tag-chip">
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="glass mx-auto mt-4 w-[90%] max-w-5xl rounded-2xl px-6 py-3">
        <div className="flex items-center justify-between">
          <a href="#" className="text-lg font-bold text-zinc-100">
            AP<span className="text-cyan-400">.</span>
          </a>
          <div className="hidden items-center gap-8 text-sm sm:flex">
            <a href="#about" className="nav-link">About</a>
            <a href="#skills" className="nav-link">Skills</a>
            <a href="#expertise" className="nav-link">Expertise</a>
            <a href="#projects" className="nav-link">Projects</a>
            <a href="#technologies" className="nav-link">Tech Stack</a>
            <a href="#contact" className="nav-link">Contact</a>
          </div>
          <a
            href="mailto:akhileshpaitm@gmail.com"
            className="rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2 text-sm font-medium text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25"
          >
            Contact Me
          </a>
        </div>
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────
function HeroSection() {
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
          ✦ 6+ Years of Experience
        </div>

        {/* Name */}
        <h1 className="mb-4 text-5xl font-bold leading-tight tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
          <span className="gradient-text">Akhilesh Prajapati</span>
        </h1>

        {/* Tagline */}
        <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          Full Stack Software Developer specializing in building scalable, secure, and high-performance web &amp; mobile applications with modern technologies.
        </p>

        {/* CTAs */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <a
            href="#projects"
            className="group relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/25"
          >
            Explore My Work
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </a>
          <a
            href="#technologies"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-8 py-3.5 text-sm font-medium text-zinc-300 transition-all hover:border-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/50"
          >
            View Tech Stack
          </a>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 border-t border-zinc-800/60 pt-10 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          {[
            { value: "6+", label: "Years Experience" },
            { value: "50+", label: "Projects Delivered" },
            { value: "20+", label: "Technologies" },
          ].map((stat) => (
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
// About
// ─────────────────────────────────────────────
function AboutSection() {
  return (
    <section id="about" className="relative px-4 py-28">
      <div className="mx-auto max-w-5xl">
        {/* Heading */}
        <div className="mb-4 flex items-center gap-4">
          <span className="text-sm font-semibold tracking-widest text-cyan-400 uppercase">About Me</span>
          <div className="section-bar" />
        </div>
        <h2 className="mb-12 text-3xl font-bold text-zinc-100 sm:text-4xl">
          Building <span className="gradient-text">Digital Excellence</span>
        </h2>

        <div className="grid gap-10 lg:grid-cols-5 lg:gap-16">
          {/* Bio */}
          <div className="space-y-5 leading-relaxed text-zinc-400 lg:col-span-3">
            <p className="text-lg text-zinc-300">
              Hello! I&apos;m <span className="font-semibold text-zinc-100">Akhilesh Prajapati</span>, a passionate Full Stack Software Developer with over <span className="text-cyan-300">6 years of professional experience</span> in designing, developing, and deploying scalable, secure, and high-performance web and mobile applications.
            </p>
            <p>
              Throughout my career, I have worked on a wide range of projects — from enterprise business applications and e-commerce platforms to CRM systems, ERP solutions, management portals, and cloud-based applications.
            </p>
            <p>
              I specialize in both frontend and backend development, building complete end-to-end solutions. On the frontend, I create responsive, user-friendly interfaces using{" "}
              <span className="text-zinc-200">React.js, Next.js, Vue.js, React Native,</span> and modern CSS. On the backend, I design scalable APIs, microservices, authentication systems, and real-time applications with{" "}
              <span className="text-zinc-200">Node.js, NestJS, PHP, Laravel,</span> and more.
            </p>
            <p>
              Beyond writing code, I&apos;m passionate about{" "}
              <span className="text-zinc-200">DevOps, automation, CI/CD pipelines, containerization with Docker &amp; Kubernetes,</span> and maintaining high code quality standards through testing and code reviews.
            </p>
            <p>
              I believe in clean code, software design principles, and continuous learning. I enjoy mentoring team members, sharing knowledge, and contributing to collaborative development environments that deliver long-term value.
            </p>
          </div>

          {/* Highlights card */}
          <div className="lg:col-span-2">
            <div className="glass rounded-2xl p-6 md:p-8">
              <h3 className="mb-6 text-lg font-semibold text-zinc-100">Core Values</h3>
              <div className="space-y-5">
                {[
                  { icon: "🎯", title: "Clean Code", desc: "Maintainable, readable, and well-documented code" },
                  { icon: "🚀", title: "Performance", desc: "Optimized applications for speed and scalability" },
                  { icon: "🔒", title: "Security", desc: "Enterprise-grade security in every solution" },
                  { icon: "🤝", title: "Collaboration", desc: "Agile teamwork and knowledge sharing" },
                  { icon: "📚", title: "Continuous Learning", desc: "Always exploring emerging technologies" },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <span className="mt-0.5 text-xl">{item.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-zinc-200">{item.title}</div>
                      <div className="text-xs text-zinc-500">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Skills
// ─────────────────────────────────────────────
function SkillsSection() {
  const gradients: Record<string, string> = {
    Backend: "#06b6d4 0%, #0891b2 100%",
    Frontend: "#8b5cf6 0%, #6d28d9 100%",
    Databases: "#ec4899 0%, #db2777 100%",
    "DevOps & Cloud": "#f59e0b 0%, #d97706 100%",
    "Tools & Collaboration": "#10b981 0%, #059669 100%",
  };

  return (
    <section id="skills" className="relative px-4 py-28">
      {/* Subtle background gradient */}
      <div className="absolute top-1/2 left-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/5 blur-[120px]" />

      <div className="relative mx-auto max-w-5xl">
        {/* Heading */}
        <div className="mb-4 flex items-center gap-4">
          <span className="text-sm font-semibold tracking-widest text-cyan-400 uppercase">Skills</span>
          <div className="section-bar" />
        </div>
        <h2 className="mb-4 text-3xl font-bold text-zinc-100 sm:text-4xl">
          Technical <span className="gradient-text">Expertise</span>
        </h2>
        <p className="mb-12 max-w-2xl text-zinc-500">
          A comprehensive overview of the technologies and tools I use to build modern, scalable applications.
        </p>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 stagger">
          {Object.entries(skillsData).map(([key, skills], idx) => (
            <SkillCard
              key={key}
              title={key === "devops" ? "DevOps & Cloud" : key === "tools" ? "Tools & Collaboration" : key.charAt(0).toUpperCase() + key.slice(1)}
              skills={skills}
              gradient={gradients[key === "devops" ? "DevOps & Cloud" : key === "tools" ? "Tools & Collaboration" : key.charAt(0).toUpperCase() + key.slice(1)]}
              index={idx}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Expertise
// ─────────────────────────────────────────────
function ExpertiseSection() {
  return (
    <section id="expertise" className="relative px-4 py-28">
      <div className="mx-auto max-w-5xl">
        {/* Heading */}
        <div className="mb-4 flex items-center gap-4">
          <span className="text-sm font-semibold tracking-widest text-cyan-400 uppercase">Expertise</span>
          <div className="section-bar" />
        </div>
        <h2 className="mb-4 text-3xl font-bold text-zinc-100 sm:text-4xl">
          Core Technical <span className="gradient-text">Expertise</span>
        </h2>
        <p className="mb-12 max-w-2xl text-zinc-500">
          Key areas where I deliver high-impact results across the full development lifecycle.
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 stagger">
          {expertiseList.map((item) => (
            <div
              key={item}
              className="glass rounded-xl px-5 py-4 transition-all hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-600/20">
                  <div className="h-2 w-2 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500" />
                </div>
                <span className="text-sm font-medium text-zinc-300">{item}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Technologies
// ─────────────────────────────────────────────
function TechnologiesSection() {
  const gradients: Record<string, string> = {
    Frontend: "#8b5cf6",
    Backend: "#06b6d4",
    Databases: "#ec4899",
    ORMs: "#10b981",
    "DevOps & Tools": "#f59e0b",
  };

  return (
    <section id="technologies" className="relative px-4 py-28">
      <div className="absolute top-1/3 right-0 h-72 w-72 rounded-full bg-cyan-500/5 blur-[100px]" />

      <div className="relative mx-auto max-w-5xl">
        {/* Heading */}
        <div className="mb-4 flex items-center gap-4">
          <span className="text-sm font-semibold tracking-widest text-cyan-400 uppercase">Tech Stack</span>
          <div className="section-bar" />
        </div>
        <h2 className="mb-4 text-3xl font-bold text-zinc-100 sm:text-4xl">
          Technologies I <span className="gradient-text">Work With</span>
        </h2>
        <p className="mb-12 max-w-2xl text-zinc-500">
          The modern tools and frameworks I leverage to build production-ready applications.
        </p>

        <div className="space-y-8 stagger">
          {Object.entries(technologies).map(([category, techs]) => (
            <div key={category}>
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: gradients[category] || "#8b5cf6" }}
                />
                <h3 className="text-sm font-semibold tracking-wider text-zinc-400 uppercase">
                  {category}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {techs.map((tech) => (
                  <span key={tech} className="tag-chip text-sm">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Projects
// ─────────────────────────────────────────────
function ProjectsSection() {
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
          {projectsData.map((project) => (
            <div
              key={project.title}
              className="group relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 transition-all duration-300 hover:-translate-y-2 hover:border-zinc-700 hover:shadow-xl"
            >
              {/* Top gradient accent */}
              <div
                className="absolute top-0 left-0 right-0 h-1 opacity-60 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background: `linear-gradient(90deg, ${project.gradient}, ${project.gradient}88)`,
                }}
              />

              {/* Icon */}
              <div
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-xl"
                style={{
                  background: `${project.gradient}15`,
                  border: `1px solid ${project.gradient}25`,
                }}
              >
                {project.icon}
              </div>

              {/* Title */}
              <h3 className="mb-2 text-lg font-semibold text-zinc-100">
                {project.title}
              </h3>

              {/* Description */}
              <p className="mb-4 text-sm leading-relaxed text-zinc-400">
                {project.description}
              </p>

              {/* Features */}
              <div className="mb-4 flex flex-wrap gap-1.5">
                {project.features.map((f) => (
                  <span
                    key={f}
                    className="rounded-md bg-zinc-800/60 px-2 py-0.5 text-[11px] text-zinc-500"
                  >
                    {f}
                  </span>
                ))}
              </div>

              {/* Tech tags */}
              <div className="mb-5 flex flex-wrap gap-1.5">
                {project.tech.map((t) => (
                  <span
                    key={t}
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors duration-200"
                    style={{
                      color: project.gradient,
                      background: `${project.gradient}12`,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>

            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import ContactSection from "./components/ContactSection";

// ─────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-zinc-800/60 px-4 py-12">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
        <div>
          <p className="text-sm font-bold text-zinc-100">
            Akhilesh Prajapati<span className="text-cyan-400">.</span>
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            Full Stack Software Developer
          </p>
        </div>
        <p className="text-xs text-zinc-600">
          &copy; {new Date().getFullYear()} — Akhilesh Prajapati
        </p>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/akhileshpaitm-coder"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-zinc-800 px-3.5 py-1.5 text-xs text-zinc-500 transition-all hover:border-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/50"
          >
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/akhilesh-prajapati-9a8682193"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-zinc-800 px-3.5 py-1.5 text-xs text-zinc-500 transition-all hover:border-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/50"
          >
            LinkedIn
          </a>
          <a
            href="mailto:akhileshpaitm@gmail.com"
            className="rounded-full border border-zinc-800 px-3.5 py-1.5 text-xs text-zinc-500 transition-all hover:border-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/50"
          >
            Email
          </a>
        </div>
      </div>
    </footer>
  );
}

// =============================================
// PAGE
// =============================================
export default function Home() {
  return (
    <main className="bg-background">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <SkillsSection />
      <ExpertiseSection />
      <ProjectsSection />
      <TechnologiesSection />
      <ContactSection />
      <Footer />
    </main>
  );
}
