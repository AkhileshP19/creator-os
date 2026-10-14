
import type { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { WorkflowSection } from "@/components/landing/workflow-section";
import { GenerationSection, ReviewSection, PublishingSection } from "@/components/landing/product-sections";
import { DemoSection, TechnologySection, LandingFooter } from "@/components/landing/closing-sections";
import styles from "@/components/landing/landing.module.css";

export const metadata: Metadata = {
  title: "CreatorOS — AI-Powered Content Workflow for Short-Form Creators",
  description: "CreatorOS brings content ideas, structured AI script generation, video creation, creator review, scheduling, and YouTube publishing into one connected workflow.",
};

export default function Home() {
  return <div className={styles.page}>
    <a className="landing-skip" href="#main-content">Skip to content</a>
    <LandingNavbar />
    <main id="main-content" tabIndex={-1}>
      <HeroSection /><WorkflowSection /><GenerationSection /><ReviewSection />
      <PublishingSection /><DemoSection /><TechnologySection />
    </main>
    <LandingFooter />
  </div>;
}
