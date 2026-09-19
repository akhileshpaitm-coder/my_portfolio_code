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

export default function SkillsSection() {
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
