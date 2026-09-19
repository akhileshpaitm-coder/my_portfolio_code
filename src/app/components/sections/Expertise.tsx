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

export default function ExpertiseSection() {
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
