import { getSkills, groupSkillsByCategory, type SkillGroup } from "@/lib/skills";

/**
 * Fallback data (the original hardcoded skills) — used when the DB has no
 * skills yet or is unreachable, so the public section never renders empty.
 */
const fallbackData: Record<string, string[]> = {
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

/** Display title for a category key (fallback keys use the old mapping). */
function categoryTitle(key: string): string {
  if (key === "devops") return "DevOps & Cloud";
  if (key === "tools") return "Tools & Collaboration";
  return key.charAt(0).toUpperCase() + key.slice(1);
}

const ICONS: Record<string, string> = {
  Backend: "⚙️",
  Frontend: "🎨",
  Databases: "🗄️",
  "DevOps & Cloud": "☁️",
  "Tools & Collaboration": "🛠️",
};

const GRADIENTS: Record<string, string> = {
  Backend: "#06b6d4 0%, #0891b2 100%",
  Frontend: "#8b5cf6 0%, #6d28d9 100%",
  Databases: "#ec4899 0%, #db2777 100%",
  "DevOps & Cloud": "#f59e0b 0%, #d97706 100%",
  "Tools & Collaboration": "#10b981 0%, #059669 100%",
};

/** Rotating gradients for admin-created categories. */
const EXTRA_GRADIENTS = [
  "#f43f5e 0%, #e11d48 100%",
  "#14b8a6 0%, #0d9488 100%",
  "#a855f7 0%, #9333ea 100%",
  "#3b82f6 0%, #2563eb 100%",
];

function iconFor(title: string, index: number): string {
  return ICONS[title] ?? ["🧩", "🚀", "📦", "💡"][index % 4];
}

function gradientFor(title: string, index: number): string {
  return GRADIENTS[title] ?? EXTRA_GRADIENTS[index % EXTRA_GRADIENTS.length];
}

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
      className="skill-card min-w-0 rounded-2xl p-6 md:p-7"
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
        {iconFor(title, index)}
      </div>

      <h3 className="mb-4 break-words text-lg font-semibold text-zinc-100">{title}</h3>

      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span key={skill} className="tag-chip max-w-full break-words">
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

export default async function SkillsSection() {
  let groups: SkillGroup[];

  try {
    const skills = await getSkills();
    groups = skills.length > 0 ? groupSkillsByCategory(skills) : fallbackFromStatic();
  } catch {
    groups = fallbackFromStatic();
  }

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
          {groups.map((group, idx) => (
            <SkillCard
              key={group.category}
              title={group.category}
              skills={group.names}
              gradient={gradientFor(group.category, idx)}
              index={idx}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Fallback shape from the original hardcoded data. */
function fallbackFromStatic(): SkillGroup[] {
  return Object.entries(fallbackData).map(([key, names]) => ({
    category: categoryTitle(key),
    names,
  }));
}
