import { getSkills, groupSkillsByCategory, type Skill, type SkillGroup } from "@/lib/skills";
import { iconForTech, luminance } from "@/lib/tech-icons";

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
  let iconBySkill = new Map<string, string | undefined>();

  try {
    const skills: Skill[] = await getSkills();
    if (skills.length > 0) {
      groups = groupSkillsByCategory(skills);
      iconBySkill = new Map(skills.map((s) => [s.name, s.icon]));
    } else {
      groups = fallbackGroups();
    }
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

        <div className="space-y-10 stagger">
          {groups.map((group, idx) => (
            <div key={group.category}>
              <div className="mb-5 flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: dotColorFor(group.category, idx) }}
                />
                <h3 className="text-sm font-semibold tracking-wider text-zinc-400 uppercase">
                  {group.category}
                </h3>
              </div>

              {/* Icon grid — brand logo above, label below (reference layout).
                  An icon explicitly chosen in the dashboard wins; otherwise the
                  registry auto-matches the skill name. */}
              <div className="grid grid-cols-4 gap-x-4 gap-y-8 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
                {group.names.map((tech) => {
                  const savedIcon = iconBySkill.get(tech);
                  const { icon: Icon, color } = iconForTech(savedIcon ?? tech);
                  // Dark brand marks (Next.js, Kafka, Prisma…) get a light
                  // circular badge so they stay visible on the dark theme —
                  // same treatment as the Next.js tile in the reference.
                  const needsBadge = luminance(color) < 0.35;
                  return (
                    <div
                      key={tech}
                      className="group flex flex-col items-center gap-3 rounded-2xl px-2 py-3 transition-all duration-300 hover:-translate-y-1 hover:bg-zinc-800/40"
                    >
                      <span
                        className={`flex h-12 w-12 items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
                          needsBadge ? "rounded-full bg-white" : ""
                        }`}
                      >
                        <Icon className="h-9 w-9" style={{ color }} />
                      </span>
                      <span className="text-center text-xs leading-tight text-zinc-400 transition-colors group-hover:text-zinc-200">
                        {tech}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
