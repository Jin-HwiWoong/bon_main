export interface ApiError {
  ok: false;
  message: string;
  statusCode?: number;
  path?: string;
  timestamp?: string;
  errors?: string[];
}

export type ApiResponse<T> = T | ApiError;
