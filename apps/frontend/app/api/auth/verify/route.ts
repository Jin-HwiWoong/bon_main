import { buildBackendHeaders, API_URL, toJsonResponse } from "@/lib/server/backend-client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { mode, password, identifier } = body;
        const targetPath = mode === "admin" ? "/auth/admin/login" : "/auth/branch/login";
        const payload =
            mode === "admin"
                ? { username: identifier, password }
                : { codeOrName: identifier, password };

        const response = await fetch(`${API_URL}${targetPath}`, {
            method: "POST",
            headers: buildBackendHeaders(request, {
                "Content-Type": "application/json",
            }),
            body: JSON.stringify(payload),
        });
        return toJsonResponse(response);
    } catch (error) {
        console.error("Auth proxy error:", error);
        return NextResponse.json({ ok: false, message: "Internal Server Error" }, { status: 500 });
    }
}
