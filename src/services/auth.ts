import { apiFetch } from './http';

type AuthPayload = {
  email: string;
  password: string;
};

type AuthResponse = {
  message?: string;
};

type LogoutResponse = {
  message?: string;
};

export async function signIn(payload: AuthPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: payload,
  });
}

export async function register(payload: AuthPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: payload,
  });
}

export async function signOut(): Promise<LogoutResponse> {
  return apiFetch<LogoutResponse>('/api/auth/logout', {
    method: 'POST',
  });
}
