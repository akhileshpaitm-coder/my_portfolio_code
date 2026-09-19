import type { Metadata } from "next";
import { SiteNavbar, SiteFooter } from "@/app/components/PageChrome";
import ExpertiseSection from "@/app/components/sections/Expertise";

export const metadata: Metadata = {
  title: "Expertise | Akhilesh Prajapati",
  description:
    "Core technical expertise across the full development lifecycle — from architecture to deployment.",
};

export default function ExpertisePage() {
  return (
    <main className="bg-background">
      <SiteNavbar active="/expertise" />
      <div className="pt-28">
        <ExpertiseSection />
      </div>
      <SiteFooter />
    </main>
  );
}
