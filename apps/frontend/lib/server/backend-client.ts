import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function mergeHeaders(cookieHeader: string | null, extraHeaders?: HeadersInit) {
  const headers = new Headers(extraHeaders);

  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }

  return headers;
}

export function buildBackendHeaders(request: Request, extraHeaders?: HeadersInit) {
  return mergeHeaders(request.headers.get("cookie"), extraHeaders);
}

export async function fetchBackendWithServerCookies(path: string, init?: RequestInit) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: mergeHeaders(cookieHeader, init?.headers),
    cache: init?.cache ?? "no-store"
  });
}

export async function toJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  const setCookie = response.headers.get("set-cookie");

  let nextResponse: NextResponse;
  if (contentType.includes("application/json")) {
    const data = await response.json();
    nextResponse = NextResponse.json(data, { status: response.status });
  } else {
    const text = await response.text();
    nextResponse = NextResponse.json(
      { ok: false, message: text || "Backend Error" },
      { status: response.status }
    );
  }

  if (setCookie) {
    nextResponse.headers.set("set-cookie", setCookie);
  }

  return nextResponse;
}

export function toProxyErrorResponse(message = "Internal Server Error") {
  return NextResponse.json({ ok: false, message }, { status: 500 });
}
