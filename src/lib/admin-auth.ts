import { NextRequest } from "next/server";

export class AdminAuthError extends Error {
  status = 401;
}

export function assertAdminRequest(req: NextRequest) {
  const expectedToken = process.env.ADMIN_API_TOKEN ?? process.env.ADMIN_PASSWORD;

  if (!expectedToken) {
    const error = new AdminAuthError(
      "Admin access is not configured. Set ADMIN_PASSWORD or ADMIN_API_TOKEN."
    );
    error.status = 500;
    throw error;
  }

  const authorization = req.headers.get("authorization") ?? "";
  const bearerToken = authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim()
    : "";
  const providedToken = req.headers.get("x-admin-token") ?? bearerToken;

  if (providedToken !== expectedToken) {
    throw new AdminAuthError("Admin password is incorrect.");
  }
}
