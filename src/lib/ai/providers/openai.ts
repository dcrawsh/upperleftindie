import {
  AiProviderError,
  parseJsonContent,
  withTimeout,
  type AiProvider,
  type StructuredRequest,
} from "../types";

type OpenAiChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

const UNAVAILABLE_HINT = "Could not reach OpenAI.";

/**
 * OpenAI chat completions with strict structured output.
 *
 * `strict: true` requires every property to appear in `required` and
 * `additionalProperties: false` to be set — the reply schema already satisfies
 * both, but a schema change that forgets either will be rejected by the API.
 */
export function createOpenAiProvider(): AiProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = (
    process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS ?? "60000");

  return {
    id: "openai",
    model,
    unavailableHint: UNAVAILABLE_HINT,

    async generateStructured(request: StructuredRequest) {
      if (!apiKey) {
        throw new AiProviderError(
          "OpenAI is not configured. Set OPENAI_API_KEY.",
          500
        );
      }

      return withTimeout(timeoutMs, UNAVAILABLE_HINT, async (signal) => {
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: request.system },
              ...request.messages,
            ],
            temperature: request.temperature ?? 0.25,
            max_tokens: request.maxOutputTokens ?? 500,
            response_format: {
              type: "json_schema",
              json_schema: {
                name: request.schema.name,
                schema: request.schema.schema,
                strict: true,
              },
            },
          }),
          signal: request.signal ?? signal,
          cache: "no-store",
        });

        const body = (await response
          .json()
          .catch(() => ({}))) as OpenAiChatResponse;

        if (!response.ok) {
          throw new AiProviderError(
            body.error?.message || `OpenAI request failed with ${response.status}`,
            response.status
          );
        }

        return {
          json: parseJsonContent(body.choices?.[0]?.message?.content),
          provider: "openai",
          model,
        };
      });
    },
  };
}
