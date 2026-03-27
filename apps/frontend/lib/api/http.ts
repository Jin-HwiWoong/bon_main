type ApiErrorPayload = {
  ok?: false;
  message?: string;
};

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: unknown
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

function toErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as ApiErrorPayload).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallback;
}

export async function apiRequest<T>(
  input: string,
  init?: RequestInit,
  fallbackMessage = "요청 처리 중 오류가 발생했습니다."
): Promise<T> {
  const response = await fetch(input, init);
  const payload = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiClientError(toErrorMessage(payload, fallbackMessage), response.status, payload);
  }

  return payload as T;
}

export async function apiGet<T>(input: string, init?: RequestInit, fallbackMessage?: string) {
  return apiRequest<T>(input, { ...init, method: "GET" }, fallbackMessage);
}

export async function apiPost<T>(
  input: string,
  body?: unknown,
  init?: RequestInit,
  fallbackMessage?: string
) {
  return apiRequest<T>(
    input,
    {
      ...init,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...Object.fromEntries(new Headers(init?.headers).entries())
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    },
    fallbackMessage
  );
}

export async function apiPut<T>(
  input: string,
  body?: unknown,
  init?: RequestInit,
  fallbackMessage?: string
) {
  return apiRequest<T>(
    input,
    {
      ...init,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...Object.fromEntries(new Headers(init?.headers).entries())
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    },
    fallbackMessage
  );
}

export async function apiPatch<T>(
  input: string,
  body?: unknown,
  init?: RequestInit,
  fallbackMessage?: string
) {
  return apiRequest<T>(
    input,
    {
      ...init,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...Object.fromEntries(new Headers(init?.headers).entries())
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    },
    fallbackMessage
  );
}

export async function apiDelete<T>(input: string, init?: RequestInit, fallbackMessage?: string) {
  return apiRequest<T>(
    input,
    {
      ...init,
      method: "DELETE"
    },
    fallbackMessage
  );
}

export async function apiStream(
  input: string,
  body: unknown,
  fallbackMessage = "스트림 연결에 실패했습니다."
): Promise<Response & { body: ReadableStream<Uint8Array> }> {
  const response = await fetch(input, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const payload = await parseResponseBody(response);
    throw new ApiClientError(toErrorMessage(payload, fallbackMessage), response.status, payload);
  }

  if (!response.body) {
    throw new ApiClientError("응답 본문이 없습니다.", 500);
  }

  return response as Response & { body: ReadableStream<Uint8Array> };
}
