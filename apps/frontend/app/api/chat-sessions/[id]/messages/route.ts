import { API_URL, buildBackendHeaders, toJsonResponse } from "@/lib/server/backend-client";

type Params = {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const response = await fetch(`${API_URL}/chat-sessions/${id}/messages`, {
    headers: buildBackendHeaders(request)
  });

  return toJsonResponse(response);
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.text();
  const response = await fetch(`${API_URL}/chat-sessions/${id}/messages`, {
    method: "POST",
    headers: buildBackendHeaders(request, {
      "Content-Type": "application/json"
    }),
    body
  });

  return toJsonResponse(response);
}
