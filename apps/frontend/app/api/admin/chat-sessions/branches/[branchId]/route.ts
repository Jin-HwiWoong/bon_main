import { API_URL, buildBackendHeaders, toJsonResponse } from "@/lib/server/backend-client";

type Params = {
  params: Promise<{
    branchId: string
  }>
}

export async function GET(request: Request, { params }: Params) {
  const { branchId } = await params;
  const response = await fetch(`${API_URL}/admin/chat-sessions/branches/${branchId}`, {
    headers: buildBackendHeaders(request)
  });

  return toJsonResponse(response);
}
