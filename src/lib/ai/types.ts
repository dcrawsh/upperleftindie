/**
 * Provider-agnostic contract for structured (JSON) LLM generation.
 *
 * The domain layer describes *what* it wants — a system prompt, a few-shot
 * conversation, and an output schema — and a provider adapter translates that
 * into one vendor's wire format. Nothing vendor-specific (Ollama's
 * `keep_alive`, OpenAI's `response_format`, Anthropic's tool-use workaround)
 * is allowed to leak above this boundary.
 */

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type JsonSchema = Record<string, unknown>;

export type StructuredRequest = {
  /**
   * System instructions. Kept separate from `messages` because Anthropic takes
   * this as a top-level parameter rather than a message role.
   */
  system: string;
  /** Few-shot examples followed by the real request. */
  messages: ChatMessage[];
  schema: {
    name: string;
    schema: JsonSchema;
  };
  temperature?: number;
  maxOutputTokens?: number;
  signal?: AbortSignal;
};

export type StructuredResult = {
  /** Parsed JSON matching the requested schema. Not validated here. */
  json: unknown;
  provider: string;
  model: string;
};

export interface AiProvider {
  /** Stable identifier persisted alongside each draft, e.g. "ollama". */
  readonly id: string;
  readonly model: string;
  /** Shown to the operator when the provider cannot be reached. */
  readonly unavailableHint: string;
  generateStructured(request: StructuredRequest): Promise<StructuredResult>;
}

export class AiProviderError extends Error {
  constructor(
    message: string,
    readonly status = 502
  ) {
    super(message);
  }
}

/** Parse a provider's text payload, failing with a consistent error. */
export function parseJsonContent(content: string | undefined | null) {
  if (!content || !content.trim()) {
    throw new AiProviderError("AI returned an empty draft.");
  }

  try {
    return JSON.parse(content) as unknown;
  } catch {
    throw new AiProviderError("AI returned malformed JSON.");
  }
}

/**
 * Run a provider call under a timeout, normalising aborts and transport
 * failures into AiProviderError.
 */
export async function withTimeout<T>(
  timeoutMs: number,
  unavailableHint: string,
  run: (signal: AbortSignal) => Promise<T>
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await run(controller.signal);
  } catch (error) {
    if (error instanceof AiProviderError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new AiProviderError("AI draft timed out.", 504);
    }

    throw new AiProviderError(unavailableHint);
  } finally {
    clearTimeout(timer);
  }
}
