import {
  type JobContext,
  type JobProcess,
  ServerOptions,
  cli,
  defineAgent,
  voice,
} from "@livekit/agents";
import * as silero from "@livekit/agents-plugin-silero";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { MemoryAgent } from "./memory-agent.js";

dotenv.config({ path: ".env.local" });

export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    proc.userData.vad = await silero.VAD.load();
  },
  entry: async (ctx: JobContext) => {
    const vad = ctx.proc.userData.vad! as silero.VAD;

    const session = new voice.AgentSession({
      vad,
      stt: "deepgram/nova-3",
      llm: "openai/gpt-4o",
      tts: "openai/tts-1",
    });

    // Connect to the room FIRST, then start the session
    await ctx.connect();

    await session.start({
      agent: new MemoryAgent(),
      room: ctx.room,
    });

    // Wait for a remote participant before greeting
    const participant =
      ctx.room.remoteParticipants.size > 0
        ? [...ctx.room.remoteParticipants.values()][0]
        : await new Promise<any>((resolve) => {
            ctx.room.once("participantConnected", resolve);
          });

    session.generateReply({
      instructions:
        "Greet the user warmly. Tell them you're SceneForge — you can help them explore their past memories as immersive 3D worlds. Ask them what memory they'd like to relive, like 'What was I doing on December 1st, 2009?' or 'Show me my vacation photos.'",
    });
  },
});

cli.runApp(
  new ServerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: "sceneforge",
  })
);
