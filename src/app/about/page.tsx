import type { Metadata } from "next";
import { SiteNavbar, SiteFooter } from "@/app/components/PageChrome";
import AboutSection from "@/app/components/sections/About";

export const metadata: Metadata = {
  title: "About | Akhilesh Prajapati",
  description:
    "Full Stack Software Developer with 6+ years of experience building scalable, secure, and high-performance web and mobile applications.",
};

export default function AboutPage() {
  return (
    <main className="bg-background">
      <SiteNavbar active="/about" />
      <div className="pt-28">
        <AboutSection />
      </div>
      <SiteFooter />
    </main>
  );
}
