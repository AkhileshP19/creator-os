import { ArrowDown, Check, RotateCcw } from "lucide-react";
import { Screenshot, SectionIntro } from "./shared";

export function GenerationSection() {
  return <section className="landing-section landing-container">
    <div className="landing-section-heading"><SectionIntro eyebrow="01 / Create with context" title="AI generation with structure behind it.">An idea becomes a script with a hook, narration, timing, and scene-by-scene visual direction. Then the video-generation workflow brings it to life.</SectionIntro><p className="landing-side-note">A production workflow.<br />From the first line to the final frame.</p></div>
    <div className="landing-generation-pair"><div><div className="landing-panel-label"><span>01</span> Structured script</div><Screenshot name="script" caption="Hook, narration, and scene direction" focus /></div><div><div className="landing-panel-label"><span>02</span> Generated video</div><Screenshot name="video" caption="The generated short, ready for review" focus /></div></div>
    <div className="landing-pipeline"><SectionIntro eyebrow="Keep the work connected" title="A pipeline, not a pile of files.">Ideas, generation states, scripts, and videos live together. Pick up where each content item left off, with its next action in reach.</SectionIntro><Screenshot name="pipeline" caption="Follow each content item through its lifecycle" /></div>
  </section>;
}

export function ReviewSection() {
  return <section className="landing-section landing-review"><div className="landing-container">
    <div className="landing-section-heading"><SectionIntro eyebrow="02 / Make the call" title="Automate creation without giving up control.">Watch the result before it moves to publishing. Approve a video that’s ready, or reject it and send it back through regeneration.</SectionIntro><div className="landing-review-decisions"><p><Check size={18} aria-hidden="true" /> Ready? Approve and move forward.</p><p><RotateCcw size={18} aria-hidden="true" /> Not quite? Regenerate and review again.</p></div></div>
    <Screenshot name="review" caption="Your judgment is part of the workflow" />
  </div></section>;
}

export function PublishingSection() {
  return <section className="landing-section landing-container">
    <SectionIntro eyebrow="03 / See it through" title="From approved to live.">Choose when approved content should go live, confirm the publishing details, and carry it through the YouTube publishing queue.</SectionIntro>
    <div className="landing-publishing-grid"><div><Screenshot name="schedule" caption="Approved content is ready to schedule" /><p className="landing-publishing-note"><ArrowDown size={18} aria-hidden="true" /> Approval comes before publishing.</p></div><div><Screenshot name="publishing" caption="Track publication and open the live video" /></div></div>
    <details className="landing-settings"><summary>Connected to your channel <span>Explore connection settings</span></summary><p>Keep your YouTube connection in the workspace. View the connected channel, reconnect authorization, or disconnect it from settings.</p><Screenshot name="settings" caption="Your YouTube channel connection" /></details>
  </section>;
}
