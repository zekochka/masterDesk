import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RepairRequestStatus, formatDateTime } from '../../models/masterdesk.models';
import { RepairRequestService } from '../../services/repair-request.service';
import { NotificationService } from '../../shared/notification.service';

@Component({
  selector: 'app-orders',
  imports: [RouterLink],
  templateUrl: './orders.html',
})
export class OrdersPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly requests = inject(RepairRequestService);
  private readonly notification = inject(NotificationService);
  readonly mode = this.route.snapshot.routeConfig?.path === 'requests/available' ? 'available'
    : this.route.snapshot.routeConfig?.path === 'requests/assigned' ? 'assigned' : 'mine';
  readonly items = this.requests.requests;
  readonly loading = signal(true);
  readonly error = signal('');
  readonly busyId = signal<string | null>(null);
  readonly formatDateTime = formatDateTime;
  readonly statusLabels: Record<RepairRequestStatus, string> = {
    new: 'Новая', accepted: 'Принята', completed: 'Завершена',
  };

  ngOnInit(): void { void this.reload(); }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      if (this.mode === 'available') await this.requests.loadAvailable();
      else if (this.mode === 'assigned') await this.requests.loadAssigned();
      else await this.requests.loadMine();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Не удалось загрузить заявки');
    } finally {
      this.loading.set(false);
    }
  }

  async act(id: string): Promise<void> {
    this.busyId.set(id);
    try {
      if (this.mode === 'available') await this.requests.accept(id);
      else await this.requests.complete(id);
      this.notification.success(this.mode === 'available' ? 'Заявка принята' : 'Ремонт завершён');
    } catch (error) {
      this.notification.error(error instanceof Error ? error.message : 'Не удалось изменить статус');
      await this.reload();
    } finally {
      this.busyId.set(null);
    }
  }
}
