import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ScrollToTop from "./components/ScrollToTop";
import VisitTracker from "./components/VisitTracker";
import { ToastProvider } from "./components/toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Akhilesh Prajapati | Full Stack Software Developer",
  description:
    "Full Stack Software Developer with 6+ years of experience in designing, developing, and deploying scalable web and mobile applications using JavaScript, TypeScript, PHP, and cloud technologies.",
  keywords: [
    "Full Stack Developer",
    "Software Developer",
    "React.js",
    "Next.js",
    "Node.js",
    "NestJS",
    "Laravel",
    "TypeScript",
    "Portfolio",
    "Akhilesh Prajapati",
  ],
  openGraph: {
    title: "Akhilesh Prajapati | Full Stack Software Developer",
    description:
      "Full Stack Developer with 6+ years of experience building scalable web and mobile applications.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} scroll-smooth`}
    >
      <body className="min-h-screen bg-background text-foreground font-sans antialiased selection:bg-cyan-500/20 selection:text-cyan-200">
        <ToastProvider>
          {children}
          <ScrollToTop />
          <VisitTracker />
        </ToastProvider>
      </body>
    </html>
  );
}
