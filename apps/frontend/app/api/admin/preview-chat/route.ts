import { API_URL, buildBackendHeaders, toJsonResponse } from "@/lib/server/backend-client";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const response = await fetch(`${API_URL}/admin/preview-chat`, {
            method: 'POST',
            headers: buildBackendHeaders(request, { 'Content-Type': 'application/json' }),
            body: JSON.stringify(body),
        });
        return toJsonResponse(response);
    } catch (error) {
        console.error("Preview chat proxy error:", error);
        return Response.json({ ok: false, message: "Internal Server Error" }, { status: 500 });
    }
}
