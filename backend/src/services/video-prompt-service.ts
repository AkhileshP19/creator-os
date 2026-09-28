import type {
    VideoGenerationInput,
} from "../types/ai-workflow-types.js";

export function buildVideoPrompt(
    input: VideoGenerationInput,
): string {
    const scenes = input.scenes
        .map(
            (scene) => `
Scene ${scene.sceneNumber}
Duration: ${scene.durationSeconds} seconds
Visual: ${scene.visualDescription}
Voiceover: ${scene.voiceover}
On-screen text: ${scene.onScreenText}
`,
        )
        .join("\n");

    return `
Generate the FINAL VIDEO immediately using the finalized production specification below.

IMPORTANT EXECUTION INSTRUCTIONS:
- Generate the final video now.
- Do not create a storyboard.
- Do not create reference images.
- Do not generate images before generating the video.
- Do not rewrite or expand the script.
- Do not ask whether the storyboard or breakdown is acceptable.
- Do not ask for confirmation.
- Do not ask clarification questions.
- Do not propose a plan.
- Do not wait for further instructions.
- The production specification below is already finalized and approved.
- Proceed directly to final video generation.

TITLE:
${input.title}

HOOK:
${input.hook}

NARRATION:
${input.narration}

TARGET DURATION:
${input.durationSeconds} seconds

ASPECT RATIO:
${input.aspectRatio}

SCENES:
${scenes}

IMPORTANT KEYWORDS:
${input.keywords.join(", ")}

CALL TO ACTION:
${input.callToAction}

FINAL VIDEO REQUIREMENTS:
- Generate exactly one final video.
- Follow the supplied scene order.
- Follow the supplied narration.
- Follow the visual descriptions closely.
- Preserve subject consistency across scenes.
- Use realistic cinematic visuals.
- Use natural camera movement.
- Keep the pacing fast and engaging.
- Optimize everything for 9:16 mobile viewing.
- Include appropriate native audio.
- Do not add additional facts.
- Do not add additional scenes.

Begin final video generation immediately.
`;
}