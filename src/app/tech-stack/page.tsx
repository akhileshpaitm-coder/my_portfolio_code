import type { Metadata } from "next";
import { SiteNavbar, SiteFooter } from "@/app/components/PageChrome";
import TechnologiesSection from "@/app/components/sections/Technologies";

export const metadata: Metadata = {
  title: "Tech Stack | Akhilesh Prajapati",
  description:
    "Technologies and frameworks used to build production-ready applications.",
};

export default function TechStackPage() {
  return (
    <main className="bg-background">
      <SiteNavbar active="/tech-stack" />
      <div className="pt-28">
        <TechnologiesSection />
      </div>
      <SiteFooter />
    </main>
  );
}
