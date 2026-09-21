import { getAboutParagraphs, getCoreValues, renderInlineMarkup } from "@/lib/about";
import type { AboutParagraph, CoreValue } from "@/lib/about";

/**
 * Fallback data (the original hardcoded content) — used when the tables are
 * missing (migration pending) or empty, so the public page never renders bare.
 */
const FALLBACK_PARAGRAPHS: Array<Pick<AboutParagraph, "body" | "emphasized">> = [
  {
    body: "Hello! I'm **Akhilesh Prajapati**, a passionate Full Stack Software Developer with over ==6 years of professional experience== in designing, developing, and deploying scalable, secure, and high-performance web and mobile applications.",
    emphasized: true,
  },
  {
    body: "Throughout my career, I have worked on a wide range of projects — from enterprise business applications and e-commerce platforms to CRM systems, ERP solutions, management portals, and cloud-based applications.",
    emphasized: false,
  },
  {
    body: "I specialize in both frontend and backend development, building complete end-to-end solutions. On the frontend, I create responsive, user-friendly interfaces using ==React.js, Next.js, Vue.js, React Native,== and modern CSS. On the backend, I design scalable APIs, microservices, authentication systems, and real-time applications with ==Node.js, NestJS, PHP, Laravel,== and more.",
    emphasized: false,
  },
  {
    body: "Beyond writing code, I'm passionate about ==DevOps, automation, CI/CD pipelines, containerization with Docker & Kubernetes,== and maintaining high code quality standards through testing and code reviews.",
    emphasized: false,
  },
  {
    body: "I believe in clean code, software design principles, and continuous learning. I enjoy mentoring team members, sharing knowledge, and contributing to collaborative development environments that deliver long-term value.",
    emphasized: false,
  },
];

const FALLBACK_VALUES: Array<Omit<CoreValue, "id" | "sort_order">> = [
  { icon: "🎯", title: "Clean Code", description: "Maintainable, readable, and well-documented code" },
  { icon: "🚀", title: "Performance", description: "Optimized applications for speed and scalability" },
  { icon: "🔒", title: "Security", description: "Enterprise-grade security in every solution" },
  { icon: "🤝", title: "Collaboration", description: "Agile teamwork and knowledge sharing" },
  { icon: "📚", title: "Continuous Learning", description: "Always exploring emerging technologies" },
];

export default async function AboutSection() {
  let paragraphs: AboutParagraph[];
  let values: CoreValue[];

  try {
    [paragraphs, values] = await Promise.all([
      getAboutParagraphs(),
      getCoreValues(),
    ]);
  } catch {
    // Tables not migrated yet — fall back to the hardcoded content.
    paragraphs = [];
    values = [];
  }

  const renderedParagraphs: Array<Pick<AboutParagraph, "body" | "emphasized">> =
    paragraphs.length > 0
      ? paragraphs
      : FALLBACK_PARAGRAPHS;
  const renderedValues =
    values.length > 0 ? values : FALLBACK_VALUES;

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
          <div className="min-w-0 space-y-5 break-words leading-relaxed text-zinc-400 lg:col-span-3">
            {renderedParagraphs.map((p, i) => (
              <p key={i} className={p.emphasized ? "text-lg text-zinc-300" : undefined}>
                {renderInlineMarkup(p.body)}
              </p>
            ))}
          </div>

          {/* Highlights card */}
          <div className="lg:col-span-2">
            <div className="glass rounded-2xl p-6 md:p-8">
              <h3 className="mb-6 text-lg font-semibold text-zinc-100">Core Values</h3>
              <div className="space-y-5">
                {renderedValues.map((item) => (
                  <div key={item.title} className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 text-xl">{item.icon}</span>
                    <div className="min-w-0 break-words">
                      <div className="text-sm font-medium text-zinc-200">{item.title}</div>
                      <div className="text-xs text-zinc-500">{item.description}</div>
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
