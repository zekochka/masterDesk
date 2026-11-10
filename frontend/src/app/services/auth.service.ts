import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { User } from '../models/masterdesk.models';

interface AuthResponse { token: string; user: User }

export function apiError(error: unknown, fallback: string): Error {
  if (error instanceof HttpErrorResponse) {
    return new Error(error.error?.error ?? error.error?.message ?? fallback);
  }
  return error instanceof Error ? error : new Error(fallback);
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly sessionKey = 'masterdesk-api-session';
  readonly user = signal<User | null>(this.restoreSession());
  readonly displayName = computed(() => {
    const user = this.user();
    return user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username : '';
  });

  get token(): string | null {
    return sessionStorage.getItem(this.sessionKey + '-token');
  }

  async register(username: string, password: string, confirmPassword: string): Promise<void> {
    try {
      const response = await firstValueFrom(this.http.post<AuthResponse>('/api/auth/register', {
        login: username.trim(), password, confirmPassword,
      }));
      this.startSession(response);
    } catch (error) {
      throw apiError(error, 'Не удалось зарегистрироваться');
    }
  }

  async login(username: string, password: string): Promise<void> {
    try {
      const response = await firstValueFrom(this.http.post<AuthResponse>('/api/auth/login', {
        login: username.trim(), password,
      }));
      this.startSession(response);
    } catch (error) {
      throw apiError(error, 'Не удалось войти');
    }
  }

  async refreshProfile(): Promise<void> {
    if (!this.token) return;
    try {
      const user = await firstValueFrom(this.http.get<User>('/api/auth/me'));
      this.setUser(user);
    } catch {
      this.logout();
    }
  }

  async updateProfile(profile: Pick<User, 'firstName' | 'lastName' | 'email' | 'phone'>): Promise<void> {
    try {
      const user = await firstValueFrom(this.http.put<User>('/api/users/me', profile));
      this.setUser(user);
    } catch (error) {
      throw apiError(error, 'Не удалось сохранить профиль');
    }
  }

  logout(): void {
    sessionStorage.removeItem(this.sessionKey + '-token');
    sessionStorage.removeItem(this.sessionKey + '-user');
    this.user.set(null);
  }

  private startSession(response: AuthResponse): void {
    sessionStorage.setItem(this.sessionKey + '-token', response.token);
    this.setUser(response.user);
  }

  private setUser(user: User): void {
    sessionStorage.setItem(this.sessionKey + '-user', JSON.stringify(user));
    this.user.set(user);
  }

  private restoreSession(): User | null {
    try {
      if (!this.token) return null;
      const value = sessionStorage.getItem(this.sessionKey + '-user');
      return value ? JSON.parse(value) as User : null;
    } catch {
      return null;
    }
  }
}
