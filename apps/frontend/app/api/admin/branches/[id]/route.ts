import { API_URL, buildBackendHeaders, toJsonResponse } from "@/lib/server/backend-client";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const response = await fetch(`${API_URL}/admin/branches/${id}`, {
    method: "PATCH",
    headers: buildBackendHeaders(request, {
      "Content-Type": "application/json"
    }),
    body: JSON.stringify(body)
  });

  return toJsonResponse(response);
}
