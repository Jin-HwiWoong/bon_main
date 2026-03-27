import { API_URL, buildBackendHeaders, toJsonResponse } from "@/lib/server/backend-client";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const response = await fetch(`${API_URL}/admin/categories/${id}`, {
            method: 'PUT',
            headers: buildBackendHeaders(request, { 'Content-Type': 'application/json' }),
            body: JSON.stringify(body),
        });
        return toJsonResponse(response);
    } catch (error) {
        console.error("Category update proxy error:", error);
        return Response.json({ ok: false, message: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const response = await fetch(`${API_URL}/admin/categories/${id}`, {
            method: 'DELETE',
            headers: buildBackendHeaders(request)
        });
        return toJsonResponse(response);
    } catch (error) {
        console.error("Category delete proxy error:", error);
        return Response.json({ ok: false, message: "Internal Server Error" }, { status: 500 });
    }
}
