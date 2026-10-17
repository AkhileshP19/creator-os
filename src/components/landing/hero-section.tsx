import { Play, Check } from "lucide-react";
import { Screenshot, StartLink } from "./shared";

export function HeroSection() {
  return <section id="product" className="landing-hero landing-container" aria-labelledby="hero-title">
    <div className="landing-hero-copy">
      <p className="landing-eyebrow"><span className="landing-dot" /> AI-powered content operations</p>
      <h1 id="hero-title">From content idea<br className="landing-desktop-break" /> to published video.<span>One intelligent workflow.</span></h1>
      <p className="landing-description">Your workspace for short-form content. Bring ideas, AI script generation, video creation, creator review, and YouTube publishing into one connected workflow.</p>
      <div className="landing-actions"><StartLink /><a className="landing-button landing-button-secondary" href="#demo"><Play size={16} aria-hidden="true" /> Watch product demo</a></div>
      <p className="landing-hero-note"><Check size={15} aria-hidden="true" /> Generate with AI. Review before publishing. Stay in control.</p>
    </div>
    <div className="landing-hero-visual"><Screenshot name="dashboard" caption="Your content operation, in one workspace" eager /></div>
  </section>;
}
