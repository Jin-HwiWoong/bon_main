import { API_URL, buildBackendHeaders, toJsonResponse } from "@/lib/server/backend-client";

export async function GET(request: Request) {
  const response = await fetch(`${API_URL}/admin/branches`, {
    headers: buildBackendHeaders(request)
  });

  return toJsonResponse(response);
}

export async function POST(request: Request) {
  const body = await request.json();
  const response = await fetch(`${API_URL}/admin/branches`, {
    method: "POST",
    headers: buildBackendHeaders(request, {
      "Content-Type": "application/json"
    }),
    body: JSON.stringify(body)
  });

  return toJsonResponse(response);
}
