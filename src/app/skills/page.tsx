import type { Metadata } from "next";
import { SiteNavbar, SiteFooter } from "@/app/components/PageChrome";
import TechnologiesSection from "@/app/components/sections/Technologies";

export const metadata: Metadata = {
  title: "Skills | Akhilesh Prajapati",
  description:
    "Technical skills across frontend, backend, databases, DevOps and collaboration tools.",
};

export default function SkillsPage() {
  return (
    <main className="bg-background">
      <SiteNavbar active="/skills" />
      <div className="pt-28">
        <TechnologiesSection />
      </div>
      <SiteFooter />
    </main>
  );
}
