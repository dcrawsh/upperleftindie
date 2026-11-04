import { createAnthropicProvider } from "./providers/anthropic";
import { createOllamaProvider } from "./providers/ollama";
import { createOpenAiProvider } from "./providers/openai";
import { AiProviderError, type AiProvider } from "./types";

export * from "./types";

const factories = {
  ollama: createOllamaProvider,
  openai: createOpenAiProvider,
  anthropic: createAnthropicProvider,
} satisfies Record<string, () => AiProvider>;

export type AiProviderId = keyof typeof factories;

export const AI_PROVIDER_IDS = Object.keys(factories) as AiProviderId[];

/**
 * Resolve the configured provider.
 *
 * Defaults to Ollama so an operator with nothing set up keeps today's
 * local-only behaviour. Set AI_PROVIDER to switch. A blank value is treated as
 * unset — an empty `AI_PROVIDER=` line in .env.local is a configuration
 * accident, not a request for a provider named "".
 */
export function getAiProvider(id?: string) {
  const requested = (id ?? process.env.AI_PROVIDER ?? "").trim().toLowerCase();
  const normalized = requested || "ollama";
  const factory = factories[normalized as AiProviderId];

  if (!factory) {
    throw new AiProviderError(
      `Unknown AI provider "${normalized}". Set AI_PROVIDER to one of: ${AI_PROVIDER_IDS.join(", ")}.`,
      500
    );
  }

  return factory();
}
