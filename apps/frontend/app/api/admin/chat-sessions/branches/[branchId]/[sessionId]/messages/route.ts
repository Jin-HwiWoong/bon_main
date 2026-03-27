import { API_URL, buildBackendHeaders, toJsonResponse } from "@/lib/server/backend-client";

type Params = {
  params: Promise<{
    branchId: string
    sessionId: string
  }>
}

export async function GET(request: Request, { params }: Params) {
  const { branchId, sessionId } = await params;
  const response = await fetch(`${API_URL}/admin/chat-sessions/branches/${branchId}/${sessionId}/messages`, {
    headers: buildBackendHeaders(request)
  });

  return toJsonResponse(response);
}
