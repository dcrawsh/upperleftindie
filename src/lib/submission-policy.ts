export type SubmissionPolicyErrorCode = "RICKROLL_BLOCKED";

export class SubmissionPolicyError extends Error {
  constructor(
    message: string,
    readonly code: SubmissionPolicyErrorCode,
    readonly status = 400
  ) {
    super(message);
  }
}
