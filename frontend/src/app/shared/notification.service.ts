import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly message = signal('');
  readonly isError = signal(false);
  private timeout?: ReturnType<typeof setTimeout>;

  success(message: string): void {
    this.show(message, false);
  }

  error(message: string): void {
    this.show(message, true);
  }

  clear(): void {
    if (this.timeout) clearTimeout(this.timeout);
    this.message.set('');
  }

  private show(message: string, isError: boolean): void {
    this.clear();
    this.message.set(message);
    this.isError.set(isError);
    this.timeout = setTimeout(() => this.clear(), 4500);
  }
}
