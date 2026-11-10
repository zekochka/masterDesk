import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { USER_ROLE_LABELS } from './models/masterdesk.models';
import { AuthService } from './services/auth.service';
import { NotificationService } from './shared/notification.service';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly notification = inject(NotificationService);
  readonly roleLabels = USER_ROLE_LABELS;
  readonly menuOpen = signal(false);
  readonly requestsOpen = signal(this.router.url.startsWith('/requests'));
  readonly path = signal(this.router.url);
  readonly section = computed(() => {
    const path = this.path();
    if (path.startsWith('/shop')) return 'Магазин';
    if (path.startsWith('/requests')) return 'Заявки';
    if (path.startsWith('/settings')) return 'Настройки';
    if (path.startsWith('/login')) return 'Вход';
    if (path.startsWith('/register')) return 'Регистрация';
    return 'Главная';
  });

  constructor() {
    void this.auth.refreshProfile();
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe((event) => {
      this.path.set(event.urlAfterRedirects);
      if (event.urlAfterRedirects.startsWith('/requests')) this.requestsOpen.set(true);
      this.menuOpen.set(false);
    });
  }

  logout(): void {
    this.auth.logout();
    this.menuOpen.set(false);
    void this.router.navigateByUrl('/');
  }
}
