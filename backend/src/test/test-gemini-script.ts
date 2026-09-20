import "dotenv/config";

import { generateScript } from "../services/gemini-service.js";
import type { ScriptGenerationInput } from "../types/ai-workflow-types.js";

async function testGeminiScriptGeneration(): Promise<void> {
  const input: ScriptGenerationInput = {
    topic: "Vending Machines vs Sharks",
    fact: `Vending machines kill more people per year than sharks.
Globally, sharks are responsible for an average of five to six fatal attacks
per year. Vending machines kill roughly thirteen people annually — mostly
from people rocking or tipping them trying to free stuck snacks, causing the
machines to fall on them.`,
    channelName: "Everything Around You",
    durationSeconds: 10,
    aspectRatio: "9:16",
  };

  try {
    console.log("Generating script with Gemini...");

    const script = await generateScript(input);

    console.log("Script generated successfully:");
    console.dir(script, {
      depth: null,
    });
  } catch (error: unknown) {
    console.error("Gemini script generation failed:");

    if (error instanceof Error) {
      console.error(error.message);
      return;
    }

    console.error(error);
  }
}

void testGeminiScriptGeneration();