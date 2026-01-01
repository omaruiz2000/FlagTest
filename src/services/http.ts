export type ApiFetchOptions = {
  method?: string;
  body?: Record<string, unknown> | FormData | null;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export class ApiError extends Error {
  status?: number;
  data?: unknown;

  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== 'undefined' && value instanceof FormData;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  // Fallback for empty bodies or non-JSON
  return undefined as T;
}

export async function apiFetch<T = unknown>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { method = 'GET', body = null, headers = {}, signal } = options;
  const init: RequestInit = { method, headers: { ...headers }, signal };

  if (body !== null && body !== undefined) {
    if (isFormData(body)) {
      init.body = body;
    } else {
      init.body = JSON.stringify(body);
      init.headers = { 'content-type': 'application/json', ...init.headers };
    }
  }

  const response = await fetch(path, init);
  if (!response.ok) {
    let message = 'Request failed';
    let data: unknown;
    try {
      data = await parseResponse<{ error?: string; message?: string }>(response);
      const extracted = (data as any)?.error || (data as any)?.message;
      if (extracted && typeof extracted === 'string') {
        message = extracted;
      }
    } catch (error) {
      // ignore parse errors and keep default message
    }
    throw new ApiError(message, response.status, data);
  }

  return parseResponse<T>(response);
}
