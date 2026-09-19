import type { Metadata } from "next";
import { SiteNavbar, SiteFooter } from "@/app/components/PageChrome";
import ProjectsSection from "@/app/components/sections/Projects";

export const metadata: Metadata = {
  title: "Projects | Akhilesh Prajapati",
  description:
    "Featured work — enterprise CRM, e-commerce, ERP, cloud analytics, healthcare and real-time systems.",
};

export default function ProjectsPage() {
  return (
    <main className="bg-background">
      <SiteNavbar active="/projects" />
      <div className="pt-28">
        <ProjectsSection />
      </div>
      <SiteFooter />
    </main>
  );
}
