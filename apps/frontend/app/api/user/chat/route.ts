import { API_URL, buildBackendHeaders, toJsonResponse } from "@/lib/server/backend-client";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const response = await fetch(`${API_URL}/user/chat`, {
            method: 'POST',
            headers: buildBackendHeaders(request, { 'Content-Type': 'application/json' }),
            body: JSON.stringify(body),
        });
        return toJsonResponse(response);
    } catch (error: unknown) {
        console.error("Chat proxy error:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return Response.json({ ok: false, message: `Proxy Error: ${errorMessage}` }, { status: 500 });
    }
}
