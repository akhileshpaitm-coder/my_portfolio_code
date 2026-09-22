import type { Metadata } from "next";
import { SiteNavbar, SiteFooter } from "@/app/components/PageChrome";
import ContactSection from "@/app/components/ContactSection";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Contact | Akhilesh Prajapati",
  description:
    "Get in touch — available for full-stack development projects and collaborations.",
};

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <main className="bg-background">
      <SiteNavbar active="/contact" />

      <div className="pt-28">
        <ContactSection
          email={settings.contact_email}
          location={settings.contact_location}
          availability={settings.contact_availability}
          responseNote={settings.contact_response_note}
        />
      </div>

      <SiteFooter />
    </main>
  );
}