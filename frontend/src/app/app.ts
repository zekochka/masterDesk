import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { NotificationService } from './shared/notification.service';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);
  readonly notification = inject(NotificationService);
  readonly menuOpen = signal(false);
  readonly path = signal(this.router.url);
  readonly section = computed(() => {
    const path = this.path();
    if (path.startsWith('/orders')) return 'Заказы';
    if (path.startsWith('/clients')) return 'Клиенты';
    if (path.startsWith('/technicians')) return 'Мастера';
    if (path.startsWith('/settings')) return 'Настройки';
    return 'Главная';
  });
  readonly today = new Intl.DateTimeFormat('ru-KZ', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

  constructor() {
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe((event) => {
      this.path.set(event.urlAfterRedirects);
      this.menuOpen.set(false);
    });
  }
}
