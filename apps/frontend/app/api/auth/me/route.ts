import { API_URL, buildBackendHeaders, toJsonResponse } from "@/lib/server/backend-client";

export async function GET(request: Request) {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: buildBackendHeaders(request)
  });

  return toJsonResponse(response);
}
