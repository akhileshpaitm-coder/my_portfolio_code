export default function AboutSection() {
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
