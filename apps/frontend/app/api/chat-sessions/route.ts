import { API_URL, buildBackendHeaders, toJsonResponse } from "@/lib/server/backend-client";

export async function GET(request: Request) {
  const response = await fetch(`${API_URL}/chat-sessions`, {
    headers: buildBackendHeaders(request)
  });

  return toJsonResponse(response);
}

export async function POST(request: Request) {
  const body = await request.text();
  const response = await fetch(`${API_URL}/chat-sessions`, {
    method: "POST",
    headers: buildBackendHeaders(request, {
      "Content-Type": "application/json"
    }),
    body
  });

  return toJsonResponse(response);
}
