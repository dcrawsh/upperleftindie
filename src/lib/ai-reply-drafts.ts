import { isSupabaseConfigured, supabaseRequest } from "@/lib/supabase";

export type AiReplyInputSnapshot = {
  contactName: string;
  artistName: string;
  trackTitle: string;
  city: string;
  region: string;
  genre: string;
  submissionNotes: string;
  playlistUrl: string;
};

export type AiReplyExample = {
  input: AiReplyInputSnapshot;
  subject: string;
  message: string;
};

type AiReplyDraftRow = {
  id: string;
  input_snapshot: AiReplyInputSnapshot;
  final_subject: string | null;
  final_message: string | null;
};

export class AiReplyDraftStoreError extends Error {
  constructor(
    message: string,
    readonly status = 500
  ) {
    super(message);
  }
}

async function aiReplyDraftRequest<T>(
  path: string,
  init: RequestInit & { prefer?: string } = {}
): Promise<T> {
  // Callers of this store only narrow on AiReplyDraftStoreError, so the
  // unconfigured case must not surface as a bare SupabaseRequestError.
  if (!isSupabaseConfigured()) {
    throw new AiReplyDraftStoreError("Supabase is not configured.");
  }

  return supabaseRequest<T>(path, {
    ...init,
    mapError: (status, details) => {
      const missingTable = status === 404 || details.includes("ai_reply_drafts");

      return new AiReplyDraftStoreError(
        missingTable
          ? "AI reply training storage is not installed. Run supabase/ai-reply-drafts.sql."
          : details || `AI reply storage failed with ${status}`,
        status
      );
    },
  });
}

export async function listPositiveAiReplyExamples(limit = 2) {
  const rows = await aiReplyDraftRequest<AiReplyDraftRow[]>(
    `ai_reply_drafts?select=input_snapshot,final_subject,final_message&status=eq.sent&rating=eq.1&final_message=not.is.null&order=sent_at.desc&limit=${limit}`
  );

  return rows.flatMap((row): AiReplyExample[] => {
    if (!row.final_subject || !row.final_message) {
      return [];
    }

    return [
      {
        input: row.input_snapshot,
        subject: row.final_subject,
        message: row.final_message,
      },
    ];
  });
}

export async function createAiReplyDraft(values: {
  submissionId: string;
  model: string;
  promptVersion: string;
  generationSettings: Record<string, unknown>;
  inputSnapshot: AiReplyInputSnapshot;
  generatedSubject: string;
  generatedMessage: string;
}) {
  const rows = await aiReplyDraftRequest<AiReplyDraftRow[]>("ai_reply_drafts", {
    method: "POST",
    prefer: "return=representation",
    body: JSON.stringify({
      submission_id: values.submissionId,
      model: values.model,
      prompt_version: values.promptVersion,
      generation_settings: values.generationSettings,
      input_snapshot: values.inputSnapshot,
      generated_subject: values.generatedSubject,
      generated_message: values.generatedMessage,
    }),
  });

  const draft = rows[0];
  if (!draft) {
    throw new AiReplyDraftStoreError("AI reply draft was not saved.");
  }

  return draft;
}

export async function completeAiReplyDraft(values: {
  id: string;
  submissionId: string;
  finalSubject: string;
  finalMessage: string;
}) {
  await aiReplyDraftRequest(
    `ai_reply_drafts?id=eq.${encodeURIComponent(values.id)}&submission_id=eq.${encodeURIComponent(values.submissionId)}`,
    {
      method: "PATCH",
      prefer: "return=minimal",
      body: JSON.stringify({
        final_subject: values.finalSubject,
        final_message: values.finalMessage,
        status: "sent",
        sent_at: new Date().toISOString(),
      }),
    }
  );
}

export async function discardAiReplyDraft(id: string) {
  await aiReplyDraftRequest(
    `ai_reply_drafts?id=eq.${encodeURIComponent(id)}&status=eq.draft`,
    {
      method: "PATCH",
      prefer: "return=minimal",
      body: JSON.stringify({ status: "discarded" }),
    }
  );
}

export async function rateAiReplyDraft(values: {
  id: string;
  rating: -1 | 0 | 1;
  feedbackTags: string[];
}) {
  await aiReplyDraftRequest(
    `ai_reply_drafts?id=eq.${encodeURIComponent(values.id)}`,
    {
      method: "PATCH",
      prefer: "return=minimal",
      body: JSON.stringify({
        rating: values.rating,
        feedback_tags: values.feedbackTags,
      }),
    }
  );
}
