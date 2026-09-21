import { getSkills, groupSkillsByCategory, type SkillGroup } from "@/lib/skills";

/**
 * Fallback data (the original hardcoded tech stack) — used when the DB has
 * no skills yet or is unreachable, so the public page never renders empty.
 */
const fallbackData: Record<string, string[]> = {
  Frontend: [
    "React.js", "Next.js", "Vue.js", "React Native",
    "JavaScript", "TypeScript", "HTML5", "CSS3", "Tailwind CSS", "jQuery",
  ],
  Backend: ["Node.js", "NestJS", "PHP", "Laravel", "Python", "GraphQL", "Kafka"],
  Databases: ["MySQL", "PostgreSQL", "MongoDB", "Firebase"],
  ORMs: ["TypeORM", "Prisma"],
  "DevOps & Tools": [
    "Docker", "Kubernetes", "Jenkins", "SonarQube",
    "Git", "GitLab", "Amazon S3", "Slack",
  ],
};

const DOT_COLORS: Record<string, string> = {
  Frontend: "#8b5cf6",
  Backend: "#06b6d4",
  Databases: "#ec4899",
  ORMs: "#10b981",
  "DevOps & Tools": "#f59e0b",
  "DevOps & Cloud": "#f59e0b",
  "Tools & Collaboration": "#10b981",
};

/** Rotating colors for admin-created categories. */
const EXTRA_COLORS = ["#f43f5e", "#14b8a6", "#a855f7", "#3b82f6"];

function dotColorFor(category: string, index: number): string {
  return DOT_COLORS[category] ?? EXTRA_COLORS[index % EXTRA_COLORS.length];
}

function fallbackGroups(): SkillGroup[] {
  return Object.entries(fallbackData).map(([category, names]) => ({
    category,
    names,
  }));
}

export default async function TechnologiesSection() {
  let groups: SkillGroup[];

  try {
    const skills = await getSkills();
    groups = skills.length > 0 ? groupSkillsByCategory(skills) : fallbackGroups();
  } catch {
    groups = fallbackGroups();
  }

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
          {groups.map((group, idx) => (
            <div key={group.category}>
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: dotColorFor(group.category, idx) }}
                />
                <h3 className="text-sm font-semibold tracking-wider text-zinc-400 uppercase">
                  {group.category}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {group.names.map((tech) => (
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
