// server/src/agents/runner.ts

import { InMemoryRunner } from '@google/adk';
import { rootAgent } from './rootAgent.js';

/**
 * Runner - The ADK execution engine for our agent
 * 
 * InMemoryRunner creates and manages:
 * - InMemorySessionService: Tracks conversation history per user/session
 * - InMemoryMemoryService: Stores facts about users (future use)
 * - InMemoryArtifactService: Manages any files/images agent creates
 * 
 * We only pass in the agent and app name; everything else is automatic.
 * 
 * This single runner handles ALL users. Sessions keep each user's
 * conversation isolated.
 */
export const runner = new InMemoryRunner({
  agent: rootAgent,
  appName: 'jigger_ai',
});