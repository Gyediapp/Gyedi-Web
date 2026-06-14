const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function setAuthCookie(token: string) {
  document.cookie = `gyedi_token=${token}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
}

export function clearAuthCookie() {
  document.cookie = 'gyedi_token=; path=/; max-age=0; SameSite=Lax';
}
