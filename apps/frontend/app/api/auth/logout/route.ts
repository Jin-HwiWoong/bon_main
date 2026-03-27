import { API_URL, buildBackendHeaders, toJsonResponse } from "@/lib/server/backend-client";

export async function POST(request: Request) {
  const response = await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    headers: buildBackendHeaders(request)
  });

  return toJsonResponse(response);
}
