import { Lightbulb, FileText, Clapperboard, CircleCheck, CalendarDays, Send, ArrowRight } from "lucide-react";
import { SectionIntro } from "./shared";

const steps = [
  { title: "Idea", text: "Capture what you want to create.", icon: Lightbulb },
  { title: "Script", text: "Build a structured production script.", icon: FileText },
  { title: "Generate", text: "Turn the script into a short-form video.", icon: Clapperboard },
  { title: "Review", text: "Approve it or send it back to regenerate.", icon: CircleCheck },
  { title: "Schedule", text: "Choose when it should go live.", icon: CalendarDays },
  { title: "Publish", text: "Carry approved content through to YouTube.", icon: Send },
];

export function WorkflowSection() {
  return <section id="workflow" className="landing-section landing-workflow"><div className="landing-container">
    <SectionIntro eyebrow="The whole journey" title="One workflow from idea to upload">Each step stays connected to the content. You decide what moves forward.</SectionIntro>
    <ol className="landing-timeline">{steps.map(({ title, text, icon: Icon }, i) => <li key={title}><div className="landing-step-icon"><Icon size={20} aria-hidden="true" /></div><span className="landing-step-number">0{i + 1}</span><h3>{title}</h3><p>{text}</p></li>)}</ol>
    <div className="landing-comparison">
      <div><p className="landing-eyebrow">Fewer handoffs</p><h2>From fragmented tools to one connected workflow.</h2><p className="landing-description">Writing, generating, moving files, reviewing, and uploading shouldn’t mean starting over in a different tool at every step.</p></div>
      <div className="landing-comparison-paths"><div><h3>The manual way</h3><p>Write a script → Copy into a video tool → Generate → Download files → Review and retry → Open YouTube → Re-enter metadata → Schedule → Check status</p></div><div className="landing-connected"><h3>With CreatorOS <ArrowRight size={18} aria-hidden="true" /></h3><p>Idea → Structured script → Video → Creator review → Approve or regenerate → Schedule → Publish</p></div></div>
    </div>
    <p className="landing-pullquote">The human stays in the loop. <span>The repetitive handoffs don’t.</span></p>
  </div></section>;
}
