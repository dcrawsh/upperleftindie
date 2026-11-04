import {
  AiProviderError,
  withTimeout,
  type AiProvider,
  type StructuredRequest,
} from "../types";

type AnthropicContentBlock = {
  type: string;
  name?: string;
  input?: unknown;
};

type AnthropicMessagesResponse = {
  content?: AnthropicContentBlock[];
  error?: { message?: string };
};

const UNAVAILABLE_HINT = "Could not reach Anthropic.";

/**
 * Anthropic Messages API.
 *
 * Anthropic has no native JSON-schema response format, so structured output is
 * obtained by declaring a single tool whose `input_schema` is the desired shape
 * and forcing its use with `tool_choice`. The model's tool input *is* the
 * result, so unlike the other providers there is no JSON string to parse.
 */
export function createAnthropicProvider(): AiProvider {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const baseUrl = (
    process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com/v1"
  ).replace(/\/$/, "");
  const model = process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-latest";
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS ?? "60000");

  return {
    id: "anthropic",
    model,
    unavailableHint: UNAVAILABLE_HINT,

    async generateStructured(request: StructuredRequest) {
      if (!apiKey) {
        throw new AiProviderError(
          "Anthropic is not configured. Set ANTHROPIC_API_KEY.",
          500
        );
      }

      return withTimeout(timeoutMs, UNAVAILABLE_HINT, async (signal) => {
        const toolName = request.schema.name;

        const response = await fetch(`${baseUrl}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model,
            // Required by the Messages API, unlike the other providers.
            max_tokens: request.maxOutputTokens ?? 1000,
            temperature: request.temperature ?? 0.25,
            system: request.system,
            messages: request.messages,
            tools: [
              {
                name: toolName,
                description: "Return the drafted reply.",
                input_schema: request.schema.schema,
              },
            ],
            tool_choice: { type: "tool", name: toolName },
          }),
          signal: request.signal ?? signal,
          cache: "no-store",
        });

        const body = (await response
          .json()
          .catch(() => ({}))) as AnthropicMessagesResponse;

        if (!response.ok) {
          throw new AiProviderError(
            body.error?.message ||
              `Anthropic request failed with ${response.status}`,
            response.status
          );
        }

        const toolUse = body.content?.find(
          (block) => block.type === "tool_use" && block.name === toolName
        );

        if (!toolUse || toolUse.input === undefined) {
          throw new AiProviderError("AI returned an empty draft.");
        }

        return { json: toolUse.input, provider: "anthropic", model };
      });
    },
  };
}
