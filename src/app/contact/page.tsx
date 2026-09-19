import type { Metadata } from "next";
import { SiteNavbar, SiteFooter } from "@/app/components/PageChrome";
import ContactSection from "@/app/components/ContactSection";

export const metadata: Metadata = {
  title: "Contact | Akhilesh Prajapati",
  description:
    "Get in touch — available for full-stack development projects and collaborations.",
};

export default function ContactPage() {
  return (
    <main className="bg-background">
      <SiteNavbar active="/contact" />
      <div className="pt-28">
        <ContactSection />
      </div>
      <SiteFooter />
    </main>
  );
}
