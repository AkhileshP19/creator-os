import Link from "next/link";
import { Brand, SectionIntro, StartLink } from "./shared";

export function DemoSection() {
  return <section id="demo" className="landing-section landing-demo"><div className="landing-container">
    <SectionIntro eyebrow="The real product, in action" title="Watch an idea become a published video.">Follow the actual CreatorOS workflow through AI generation, creator review, scheduling, and final YouTube publishing.</SectionIntro>
    <video controls playsInline preload="metadata" poster="/01-dashboard.PNG" aria-label="CreatorOS product walkthrough" className="landing-video"><source src="/creatoros-video.mp4" type="video/mp4" />Your browser does not support embedded video. <a href="/creatoros-video.mp4">Download the CreatorOS product walkthrough.</a></video>
    <p className="landing-demo-caption">A recorded walkthrough of the working product. <a href="/creatoros-video.mp4">Open video directly</a></p>
  </div></section>;
}

export function TechnologySection() {
  return <section id="technology" className="landing-section landing-container landing-technology">
    <SectionIntro eyebrow="Behind the workflow" title="Multiple systems. One workflow.">CreatorOS coordinates AI generation, browser-driven video production, storage, approval, scheduling, and publishing behind a single product experience.</SectionIntro>
    <dl className="landing-tech-list">{[["Gemini", "Structured script generation"], ["Google Flow", "Browser-driven video production"], ["Backblaze B2", "Generated media storage"], ["YouTube", "Approved content publishing"]].map(([name, description]) => <div key={name}><dt>{name}</dt><dd>{description}</dd></div>)}</dl>
    <p className="landing-tech-footnote">Built with Next.js, TypeScript, Express, PostgreSQL, and a distributed browser-worker architecture.</p>
  </section>;
}

export function LandingFooter() {
  return <>
    <section className="landing-final-cta"><div className="landing-container"><p className="landing-eyebrow">Your next idea starts here</p><h2>Take an idea all the way to publish.</h2><p>Bring AI generation, creator review, scheduling, and publishing into one connected workflow.</p><div className="landing-actions"><StartLink light /><Link className="landing-button landing-button-on-primary" href="/login">Sign in</Link></div></div></section>
    <footer className="landing-container landing-footer"><div><Brand /><p>Content management and automation<br />for short-form creators.</p></div><nav aria-label="Footer navigation"><a href="#product">Product</a><a href="#workflow">Workflow</a><a href="#demo">Demo</a><a href="#technology">Technology</a><Link href="/login">Sign in</Link><Link href="/sign-up">Create account</Link></nav><p className="landing-copyright">© {new Date().getFullYear()} CreatorOS</p></footer>
  </>;
}
