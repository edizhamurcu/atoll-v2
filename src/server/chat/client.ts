import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { ModelCall } from "./engine";
import type { ChatConfig } from "./config";

let client: Anthropic | null = null;

/** Official SDK, key only from the server environment. Retries are kept low: the visitor is waiting. */
export function anthropicCall(cfg: ChatConfig): ModelCall {
  client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 1, timeout: cfg.timeoutMs });
  return async (params, onText, signal) => {
    const stream = client!.messages.stream(params, { signal, timeout: cfg.timeoutMs });
    stream.on("text", onText);
    return stream.finalMessage();
  };
}
