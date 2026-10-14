import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Cog, Maximize2 } from "lucide-react";

const screenshots = {
  dashboard: { width: 1366, height: 642, path: "/01-dashboard.PNG", alt: "CreatorOS dashboard with projects, content activity, and pending creator reviews" },
  pipeline: { width: 1366, height: 646, path: "/01-content-pipeline.PNG", alt: "Content pipeline with draft, in-progress, and completed items linked to scripts and videos" },
  script: { width: 1365, height: 646, path: "/03-generated-script.PNG", alt: "Generated script with a hook, narration, duration, and scene-by-scene visual direction" },
  video: { width: 1366, height: 641, path: "/04-generated-video.PNG", alt: "Generated short-form video explaining how a phone screen detects a finger" },
  review: { width: 1366, height: 641, path: "/05-creator-review.PNG", alt: "Creator review workspace with video previews and Approve and Reject controls" },
  schedule: { width: 1366, height: 639, path: "/06-schedule-youtube.PNG", alt: "Approved video with the Schedule on YouTube action" },
  publishing: { width: 1366, height: 645, path: "/07-publishing-queue.PNG", alt: "YouTube publishing queue showing published videos, scheduled dates, and links to YouTube" },
  settings: { width: 1366, height: 643, path: "/08-project-settings.PNG", alt: "YouTube connection settings with a connected channel and authorization controls" },
};

export function Brand() {
  return <Link href="/" className="landing-brand" aria-label="CreatorOS home"><span className="landing-brand-icon"><Cog size={21} aria-hidden="true" /></span><span>Creator<span className="landing-accent">OS</span></span></Link>;
}

export function StartLink({ light = false }: { light?: boolean }) {
  return <Link className={`landing-button ${light ? "landing-button-light" : "landing-button-primary"}`} href="/sign-up">Start creating <ArrowRight size={16} aria-hidden="true" /></Link>;
}

export function Screenshot({ name, caption, focus = false, eager = false }: {
  name: keyof typeof screenshots; caption: string; focus?: boolean; eager?: boolean;
}) {
  const asset = screenshots[name];
  return <figure className={`landing-screenshot ${focus ? "landing-screenshot-focus" : ""}`}>
    <a href={asset.path} target="_blank" rel="noopener noreferrer" className="landing-image-link" aria-label={`${caption}: open full-size screenshot in a new tab`}>
      <Image src={asset.path} width={asset.width} height={asset.height} alt={asset.alt} sizes={focus ? "(max-width: 767px) 1400px, 1600px" : "(max-width: 767px) 100vw, (max-width: 1279px) 92vw, 1200px"} loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : "auto"} />
    </a>
    <figcaption><span>{caption}</span><a href={asset.path} target="_blank" rel="noopener noreferrer" aria-label={`View ${caption.toLowerCase()} full size in a new tab`}><Maximize2 size={13} aria-hidden="true" /> <span>View full size</span></a></figcaption>
  </figure>;
}

export function SectionIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <div className="landing-intro"><p className="landing-eyebrow">{eyebrow}</p><h2>{title}</h2><p className="landing-description">{children}</p></div>;
}

