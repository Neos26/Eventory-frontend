// localStorage helpers for the auth token. Kept separate from the axios
// client so neither module has to import the other (avoids cycles).

const TOKEN_KEY = 'eventory_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
