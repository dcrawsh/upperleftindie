import {
  AiProviderError,
  parseJsonContent,
  withTimeout,
  type AiProvider,
  type StructuredRequest,
} from "../types";

type OllamaChatResponse = {
  message?: { content?: string };
  error?: string;
};

const UNAVAILABLE_HINT =
  "Could not reach local AI. Make sure Ollama is running on this Mac.";

/**
 * Local Ollama. Supports JSON-schema constrained output natively via `format`.
 */
export function createOllamaProvider(): AiProvider {
  const baseUrl = (
    process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434"
  ).replace(/\/$/, "");
  const model = process.env.OLLAMA_MODEL ?? "qwen3.5:4b-q4_K_M";
  const timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS ?? "90000");

  return {
    id: "ollama",
    model,
    unavailableHint: UNAVAILABLE_HINT,

    async generateStructured(request: StructuredRequest) {
      return withTimeout(timeoutMs, UNAVAILABLE_HINT, async (signal) => {
        const response = await fetch(`${baseUrl}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: request.system },
              ...request.messages,
            ],
            stream: false,
            think: false,
            format: request.schema.schema,
            options: {
              temperature: request.temperature ?? 0.25,
              num_predict: request.maxOutputTokens ?? 500,
            },
            keep_alive: "10m",
          }),
          signal: request.signal ?? signal,
          cache: "no-store",
        });

        const body = (await response
          .json()
          .catch(() => ({}))) as OllamaChatResponse;

        if (!response.ok) {
          throw new AiProviderError(
            body.error || `Local AI request failed with ${response.status}`,
            response.status
          );
        }

        return {
          json: parseJsonContent(body.message?.content),
          provider: "ollama",
          model,
        };
      });
    },
  };
}
