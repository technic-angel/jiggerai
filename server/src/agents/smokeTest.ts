import dotenv from 'dotenv';
import { InMemoryRunner, InMemorySessionService, LlmAgent } from '@google/adk';

dotenv.config();

async function main() {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    console.error('Missing GOOGLE_GENAI_API_KEY in environment');
    process.exit(2);
  }

  const rootAgent = new LlmAgent({
    name: 'jigger_smoke_agent',
    model: 'gemini-2.0-flash',
    description: 'Simple smoke-test agent that echoes back a short reply.',
    instruction: `You are a test agent. Reply concisely.`,
  });

  const runner = new InMemoryRunner({
    agent: rootAgent,
    appName: 'jigger_smoke',
  });

  // create a session using the runner's sessionService
  const session = await runner.sessionService.createSession({
    appName: 'jigger_smoke',
    userId: 'dev-user',
    sessionId: 'smoke-session',
  });

  console.log('Starting ADK smoke run — streaming events:');

  const events = runner.runAsync({
    sessionId: session.id,
    userId: 'dev-user',
    newMessage: { role: 'user', parts: [{ text: 'Hello from smoke test' }] },
  });

  try {
    for await (const ev of events) {
      if (ev.content?.parts) {
        for (const part of ev.content.parts) {
          if (part.text) process.stdout.write(part.text);
        }
      }
    }
    console.log('\nSmoke run complete.');
  } catch (err: any) {
    console.error('Smoke run failed:', err);
    process.exitCode = 1;
  }
}

main();
