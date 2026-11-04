import { afterEach, describe, expect, it, vi } from "vitest";
import { getAiProvider, AI_PROVIDER_IDS, AiProviderError } from "@/lib/ai";
import { createOllamaProvider } from "@/lib/ai/providers/ollama";
import { createOpenAiProvider } from "@/lib/ai/providers/openai";
import { createAnthropicProvider } from "@/lib/ai/providers/anthropic";
import type { StructuredRequest } from "@/lib/ai/types";

const schema = {
  type: "object",
  additionalProperties: false,
  properties: { subject: { type: "string" }, message: { type: "string" } },
  required: ["subject", "message"],
};

const request: StructuredRequest = {
  system: "You are a curator.",
  messages: [{ role: "user", content: "Draft a reply." }],
  schema: { name: "acceptance_reply", schema },
  temperature: 0.25,
  maxOutputTokens: 500,
};

const draft = { subject: "Added", message: "Thanks for sending this in." };

/** Capture the outgoing request body a provider builds. */
function mockFetch(response: unknown, ok = true, status = 200) {
  const fetchMock = vi.fn(async () => ({
    ok,
    status,
    json: async () => response,
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function bodyOf(fetchMock: ReturnType<typeof mockFetch>) {
  const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
  return JSON.parse(String(call[1].body));
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("getAiProvider", () => {
  it("defaults to ollama so existing setups keep working", () => {
    vi.stubEnv("AI_PROVIDER", "");
    expect(getAiProvider().id).toBe("ollama");
  });

  it("treats a blank AI_PROVIDER as unset", () => {
    vi.stubEnv("AI_PROVIDER", "   ");
    expect(getAiProvider().id).toBe("ollama");
  });

  it("resolves each supported provider by id", () => {
    for (const id of AI_PROVIDER_IDS) {
      expect(getAiProvider(id).id).toBe(id);
    }
  });

  it("is case and whitespace insensitive", () => {
    expect(getAiProvider("  OpenAI ").id).toBe("openai");
  });

  it("throws a configuration error for an unknown provider", () => {
    expect(() => getAiProvider("gemini")).toThrow(AiProviderError);
    expect(() => getAiProvider("gemini")).toThrow(/Unknown AI provider/);
  });
});

describe("ollama provider", () => {
  it("sends the schema as `format` and reads message.content", async () => {
    const fetchMock = mockFetch({ message: { content: JSON.stringify(draft) } });

    const result = await createOllamaProvider().generateStructured(request);

    const body = bodyOf(fetchMock);
    expect(body.format).toEqual(schema);
    expect(body.stream).toBe(false);
    expect(body.options.temperature).toBe(0.25);
    // System prompt is folded into the message list for Ollama.
    expect(body.messages[0]).toEqual({
      role: "system",
      content: "You are a curator.",
    });
    expect(result.json).toEqual(draft);
    expect(result.provider).toBe("ollama");
  });

  it("surfaces the upstream error message and status", async () => {
    mockFetch({ error: "model not found" }, false, 404);

    await expect(
      createOllamaProvider().generateStructured(request)
    ).rejects.toMatchObject({ message: "model not found", status: 404 });
  });

  it("rejects malformed JSON rather than returning it", async () => {
    mockFetch({ message: { content: "not json" } });

    await expect(
      createOllamaProvider().generateStructured(request)
    ).rejects.toThrow(/malformed JSON/);
  });
});

describe("openai provider", () => {
  it("requires an API key", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    await expect(
      createOpenAiProvider().generateStructured(request)
    ).rejects.toThrow(/OPENAI_API_KEY/);
  });

  it("uses strict json_schema response format", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    const fetchMock = mockFetch({
      choices: [{ message: { content: JSON.stringify(draft) } }],
    });

    const result = await createOpenAiProvider().generateStructured(request);

    const body = bodyOf(fetchMock);
    expect(body.response_format.type).toBe("json_schema");
    expect(body.response_format.json_schema.strict).toBe(true);
    expect(body.response_format.json_schema.schema).toEqual(schema);
    expect(result.json).toEqual(draft);
  });
});

describe("anthropic provider", () => {
  it("requires an API key", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    await expect(
      createAnthropicProvider().generateStructured(request)
    ).rejects.toThrow(/ANTHROPIC_API_KEY/);
  });

  it("forces a single tool call and reads its input as the result", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    const fetchMock = mockFetch({
      content: [{ type: "tool_use", name: "acceptance_reply", input: draft }],
    });

    const result = await createAnthropicProvider().generateStructured(request);

    const body = bodyOf(fetchMock);
    // System is a top-level field here, not a message.
    expect(body.system).toBe("You are a curator.");
    expect(body.messages.some((m: { role: string }) => m.role === "system")).toBe(
      false
    );
    expect(body.tool_choice).toEqual({
      type: "tool",
      name: "acceptance_reply",
    });
    expect(body.tools[0].input_schema).toEqual(schema);
    expect(body.max_tokens).toBe(500);
    expect(result.json).toEqual(draft);
  });

  it("fails when the model answers without using the tool", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    mockFetch({ content: [{ type: "text" }] });

    await expect(
      createAnthropicProvider().generateStructured(request)
    ).rejects.toThrow(/empty draft/);
  });
});
