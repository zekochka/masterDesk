import { Component, inject, signal } from '@angular/core';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { NotificationService } from '../../shared/notification.service';
import { MasterDeskService } from '../../services/masterdesk.service';

@Component({
  selector: 'app-settings',
  imports: [ConfirmDialog],
  templateUrl: './settings.html',
})
export class SettingsPage {
  private readonly data = inject(MasterDeskService);
  private readonly notification = inject(NotificationService);
  readonly confirmReset = signal(false);

  reset(): void {
    this.data.resetDemo().subscribe({
      next: () => { this.confirmReset.set(false); this.notification.success('Демонстрационные данные восстановлены'); },
      error: () => this.notification.error('Не удалось восстановить данные'),
    });
  }
}
