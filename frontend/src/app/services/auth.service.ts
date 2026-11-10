import { computed, Injectable, signal } from '@angular/core';
import { User } from '../models/masterdesk.models';

interface StoredUser extends User {
  salt: string;
  passwordHash: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly usersKey = 'masterdesk-users-v1';
  private readonly sessionKey = 'masterdesk-session-v1';
  readonly user = signal<User | null>(this.restoreSession());
  readonly displayName = computed(() => {
    const user = this.user();
    return user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username : '';
  });

  async register(username: string, password: string): Promise<void> {
    const cleanUsername = username.trim();
    if (!cleanUsername) throw new Error('Введите логин');
    if (password.length < 8) throw new Error('Пароль должен содержать не менее 8 символов');
    const users = this.readUsers();
    if (users.some((user) => user.username.toLocaleLowerCase('ru') === cleanUsername.toLocaleLowerCase('ru'))) {
      throw new Error('Этот логин уже занят');
    }
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const user: StoredUser = {
      id: crypto.randomUUID(), username: cleanUsername, role: 'User',
      salt: this.toHex(salt), passwordHash: await this.hash(password, salt),
    };
    this.writeUsers([...users, user]);
    this.startSession(user);
  }

  async login(username: string, password: string): Promise<void> {
    const user = this.readUsers().find((item) => item.username.toLocaleLowerCase('ru') === username.trim().toLocaleLowerCase('ru'));
    if (!user || await this.hash(password, this.fromHex(user.salt)) !== user.passwordHash) {
      throw new Error('Неверный логин или пароль');
    }
    this.startSession(user);
  }

  updateProfile(profile: Pick<User, 'firstName' | 'lastName' | 'email' | 'phone'>): void {
    const current = this.user();
    if (!current) throw new Error('Войдите в аккаунт');
    const users = this.readUsers();
    const index = users.findIndex((item) => item.id === current.id);
    if (index < 0) throw new Error('Пользователь не найден');
    users[index] = { ...users[index], ...profile };
    this.writeUsers(users);
    this.user.set(this.publicUser(users[index]));
  }

  logout(): void {
    localStorage.removeItem(this.sessionKey);
    this.user.set(null);
  }

  private startSession(user: StoredUser): void {
    localStorage.setItem(this.sessionKey, user.id);
    this.user.set(this.publicUser(user));
  }

  private restoreSession(): User | null {
    try {
      const id = localStorage.getItem(this.sessionKey);
      const user = this.readUsers().find((item) => item.id === id);
      return user ? this.publicUser(user) : null;
    } catch {
      return null;
    }
  }

  private readUsers(): StoredUser[] {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(this.usersKey) ?? '[]');
      return Array.isArray(value) ? value.filter((item): item is StoredUser =>
        !!item && typeof item.id === 'string' && typeof item.username === 'string' &&
        typeof item.salt === 'string' && typeof item.passwordHash === 'string') : [];
    } catch {
      return [];
    }
  }

  private writeUsers(users: StoredUser[]): void {
    localStorage.setItem(this.usersKey, JSON.stringify(users));
  }

  private publicUser(user: StoredUser): User {
    const { id, username, role, firstName, lastName, email, phone } = user;
    return { id, username, role, firstName, lastName, email, phone };
  }

  private async hash(password: string, salt: Uint8Array<ArrayBuffer>): Promise<string> {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 150_000, hash: 'SHA-256' }, key, 256);
    return this.toHex(new Uint8Array(bits));
  }

  private toHex(bytes: Uint8Array): string {
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  private fromHex(hex: string): Uint8Array<ArrayBuffer> {
    const bytes = new Uint8Array(hex.length / 2);
    for (let index = 0; index < bytes.length; index++) bytes[index] = parseInt(hex.slice(index * 2, index * 2 + 2), 16);
    return bytes;
  }
}
