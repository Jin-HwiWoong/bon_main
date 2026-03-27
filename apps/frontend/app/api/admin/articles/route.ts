import { API_URL, buildBackendHeaders, toJsonResponse } from "@/lib/server/backend-client";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const response = await fetch(`${API_URL}/admin/articles?${searchParams.toString()}`, {
            headers: buildBackendHeaders(request)
        });
        return toJsonResponse(response);
    } catch (error) {
        console.error("Articles proxy error:", error);
        return Response.json({ ok: false, message: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const response = await fetch(`${API_URL}/admin/articles`, {
            method: 'POST',
            headers: buildBackendHeaders(request, { 'Content-Type': 'application/json' }),
            body: JSON.stringify(body),
        });
        return toJsonResponse(response);
    } catch (error) {
        console.error("Articles create proxy error:", error);
        return Response.json({ ok: false, message: "Internal Server Error" }, { status: 500 });
    }
}
