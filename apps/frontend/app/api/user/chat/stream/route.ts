import { NextRequest, NextResponse } from "next/server";
import { API_URL, buildBackendHeaders } from "@/lib/server/backend-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(`${API_URL}/user/chat/stream`, {
      method: "POST",
      headers: buildBackendHeaders(request, {
        "Content-Type": "application/json",
        Accept: "text/event-stream"
      }),
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { ok: false, message: errorText || "채팅 스트림 요청에 실패했습니다." },
        { status: response.status }
      );
    }

    if (!response.body) {
      return NextResponse.json({ ok: false, message: "응답 본문이 없습니다." }, { status: 500 });
    }

    return new NextResponse(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive"
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "채팅 스트림 프록시 오류가 발생했습니다.";
    return NextResponse.json({ ok: false, message: errorMessage }, { status: 500 });
  }
}
